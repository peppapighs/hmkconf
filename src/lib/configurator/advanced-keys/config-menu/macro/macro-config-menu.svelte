<!--
This program is free software: you can redistribute it and/or modify it under
the terms of the GNU General Public License as published by the Free Software
Foundation, either version 3 of the License, or (at your option) any later
version.

This program is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
FOR A PARTICULAR PURPOSE. See the GNU General Public License for more
details.

You should have received a copy of the GNU General Public License along with
this program. If not, see <https://www.gnu.org/licenses/>.
-->

<script lang="ts">
  import { PlusIcon, TrashIcon } from "@lucide/svelte"
  import FixedScrollArea from "$lib/components/fixed-scroll-area.svelte"
  import KeycodeAccordion from "$lib/components/keycode-accordion.svelte"
  import { KeycodeButton } from "$lib/components/keycode-button"
  import { Button } from "$lib/components/ui/button"
  import { Input } from "$lib/components/ui/input"
  import { advancedKeysQueryContext } from "$lib/configurator/queries/advanced-keys-query.svelte"
  import { macrosQueryContext } from "$lib/configurator/queries/macros-query.svelte"
  import { keyboardContext } from "$lib/keyboard"
  import {
    HMK_AKType,
    HMK_MacroAction,
    MACRO_NODE_NONE,
    type HMK_AKMacro,
    type HMK_MacroStep,
  } from "$lib/libhmk/advanced-keys"
  import { Keycode } from "$lib/libhmk/keycodes"
  import { unitToStyle } from "$lib/ui"
  import { ToggleGroup } from "bits-ui"
  import { configMenuStateContext } from "../context.svelte"

  const configMenuState = configMenuStateContext.get()
  const advancedKeysQuery = advancedKeysQueryContext.get()
  const macrosQuery = macrosQueryContext.get()
  const keyboard = keyboardContext.get()
  const {
    macroBufferSize,
    macroNodeCount,
    macroNodeSize,
    macroDelayUnitMs,
  } = keyboard.metadata

  const action = $derived(
    configMenuState.advancedKey.action as HMK_AKMacro,
  )
  const advancedKeys = $derived(advancedKeysQuery.advancedKeys.current)
  const macros = $derived(macrosQuery.macros.current)
  let selectedStep = $state<string>("")
  let loadedKey = $state("")
  let draftSteps = $state<HMK_MacroStep[]>([])

  function getNodeOffset(node: number) {
    return node * macroNodeSize
  }

  function readNodeNext(node: number) {
    if (!macros || node >= macroNodeCount) {
      return MACRO_NODE_NONE
    }

    const offset = getNodeOffset(node)
    if (offset + 4 >= macros.length) {
      return MACRO_NODE_NONE
    }

    return macros[offset + 3] | (macros[offset + 4] << 8)
  }

  function decodeSteps() {
    if (!macros || action.firstNode === MACRO_NODE_NONE) return []

    const ret: HMK_MacroStep[] = []
    let node = action.firstNode
    const visited = new Set<number>()
    while (
      node !== MACRO_NODE_NONE &&
      node < macroNodeCount &&
      !visited.has(node)
    ) {
      visited.add(node)
      const offset = getNodeOffset(node)
      ret.push({
        keycode: macros[offset] ?? Keycode.KC_NO,
        action: macros[offset + 1] ?? HMK_MacroAction.TAP,
        delay: macros[offset + 2] ?? 1,
      })
      node = readNodeNext(node)
    }
    return ret
  }

  function encodeNode(
    { keycode, action, delay }: HMK_MacroStep,
    next: number,
  ) {
    return [
      keycode,
      action,
      delay,
      next & 0xff,
      (next >> 8) & 0xff,
    ]
  }

  const savedSteps = $derived(decodeSteps())
  const draftNodes = $derived(allocateMacro(draftSteps))
  const hasStorageError = $derived(draftNodes === null)
  const hasUnsavedChanges = $derived(
    draftSteps.length !== savedSteps.length ||
      draftSteps.some(
        (step, i) =>
          step.keycode !== savedSteps[i]?.keycode ||
          step.action !== savedSteps[i]?.action ||
          step.delay !== savedSteps[i]?.delay,
      ),
  )

  $effect(() => {
    if (!macros) return

    const key = `${action.firstNode}:${savedSteps
      .map(({ keycode, action, delay }) => `${keycode}:${action}:${delay}`)
      .join(",")}`
    if (key === loadedKey) return

    draftSteps = savedSteps
    selectedStep = ""
    loadedKey = key
  })

  function markReachableNodes(firstNode: number, used: boolean[]) {
    let node = firstNode
    const visited = new Set<number>()
    while (
      node !== MACRO_NODE_NONE &&
      node < macroNodeCount &&
      !visited.has(node)
    ) {
      visited.add(node)
      used[node] = true
      node = readNodeNext(node)
    }
  }

  function allocateMacro(steps: HMK_MacroStep[]) {
    if (!advancedKeys || !macros) return null
    if (steps.length === 0) return []

    const used = Array(macroNodeCount).fill(false)
    for (const [i, advancedKey] of advancedKeys.entries()) {
      if (i === configMenuState.index) continue

      const otherAction = advancedKey.action
      if (otherAction.type !== HMK_AKType.MACRO) continue
      markReachableNodes(otherAction.firstNode, used)
    }

    const nodes: number[] = []
    for (let node = 0; node < used.length && nodes.length < steps.length; node++) {
      if (!used[node]) nodes.push(node)
    }

    return nodes.length === steps.length ? nodes : null
  }

  async function commitDraftSteps() {
    if (!macros) return

    const nodes = draftNodes
    if (nodes === null) return

    if (draftSteps.length > 0) {
      const data = [...macros]
      for (let i = 0; i < draftSteps.length; i++) {
        const node = nodes[i]
        const next = nodes[i + 1] ?? MACRO_NODE_NONE
        const offset = getNodeOffset(node)
        data.splice(offset, macroNodeSize, ...encodeNode(draftSteps[i], next))
      }
      await macrosQuery.set({
        offset: 0,
        data: data.slice(0, macroBufferSize),
      })
    }
    await configMenuState.updateAction({
      type: HMK_AKType.MACRO,
      firstNode: nodes[0] ?? MACRO_NODE_NONE,
    })
  }

  $effect(() => {
    configMenuState.setSave(async () => {
      if (hasUnsavedChanges) {
        await commitDraftSteps()
      }
    })

    return () => {
      configMenuState.setSave(null)
      configMenuState.setCanSave(true)
    }
  })

  $effect(() => {
    configMenuState.setCanSave(!hasStorageError)
  })

  function updateStep(index: number, patch: Partial<HMK_MacroStep>) {
    draftSteps = draftSteps.map((step, i) =>
      i === index ? { ...step, ...patch } : step,
    )
  }

  function removeStep(index: number) {
    draftSteps = draftSteps.filter((_, i) => i !== index)
  }

  function addStep(keycode = Keycode.KC_NO) {
    draftSteps = [
      ...draftSteps,
      {
        keycode,
        action: HMK_MacroAction.TAP,
        delay: 1,
      },
    ]
  }

  function selectKeycode(keycode: number) {
    const index = Number(selectedStep)
    if (selectedStep === "" || !Number.isInteger(index)) {
      addStep(keycode)
    } else {
      updateStep(index, { keycode })
      selectedStep = ""
    }
  }

  function delayUnitsToMs(delay: number) {
    return delay * macroDelayUnitMs
  }

  function delayMsToUnits(delayMs: number) {
    return Math.max(
      0,
      Math.min(255, Math.round(delayMs / macroDelayUnitMs)),
    )
  }
