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
  import { TrashIcon } from "@lucide/svelte"
  import { KeycodeButton } from "$lib/components/keycode-button"
  import { Button } from "$lib/components/ui/button"
  import { Input } from "$lib/components/ui/input"
  import * as ToggleGroupUI from "$lib/components/ui/toggle-group"
  import { macroActions } from "$lib/configurator/lib/advanced-keys"
  import { macrosQueryContext } from "$lib/configurator/queries/macros-query.svelte"
  import type { HMK_AKMacro } from "$lib/libhmk/advanced-keys"
  import { Keycode } from "$lib/libhmk/keycodes"
  import { HMK_MAX_MACRO_DELAY } from "$lib/libhmk/macro"
  import { unitToStyle } from "$lib/ui"
  import { cn, type WithoutChild } from "$lib/utils"
  import { ToggleGroup } from "bits-ui"
  import type { HTMLAttributes } from "svelte/elements"
  import z from "zod"
  import { configMenuStateContext } from "../context.svelte"

  const {
    class: className,
    prevNodeId,
    macroNodeId,
    ...props
  }: WithoutChild<HTMLAttributes<HTMLDivElement>> & {
    prevNodeId: number | null
    macroNodeId: number
  } = $props()

  const configMenuState = configMenuStateContext.get()
  const action = $derived(configMenuState.advancedKey.action as HMK_AKMacro)
  const { macros } = $derived(configMenuState)
  const macrosQuery = macrosQueryContext.get()

  const macroNode = $derived(macros[macroNodeId])

  const delaySchema = z.coerce.number().min(0).max(HMK_MAX_MACRO_DELAY)
</script>

<div
  class={cn(
    "flex w-full divide-x rounded-md border bg-card shadow-xs select-none",
    className,
  )}
  {...props}
>
  <div class="flex shrink-0 items-center justify-center p-2 text-xs">
    <div class="p-0.5" style={unitToStyle()}>
      <ToggleGroup.Item value={String(macroNodeId)}>
        {#snippet child({ props })}
          <KeycodeButton
            keycode={macroNode.keycode}
            oncontextmenu={(e) => {
              e.preventDefault()
              macrosQuery.set({
                offset: macroNodeId,
                data: [{ ...macroNode, keycode: Keycode.KC_NO }],
              })
            }}
            {...props}
          />
        {/snippet}
      </ToggleGroup.Item>
    </div>
  </div>
  <div
    class="grid flex-1 auto-rows-[1fr] grid-cols-[max-content_1fr] items-center gap-2 p-2 pl-3 text-sm font-medium"
  >
    <span>Action</span>
    <ToggleGroupUI.Root
      bind:value={
        () => String(macroNode.action),
        (v) => {
          macrosQuery.set({
            offset: macroNodeId,
            data: [{ ...macroNode, action: Number(v) }],
          })
        }
      }
      size="sm"
      type="single"
      variant="outline"
    >
      {#each Object.entries(macroActions) as [actionName, action] (action)}
        <ToggleGroupUI.Item value={String(action)}>
          {actionName}
        </ToggleGroupUI.Item>
      {/each}
    </ToggleGroupUI.Root>
    <span>Delay</span>
    <div class="flex items-center gap-2">
      <Input
        bind:value={
          () => String(macroNode.delay),
          (v) => {
            const result = delaySchema.safeParse(v)
            if (result.success) {
              macrosQuery.set({
                offset: macroNodeId,
                data: [{ ...macroNode, delay: result.data }],
              })
            }
          }
        }
        type="number"
        class="w-36"
      />
      <span>ms</span>
    </div>
  </div>
  <div class="flex shrink-0 items-center p-2">
    <Button
      onclick={() => {
        if (prevNodeId === null) {
          configMenuState.updateAction({ ...action, head: macroNode.next })
        } else {
          macrosQuery.set({
            offset: prevNodeId,
            data: [{ ...macros[prevNodeId], next: macroNode.next }],
          })
        }
      }}
      size="icon"
      variant="outline"
    >
      <TrashIcon />
      <span class="sr-only">Delete</span>
    </Button>
  </div>
</div>
