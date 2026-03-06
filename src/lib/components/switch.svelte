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
  import { InfoIcon } from "@lucide/svelte"
  import { cn, type WithoutChildren } from "$lib/utils"
  import type { HTMLAttributes } from "svelte/elements"
  import { Label } from "./ui/label"
  import { Switch } from "./ui/switch"
  import * as Tooltip from "./ui/tooltip"

  let {
    class: className,
    disabled,
    id,
    title,
    tooltip,
    description,
    checked = $bindable(false),
    ref = $bindable(null),
    onCheckedChange,
    ...props
  }: WithoutChildren<HTMLAttributes<HTMLDivElement>> & {
    disabled?: boolean
    id: string
    title: string
    tooltip?: string
    description?: string
    checked?: boolean
    ref?: HTMLElement | null
    onCheckedChange?: (checked: boolean) => void
  } = $props()
</script>

<div class={cn("grid gap-1", className)} {...props}>
  <div class="flex items-center gap-2">
    <Switch bind:checked bind:ref {disabled} {id} {onCheckedChange} />
    <Label for={id}>{title}</Label>
    {#if tooltip}
      <Tooltip.Root>
        <Tooltip.Trigger>
          <InfoIcon class="size-4" />
          <span class="sr-only">Info</span>
        </Tooltip.Trigger>
        <Tooltip.Content class="max-w-56 text-wrap">
          {tooltip}
        </Tooltip.Content>
      </Tooltip.Root>
    {/if}
  </div>
  {#if description}
    <p
      class={cn(
        "text-sm text-wrap text-muted-foreground",
        disabled && "opacity-50",
      )}
    >
      {description}
    </p>
  {/if}
</div>
