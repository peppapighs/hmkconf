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
  import { cn, type WithoutChildren } from "$lib/utils"
  import type { HTMLAttributes } from "svelte/elements"
  import { Slider } from "./ui/slider"

  let {
    class: className,
    disabled,
    title,
    description,
    min,
    max,
    step,
    committed = $bindable(),
    display,
    onCommit,
    ...props
  }: WithoutChildren<HTMLAttributes<HTMLDivElement>> & {
    disabled?: boolean
    title: string
    description?: string
    min?: number
    max?: number
    step?: number
    committed?: number
    display?: (v: number) => string
    onCommit?: (v: number) => void
  } = $props()

  let value = $state(0)

  $effect(() => {
    if (committed !== undefined) {
      value = committed
    }
  })
</script>

<div class={cn("flex flex-col", className)} {...props}>
  <div class={cn("grid text-sm text-wrap", disabled && "opacity-50")}>
    <span class="font-medium">
      {title}: {display?.(value) ?? value}
    </span>
    {#if description}
      <span class="text-muted-foreground">{description}</span>
    {/if}
  </div>
  <Slider
    bind:value
    class="mt-3"
    {disabled}
    {min}
    {max}
    onValueCommit={(v) => {
      committed = v
      onCommit?.(v)
    }}
    {step}
    type="single"
  />
</div>
