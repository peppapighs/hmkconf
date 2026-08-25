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
  import { formatHexColor } from "$lib/color"
  import { cn } from "$lib/utils"
  import { RGB_PALETTE, type LightingState } from "./lighting-state.svelte"

  const {
    cells = 12,
    class: className,
    effect,
    state,
  }: {
    cells?: number
    class?: string
    effect: number
    state: LightingState
  } = $props()

  // The gallery renders the same firmware math as the keyboard, just at a
  // lower LED count, so each tile really is the effect it launches.
  const colors = $derived.by(() => {
    const rendered = state.effectFrame(effect, state.previewPhase, cells)
    const sample = (frame: Uint8Array) => {
      const available = Math.floor(frame.length / 3)
      return [...Array(cells).keys()].map((cell) => {
        const led = rendered ? cell : Math.floor((cell * available) / cells)
        return formatHexColor([
          frame[led * 3],
          frame[led * 3 + 1],
          frame[led * 3 + 2],
        ])
      })
    }
    if (rendered) return sample(rendered)
    // Live mode has no formula to render: show the frame being streamed, or a
    // swatch row standing in for "whatever you paint" before it is selected.
    if (effect === state.capabilities?.liveEffectId && !state.isLive) {
      return [...Array(cells).keys()].map(
        (cell) => RGB_PALETTE[cell % RGB_PALETTE.length],
      )
    }
    return sample(state.displayFrame)
  })
</script>

<div
  class={cn(
    "flex h-8 w-full overflow-hidden rounded-sm border bg-black",
    className,
  )}
>
  {#each colors as color, cell (cell)}
    <div class="flex-1" style={`background-color: ${color}`}></div>
  {/each}
</div>
