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
  import * as Tooltip from "$lib/components/ui/tooltip"
  import {
    CURVE_VIEW_HEIGHT,
    CURVE_VIEW_WIDTH,
    viewCurveToAnalog,
  } from "$lib/configurator/lib/gamepad"
  import { gamepadQueryContext } from "$lib/configurator/queries/gamepad-query.svelte"
  import { displayDistance } from "$lib/distance"
  import { clamp } from "$lib/utils"
  import { analogCurveStateContext } from "./context.svelte"

  const { index }: { index: number } = $props()

  const analogCurveState = analogCurveStateContext.get()
  const { viewCurve } = $derived(analogCurveState)
  const analogCurve = $derived(viewCurveToAnalog(viewCurve))

  const gamepadQuery = gamepadQueryContext.get()
  const { current: options } = $derived(gamepadQuery.gamepadOptions)

  let isDragging = $state(false)
  let tooltipOpen = $state(false)

  const onmousemove = (e: MouseEvent) => {
    if (!isDragging) return
    analogCurveState.viewCurve[index] = {
      x: clamp(viewCurve[index].x + e.movementX, [
        viewCurve[index - 1]?.x ?? 0,
        viewCurve[index + 1]?.x ?? CURVE_VIEW_WIDTH,
      ]),
      y: clamp(viewCurve[index].y + e.movementY, [0, CURVE_VIEW_HEIGHT]),
    }
  }

  const onmouseup = () => {
    if (!isDragging) return
    isDragging = false
    if (options) {
      gamepadQuery.setOptions({ data: { ...options, analogCurve } })
    }
  }
</script>

<svelte:document {onmousemove} {onmouseup} />

<Tooltip.Root
  bind:open={() => tooltipOpen || isDragging, (v) => (tooltipOpen = v)}
>
  <Tooltip.Trigger
    class="absolute z-20 size-4 -translate-1/2 rounded-full"
    style="left: {viewCurve[index].x}px; top: {viewCurve[index].y}px;"
  >
    <div
      class="size-full rounded-full bg-primary shadow-xs"
      onmousedown={() => (isDragging = true)}
      role="none"
    ></div>
  </Tooltip.Trigger>
  <Tooltip.Content>
    ({displayDistance(analogCurve[index].x)}mm, {analogCurve[index].y})
  </Tooltip.Content>
</Tooltip.Root>
