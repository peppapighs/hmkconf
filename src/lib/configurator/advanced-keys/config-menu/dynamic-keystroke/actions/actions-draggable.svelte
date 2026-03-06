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
  import {
    DKS_ACTION_SIZE,
    getDKSIntervalLeft,
    getDKSIntervalWidth,
    intervalsToBitmap,
  } from "$lib/configurator/lib/advanced-keys"
  import { dksActionsStateContext } from "./context.svelte"

  const { col }: { col: number } = $props()

  const dksActionsState = dksActionsStateContext.get()
  const { currentBitmap, intervals, updateBitmap } = $derived(dksActionsState)

  const index = $derived(intervals.findIndex(([l]) => l === col))
  const interval: [number, number] = $derived(
    index === -1 ? [col, col] : intervals[index],
  )
  const intervalLeft = $derived(getDKSIntervalLeft(interval))
  const intervalWidth = $derived(getDKSIntervalWidth(interval))

  let isDragging = $state(false)
  let draggableLeft = $state(0)

  const updateCurrentBitmap = () => {
    const upperBound = intervals.find(([l]) => l > col)?.[0] ?? 3
    const currBarWidth = Math.min(
      draggableLeft + intervalWidth - (index === -1 ? DKS_ACTION_SIZE / 2 : 0),
      getDKSIntervalWidth([col, upperBound]),
    )

    let closestCol = col
    let closestDistance = currBarWidth

    for (let i = col + 1; i <= upperBound; i++) {
      const distance = Math.abs(getDKSIntervalWidth([col, i]) - currBarWidth)

      if (distance < closestDistance) {
        closestCol = i
        closestDistance = distance
      }
    }

    const newIntervals = [...intervals]
    if (index === -1) {
      newIntervals.push([col, closestCol])
      newIntervals.sort(([a], [b]) => a - b)
    } else {
      newIntervals[index] = [col, closestCol]
    }
    dksActionsState.currentBitmap = intervalsToBitmap(newIntervals)
  }

  const onmousedown = () => {
    isDragging = true
    updateCurrentBitmap()
  }

  const onmousemove = (e: MouseEvent) => {
    if (!isDragging) return
    draggableLeft += e.movementX
    updateCurrentBitmap()
  }

  const onmouseup = () => {
    if (!isDragging) return
    isDragging = false
    draggableLeft = 0
    updateBitmap(currentBitmap)
  }
</script>

<svelte:document {onmousemove} {onmouseup} />

{#if intervals.every(([l, r]) => l >= col || col >= r)}
  {#if index === -1}
    <div
      class="absolute top-1/2 z-30 -translate-y-1/2 rounded-full"
      {onmousedown}
      role="none"
      style="
        left: {intervalLeft + draggableLeft}px;
        width: {DKS_ACTION_SIZE}px;
        height: {DKS_ACTION_SIZE}px;
      "
    ></div>
  {:else}
    <div
      class="absolute top-1/2 z-30 h-4 w-3 -translate-1/2 rounded-xs"
      {onmousedown}
      role="none"
      style="left: {intervalLeft + intervalWidth + draggableLeft}px"
    ></div>
  {/if}
{/if}
