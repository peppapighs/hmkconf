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
  } from "$lib/configurator/lib/gamepad"
  import { analogCurveStateContext } from "./context.svelte"

  const { viewCurve } = $derived(analogCurveStateContext.get())
</script>

<div class="border" style:grid-area="curve"></div>
<div class="relative z-10" style:grid-area="curve">
  <svg
    class="size-full"
    preserveAspectRatio="none"
    viewBox="0 0 {CURVE_VIEW_WIDTH} {CURVE_VIEW_HEIGHT}"
  >
    <polygon
      class="fill-primary/30"
      points={[
        ...viewCurve.map(({ x, y }) => `${x},${y}`),
        `${viewCurve[3].x},${CURVE_VIEW_HEIGHT}`,
        `${viewCurve[0].x},${CURVE_VIEW_HEIGHT}`,
      ].join(",")}
    />
    <polyline
      class="fill-none stroke-primary stroke-3"
      points={viewCurve.map(({ x, y }) => `${x},${y}`).join(",")}
      vector-effect="non-scaling-stroke"
    />
  </svg>
  <div
    class="absolute inset-y-0 left-0 flex flex-col items-center overflow-hidden bg-muted"
    style:width="{viewCurve[0].x}px"
  >
    <Tooltip.Root>
      <Tooltip.Trigger class="m-2 text-sm text-muted-foreground">
        Key Start Deadzone
      </Tooltip.Trigger>
      <Tooltip.Content class="max-w-sm text-wrap">
        No gamepad analog input will be sent.
      </Tooltip.Content>
    </Tooltip.Root>
  </div>
  <div
    class="absolute inset-y-0 right-0 flex flex-col items-center overflow-hidden bg-muted"
    style:width="{CURVE_VIEW_WIDTH - viewCurve[3].x}px"
  >
    <Tooltip.Root>
      <Tooltip.Trigger class="m-2 text-sm text-muted-foreground">
        Key End Deadzone
      </Tooltip.Trigger>
      <Tooltip.Content class="max-w-sm text-wrap">
        Maximum gamepad analog input will be sent. For joysticks, the angle will
        snap to the nearest 45 degree, functioning similar to a D-Pad.
      </Tooltip.Content>
    </Tooltip.Root>
  </div>
</div>
