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
  import { GripVerticalIcon } from "@lucide/svelte"
  import {
    DKS_ACTION_SIZE,
    getDKSIntervalLeft,
    getDKSIntervalWidth,
    intervalsToBitmap,
  } from "$lib/configurator/lib/advanced-keys"
  import { dksActionsStateContext } from "./context.svelte"

  const { index }: { index: number } = $props()

  const { currentIntervals, updateBitmap } = $derived(
    dksActionsStateContext.get(),
  )
  const interval = $derived(currentIntervals[index])
  const intervalLeft = $derived(getDKSIntervalLeft(interval))
  const intervalWidth = $derived(getDKSIntervalWidth(interval))
</script>

<button
  class="absolute top-1/2 z-10 -translate-y-1/2 rounded-full bg-primary shadow-xs"
  onclick={() =>
    updateBitmap(
      intervalsToBitmap(currentIntervals.filter((_, i) => i !== index)),
    )}
  style="
    left: {intervalLeft}px;
    width: {intervalWidth}px;
    height: {DKS_ACTION_SIZE}px;
  "
>
  <span class="sr-only">Delete Action</span>
</button>
<div
  class="absolute top-1/2 z-20 flex h-4 w-3 -translate-1/2 items-center justify-center rounded-xs border bg-accent"
  style="left: {intervalLeft + intervalWidth}px"
>
  <GripVerticalIcon className="size-2.5" />
</div>
