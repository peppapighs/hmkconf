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
  import DistanceSlider from "$lib/components/distance-slider.svelte"
  import { actuationQueryContext } from "$lib/configurator/queries/actuation-query.svelte"
  import { distanceToUnit } from "$lib/distance"
  import { DEFAULT_ACTUATION_POINT } from "$lib/libhmk/actuation"
  import type { HMK_AKDynamicKeystroke } from "$lib/libhmk/advanced-keys"
  import { cn, optMap, type WithoutChildren } from "$lib/utils"
  import type { HTMLAttributes } from "svelte/elements"
  import { configMenuStateContext } from "../context.svelte"

  const {
    class: className,
    ...props
  }: WithoutChildren<HTMLAttributes<HTMLDivElement>> = $props()

  const configMenuState = configMenuStateContext.get()
  const { key } = $derived(configMenuState.advancedKey)
  const action = $derived(
    configMenuState.advancedKey.action as HMK_AKDynamicKeystroke,
  )

  const actuationQuery = actuationQueryContext.get()
  const { current: actuationMap } = $derived(actuationQuery.actuationMap)
</script>

<div class={cn("flex flex-col gap-4", className)} {...props}>
  <DistanceSlider
    bind:committed={
      () => actuationMap?.[key].actuationPoint ?? DEFAULT_ACTUATION_POINT,
      (v) =>
        actuationMap &&
        actuationQuery.set({
          offset: key,
          data: [{ ...actuationMap[key], actuationPoint: v }],
        })
    }
    description="Set the actuation point for &quot;Key press&quot; and &quot;Key release&quot; actions."
    disabled={!actuationMap}
    max={distanceToUnit(action.bottomOutPoint)}
    title="Actuation Point"
  />
  <DistanceSlider
    bind:committed={
      () => action.bottomOutPoint,
      (v) => configMenuState.updateAction({ ...action, bottomOutPoint: v })
    }
    description="Set the actuation point for &quot;Key fully pressed&quot; and &quot;Key released from fully pressed&quot; actions."
    disabled={!actuationMap}
    min={optMap(actuationMap?.[key].actuationPoint, distanceToUnit)}
    title="Bottom Out Point"
  />
  <div class="flex items-center gap-2 text-muted-foreground">
    <InfoIcon class="size-4" />
    <p class="text-sm">
      Rapid Trigger is automatically disabled for Dynamic Keystroke keys.
    </p>
  </div>
</div>
