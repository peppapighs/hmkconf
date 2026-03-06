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
  import { keyboardContext } from "$lib/keyboard"
  import { cn, type WithoutChildren } from "$lib/utils"
  import type { HTMLAttributes } from "svelte/elements"
  import * as ToggleGroup from "./ui/toggle-group"

  let {
    class: className,
    disabled,
    numLayers = keyboardContext.get().metadata.numLayers,
    layer = $bindable(0),
    onLayerChange,
    ...props
  }: WithoutChildren<HTMLAttributes<HTMLDivElement>> & {
    disabled?: boolean
    numLayers?: number
    layer?: number
    onLayerChange?: (layer: number) => void
  } = $props()
</script>

<div class={cn("flex items-center gap-2", className)} {...props}>
  <span class={cn("text-sm font-medium", disabled && "opacity-50")}>
    Layer
  </span>
  <ToggleGroup.Root
    bind:value={
      () => String(layer),
      (v) => {
        if (v === "") return
        layer = Number(v)
        onLayerChange?.(layer)
      }
    }
    {disabled}
    type="single"
    variant="outline"
  >
    {#each { length: numLayers }, i (i)}
      <ToggleGroup.Item class="size-8 p-0" value={String(i)}>
        {i}
      </ToggleGroup.Item>
    {/each}
  </ToggleGroup.Root>
</div>
