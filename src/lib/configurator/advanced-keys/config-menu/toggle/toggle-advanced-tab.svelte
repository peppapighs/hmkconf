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
  import CommitSlider from "$lib/components/commit-slider.svelte"
  import {
    MAX_TAPPING_TERM,
    MIN_TAPPING_TERM,
    type HMK_AKToggle,
  } from "$lib/libhmk/advanced-keys"
  import { cn, type WithoutChildren } from "$lib/utils"
  import type { HTMLAttributes } from "svelte/elements"
  import { configMenuStateContext } from "../context.svelte"

  const {
    class: className,
    ...props
  }: WithoutChildren<HTMLAttributes<HTMLDivElement>> = $props()

  const configMenuState = configMenuStateContext.get()
  const action = $derived(configMenuState.advancedKey.action as HMK_AKToggle)
</script>

<div class={cn("flex flex-col gap-4", className)} {...props}>
  <CommitSlider
    bind:committed={
      () => action.tappingTerm,
      (v) => configMenuState.updateAction({ ...action, tappingTerm: v })
    }
    description="Set the duration the key must be held to perform the normal key behavior."
    display={(v) => `${v}ms`}
    min={MIN_TAPPING_TERM}
    max={MAX_TAPPING_TERM}
    step={10}
    title="Tapping Term"
  />
</div>