</script>

<FixedScrollArea class="flex flex-col gap-4 p-4 pt-0">
  <div class="grid text-sm">
    <span class="font-medium">Configure Macro Bindings</span>
    <span class="text-muted-foreground">
      Assign macro steps using the menu on the right. Click a keycode in the
      macro to edit it, then press Done to save. Delay values are in
      milliseconds.
    </span>
  </div>

  {#if hasStorageError}
    <div
      class="rounded-md border border-destructive/40 px-3 py-2 text-sm text-destructive"
    >
      Not enough macro storage in this profile.
    </div>
  {/if}

  {#if draftSteps.length > 0}
    <div
      class="grid grid-cols-[5rem_minmax(0,1fr)_5rem_2.25rem] items-center gap-2 text-sm font-medium"
    >
      <span class="text-center">Key</span>
      <span>Action</span>
      <span class="text-center">Delay (ms)</span>
      <span class="sr-only">Delete</span>
    </div>
  {/if}

  <ToggleGroup.Root
    bind:value={selectedStep}
    class="flex flex-col gap-2"
    type="single"
  >
    {#each draftSteps as step, i (i)}
      <div
        class="grid grid-cols-[5rem_minmax(0,1fr)_5rem_2.25rem] items-center gap-2 rounded-md border p-2"
      >
        <ToggleGroup.Item value={String(i)}>
          {#snippet child({ props })}
            <div class="grid place-items-center p-0.5" style={unitToStyle()}>
              <KeycodeButton
                keycode={step.keycode}
                oncontextmenu={(e) => {
                  e.preventDefault()
                  updateStep(i, { keycode: Keycode.KC_NO })
                }}
                {...props}
              />
            </div>
          {/snippet}
        </ToggleGroup.Item>
        <select
          class="h-9 rounded-md border bg-background px-2 text-sm"
          value={step.action}
          onchange={(e) =>
            updateStep(i, {
              action: Number(e.currentTarget.value),
            })}
        >
          <option value={HMK_MacroAction.PRESS}>Press</option>
          <option value={HMK_MacroAction.TAP}>Tap</option>
          <option value={HMK_MacroAction.RELEASE}>Release</option>
        </select>
        <Input
          max={String(255 * macroDelayUnitMs)}
          min="0"
          step={String(macroDelayUnitMs)}
          type="number"
          value={delayUnitsToMs(step.delay)}
          oninput={(e) =>
            updateStep(i, {
              delay: delayMsToUnits(Number(e.currentTarget.value)),
            })}
        />
        <Button
          onclick={() => {
            if (selectedStep === String(i)) selectedStep = ""
            removeStep(i)
          }}
          size="icon"
          variant="outline"
        >
          <TrashIcon />
          <span class="sr-only">Delete Step</span>
        </Button>
      </div>
    {:else}
      <div
        class="rounded-md border border-dashed p-4 text-sm text-muted-foreground"
      >
        Select a keycode to add the first tap step.
      </div>
    {/each}
  </ToggleGroup.Root>

  <Button onclick={() => addStep()} size="sm" variant="outline">
    <PlusIcon />
    Add Empty Step
  </Button>
</FixedScrollArea>

<FixedScrollArea class="flex flex-col gap-4 p-4 pt-0">
  <KeycodeAccordion onKeycodeSelected={selectKeycode} />
</FixedScrollArea>
