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
  import { HMK_AKType, type HMK_AdvancedKey } from "$lib/libhmk/advanced-keys"
  import { cn, type WithoutChildren } from "$lib/utils"
  import type { HTMLAttributes } from "svelte/elements"
  import { ConfigMenuState, configMenuStateContext } from "./context.svelte"
  import DynamicKeystrokeConfigMenu from "./dynamic-keystroke/dynamic-keystroke-config-menu.svelte"
  import NullBindConfigMenu from "./null-bind/null-bind-config-menu.svelte"
  import TapHoldConfigMenu from "./tap-hold/tap-hold-config-menu.svelte"
  import ToggleConfigMenu from "./toggle/toggle-config-menu.svelte"

  const {
    class: className,
    index,
    advancedKey,
    ...props
  }: WithoutChildren<HTMLAttributes<HTMLDivElement>> & {
    index: number
    advancedKey: HMK_AdvancedKey
  } = $props()

  const {
    action: { type },
  } = $derived(advancedKey)

  configMenuStateContext.set(
    new ConfigMenuState(() => ({ index, advancedKey })),
  )
</script>

<div
  class={cn("grid flex-1 grid-cols-[30rem_minmax(0,1fr)]", className)}
  {...props}
>
  {#if type === HMK_AKType.NULL_BIND}
    <NullBindConfigMenu />
  {:else if type === HMK_AKType.DYNAMIC_KEYSTROKE}
    <DynamicKeystrokeConfigMenu />
  {:else if type === HMK_AKType.TAP_HOLD}
    <TapHoldConfigMenu />
  {:else if type === HMK_AKType.TOGGLE}
    <ToggleConfigMenu />
  {/if}
</div>
