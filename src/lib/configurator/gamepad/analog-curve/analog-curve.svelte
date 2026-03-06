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
    CURVE_VIEW_HEIGHT,
    CURVE_VIEW_WIDTH,
  } from "$lib/configurator/lib/gamepad"
  import { cn, type WithoutChildren } from "$lib/utils"
  import type { HTMLAttributes } from "svelte/elements"
  import AnalogCurveDraggable from "./analog-curve-draggable.svelte"
  import AnalogCurveGraphic from "./analog-curve-graphic.svelte"
  import AnalogCurveLabels from "./analog-curve-labels.svelte"
  import AnalogCurvePresets from "./analog-curve-presets.svelte"
  import { AnalogCurveState, analogCurveStateContext } from "./context.svelte"

  const {
    class: className,
    ...props
  }: WithoutChildren<HTMLAttributes<HTMLDivElement>> = $props()

  analogCurveStateContext.set(new AnalogCurveState())
</script>

<div class={cn("flex flex-col gap-4 select-none", className)} {...props}>
  <div class="grid place-items-center">
    <div
      class="grid"
      style="
      grid-template-rows: 3rem calc({CURVE_VIEW_HEIGHT}px - 6rem) 3rem 2rem;
      grid-template-columns: 3rem 4rem calc({CURVE_VIEW_WIDTH}px - 8rem) 4rem;
      grid-template-areas:
        'analog-max curve curve curve'
        'analog-label curve curve curve'
        'analog-min curve curve curve'
        'none switch-min switch-label switch-max';
    "
    >
      <AnalogCurveLabels />
      <AnalogCurveGraphic />
      <div class="relative" style="grid-area: curve">
        {#each { length: 4 }, index (index)}
          <AnalogCurveDraggable {index} />
        {/each}
      </div>
    </div>
  </div>
  <AnalogCurvePresets />
</div>
