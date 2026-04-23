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
  import { PlusIcon } from "@lucide/svelte"
  import {
    DKS_ACTION_SIZE,
    getDKSIntervalLeft,
  } from "$lib/configurator/lib/advanced-keys"
  import type {
    HMK_AKDynamicKeystroke,
    HMK_DKSAction,
  } from "$lib/libhmk/advanced-keys"
  import { cn } from "$lib/utils"
  import { configMenuStateContext } from "../../context.svelte"
  import ActionsDraggable from "./actions-draggable.svelte"
  import ActionsInterval from "./actions-interval.svelte"
  import { DKSActionsState, dksActionsStateContext } from "./context.svelte"

  const { row }: { row: number } = $props()

  const configMenuState = configMenuStateContext.get()
  const action = $derived(
    configMenuState.advancedKey.action as HMK_AKDynamicKeystroke,
  )

  dksActionsStateContext.set(
    new DKSActionsState(() => ({
      bitmap: action.bitmap[row],
      updateBitmap: (bitmap: HMK_DKSAction[]) => {
        const newBitmap = action.bitmap.map((row) => [...row])
        newBitmap[row] = bitmap
        configMenuState.updateAction({ ...action, bitmap: newBitmap })
      },
    })),
  )
  const { currentIntervals } = $derived(dksActionsStateContext.get())
</script>

<div class="relative" style:grid-area="action{row}">
  {#each { length: 4 }, col (col)}
    <div
      class={cn(
        "absolute top-1/2 grid -translate-y-1/2 place-items-center rounded-full border bg-card shadow-xs",
      )}
      style:left="{getDKSIntervalLeft([col, col])}px"
      style:width="{DKS_ACTION_SIZE}px"
      style:height="{DKS_ACTION_SIZE}px"
    >
      <PlusIcon class="size-4" />
    </div>
    <ActionsDraggable {col} />
  {/each}
  {#each { length: currentIntervals.length }, index (index)}
    <ActionsInterval {index} />
  {/each}
</div>
