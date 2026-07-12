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
  import { PlusIcon } from "@lucide/svelte"
  import FixedScrollArea from "$lib/components/fixed-scroll-area.svelte"
  import { Button } from "$lib/components/ui/button"
  import * as Empty from "$lib/components/ui/empty"
  import * as Tabs from "$lib/components/ui/tabs"
  import {
    findEmptyMacroNode,
    getMacroSequence,
  } from "$lib/configurator/lib/advanced-keys"
  import { macrosQueryContext } from "$lib/configurator/queries/macros-query.svelte"
  import type { HMK_AKMacro } from "$lib/libhmk/advanced-keys"
  import { Keycode } from "$lib/libhmk/keycodes"
  import { HMK_MACRO_NODE_NONE, HMK_MacroAction } from "$lib/libhmk/macro"
  import { numberNullable, stringNullable } from "$lib/utils"
  import { ToggleGroup } from "bits-ui"
  import { configMenuStateContext } from "../context.svelte"
  import KeyTesterTab from "../key-tester-tab.svelte"
  import TickRateSlider from "../tick-rate-slider.svelte"
  import {
    MacroConfigMenuState,
    macroConfigMenuStateContext,
  } from "./context.svelte"
  import MacroBindingsTab from "./macro-bindings-tab.svelte"
  import MacroNode from "./macro-node.svelte"

  const macroConfigMenuState = macroConfigMenuStateContext.set(
    new MacroConfigMenuState(),
  )

  const configMenuState = configMenuStateContext.get()
  const action = $derived(configMenuState.advancedKey.action as HMK_AKMacro)
  const { advancedKeys, macros } = $derived(configMenuState)
  const { macroNodeId } = $derived(macroConfigMenuState)
  const macrosQuery = macrosQueryContext.get()

  const macroSequence = $derived(getMacroSequence(macros, action.head))
  const emptyMacroNode = $derived(findEmptyMacroNode(macros, advancedKeys))
</script>

<FixedScrollArea class="flex flex-col gap-4 p-4 pt-0">
  <div class="grid text-sm">
    <span class="font-medium">Configure Macro Actions</span>
    <span class="text-muted-foreground">
      Create a sequence of actions to be triggered when the key is pressed.
      Assign bindings for each action using the menu on the right.
    </span>
  </div>
  <div class="flex flex-col gap-4">
    <div class="flex justify-end">
      <Button
        disabled={emptyMacroNode === null}
        onclick={async () => {
          if (emptyMacroNode === null) return
          await macrosQuery.set({
            offset: emptyMacroNode,
            data: [
              {
                keycode: Keycode.KC_NO,
                action: HMK_MacroAction.TAP,
                delay: 0,
                next: HMK_MACRO_NODE_NONE,
              },
            ],
          })
          if (macroSequence.length === 0) {
            await configMenuState.updateAction({
              ...action,
              head: emptyMacroNode,
            })
          } else {
            const tail = macroSequence[macroSequence.length - 1]
            await macrosQuery.set({
              offset: tail,
              data: [{ ...macros[tail], next: emptyMacroNode }],
            })
          }
        }}
        size="sm"
        variant="outline"
      >
        <PlusIcon /> Add
      </Button>
    </div>
    {#if macroSequence.length === 0}
      <Empty.Root class="border border-dashed">
        <Empty.Header>
          <Empty.Description>No macro actions...</Empty.Description>
        </Empty.Header>
      </Empty.Root>
    {:else}
      <ToggleGroup.Root
        bind:value={
          () => stringNullable(macroNodeId),
          (v) => (macroConfigMenuState.macroNodeId = numberNullable(v))
        }
        class="grid grid-flow-row auto-rows-[1fr] gap-2"
        type="single"
      >
        {#each macroSequence as macroNodeId, i (macroNodeId)}
          <MacroNode
            {macroNodeId}
            prevNodeId={i === 0 ? null : macroSequence[i - 1]}
          />
        {/each}
      </ToggleGroup.Root>
    {/if}
  </div>
</FixedScrollArea>
<FixedScrollArea class="flex flex-col gap-4 p-4 pt-0">
  <Tabs.Root value="bindings">
    <Tabs.List>
      <Tabs.Trigger value="bindings">Bindings</Tabs.Trigger>
      <Tabs.Trigger value="advanced">Advanced</Tabs.Trigger>
      <Tabs.Trigger value="key-tester">Key Tester</Tabs.Trigger>
    </Tabs.List>
    <div class="p-2">
      <Tabs.Content value="bindings">
        {#snippet child({ props })}
          <MacroBindingsTab {...props} />
        {/snippet}
      </Tabs.Content>
      <Tabs.Content value="advanced">
        {#snippet child({ props })}
          <TickRateSlider {...props} />
        {/snippet}
      </Tabs.Content>
      <Tabs.Content value="key-tester">
        {#snippet child({ props })}
          <KeyTesterTab {...props} />
        {/snippet}
      </Tabs.Content>
    </div>
  </Tabs.Root>
</FixedScrollArea>
