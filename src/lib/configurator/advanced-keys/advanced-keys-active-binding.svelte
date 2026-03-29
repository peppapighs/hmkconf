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
  import { EditIcon, TrashIcon } from "@lucide/svelte"
  import * as KeycodeButton from "$lib/components/keycode-button"
  import { Button } from "$lib/components/ui/button"
  import { ScrollArea } from "$lib/components/ui/scroll-area"
  import { HMK_AKType, type HMK_AdvancedKey } from "$lib/libhmk/advanced-keys"
  import { Keycode } from "$lib/libhmk/keycodes"
  import { unitToStyle } from "$lib/ui"
  import { cn, type WithoutChildren } from "$lib/utils"
  import type { Snippet } from "svelte"
  import type { HTMLAttributes } from "svelte/elements"
  import { advancedKeysStateContext } from "../context.svelte"
  import {
    getAdvancedKeyMetadata,
    getNullBindBehaviorMetadata,
  } from "../lib/advanced-keys"
  import { keymapQueryContext } from "../queries/keymap-query.svelte"
  import AdvancedKeysDeleteDialog from "./advanced-keys-delete-dialog.svelte"

  const {
    class: className,
    index,
    advancedKey,
    ...props
  }: WithoutChildren<HTMLAttributes<HTMLDivElement>> & {
    index: number
    advancedKey: HMK_AdvancedKey
  } = $props()

  const advancedKeysState = advancedKeysStateContext.get()

  const { current: keymap } = $derived(keymapQueryContext.get().keymap)

  const { layer, key, action } = $derived(advancedKey)
  const { icon: Icon } = $derived(getAdvancedKeyMetadata(action.type))
  const keys = $derived.by(() => {
    const ret = [key]
    if (action.type === HMK_AKType.NULL_BIND) {
      ret.push(action.secondaryKey)
    }
    return ret
  })
  const display = $derived.by(() => {
    switch (action.type) {
      case HMK_AKType.NULL_BIND:
        return getNullBindBehaviorMetadata(action.behavior).title
      case HMK_AKType.DYNAMIC_KEYSTROKE:
        return action.keycodes.filter((keycode) => keycode !== Keycode.KC_NO)
      case HMK_AKType.TAP_HOLD:
        return [action.tapKeycode, action.holdKeycode]
      case HMK_AKType.TOGGLE:
        return [action.keycode]
      default:
        return []
    }
  })
</script>

<div
  class={cn(
    "flex w-full divide-x rounded-md border bg-card shadow-xs select-none",
    className,
  )}
  {...props}
>
  <div class="grid shrink-0 grid-cols-2 p-2 text-xs">
    {#each keys as key, i (i)}
      <div class="p-0.5" style={unitToStyle()}>
        {#if !keymap}
          <KeycodeButton.Skeleton />
        {:else}
          <KeycodeButton.Root keycode={keymap[layer][key]}>
            {#snippet child({ props: { children, ...props } })}
              <div {...props}>{@render (children as Snippet)?.()}</div>
            {/snippet}
          </KeycodeButton.Root>
        {/if}
      </div>
    {/each}
  </div>
  <div class="flex min-w-0 flex-1 gap-2 p-2">
    <div class="grid aspect-square shrink-0 place-items-center">
      <Icon class="size-6" />
    </div>
    {#if typeof display === "string"}
      <ScrollArea class="min-w-0 flex-1" orientation="horizontal">
        <div class="flex min-w-max items-center px-0.5 pb-2 text-sm font-medium">
          {display}
        </div>
      </ScrollArea>
    {:else}
      <ScrollArea class="min-w-0 flex-1" orientation="horizontal">
        <div class="flex min-w-max items-center pb-2 text-xs">
          {#each display as keycode, i (i)}
            <div class="shrink-0 p-0.5" style={unitToStyle()}>
              <KeycodeButton.Root {keycode}>
                {#snippet child({ props: { children, ...props } })}
                  <div {...props}>{@render (children as Snippet)?.()}</div>
                {/snippet}
              </KeycodeButton.Root>
            </div>
          {/each}
        </div>
      </ScrollArea>
    {/if}
  </div>
  <div class="flex shrink-0 items-center gap-2 p-2">
    <Button
      onclick={() => {
        advancedKeysState.setLayer(layer)
        advancedKeysState.setIndex(index)
      }}
      size="icon"
      variant="outline"
    >
      <EditIcon />
      <span class="sr-only">Edit</span>
    </Button>
    <AdvancedKeysDeleteDialog {index} {advancedKey}>
      {#snippet child({ props })}
        <Button size="icon" variant="outline" {...props}>
          <TrashIcon />
          <span class="sr-only">Delete</span>
        </Button>
      {/snippet}
    </AdvancedKeysDeleteDialog>
  </div>
</div>
