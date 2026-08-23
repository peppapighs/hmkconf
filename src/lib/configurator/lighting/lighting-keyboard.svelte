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
  import { KeyboardEditorKeyboard } from "$lib/components/keyboard-editor"
  import * as KeycodeButton from "$lib/components/keycode-button"
  import { keymapQueryContext } from "../queries/keymap-query.svelte"
  import { hexToRgb, rgbToHex } from "./frame-presets"
  import { getRgbFramePixel, RgbFramePaintGesture } from "./led-topology"
  import type { LightingState } from "./lighting-state.svelte"

  const { state: lighting }: { state: LightingState } = $props()
  const { current: keymap } = $derived(keymapQueryContext.get().keymap)
  const topology = $derived(lighting.topology)

  const gesture = new RgbFramePaintGesture()
  let painterRoot = $state<HTMLElement | null>(null)
  let captureElement: HTMLElement | null = null
  let activePointerId = $state<number | null>(null)

  function frameColor(ledIndex: number) {
    return rgbToHex(getRgbFramePixel(lighting.displayFrame, ledIndex))
  }

  function paint(ledIndex: number) {
    const preview = gesture.paint(ledIndex, hexToRgb(lighting.fillColor))
    if (preview) lighting.previewFrame(preview)
  }

  function beginPaint(event: PointerEvent, ledIndex: number) {
    if (
      lighting.painterDisabled ||
      activePointerId !== null ||
      event.button !== 0
    ) {
      return
    }
    event.preventDefault()
    activePointerId = event.pointerId
    captureElement = event.currentTarget as HTMLElement
    captureElement.setPointerCapture?.(event.pointerId)
    gesture.begin(lighting.displayFrame)
    paint(ledIndex)
  }

  function hitTestLed(event: PointerEvent) {
    const root = painterRoot
    const element = document.elementFromPoint(event.clientX, event.clientY)
    if (!root || !element || !root.contains(element)) return null
    const target = element.closest<HTMLElement>("[data-rgb-led-index]")
    if (!target || !root.contains(target)) return null
    const ledIndex = Number(target.dataset.rgbLedIndex)
    return Number.isInteger(ledIndex) ? ledIndex : null
  }

  function movePaint(event: PointerEvent) {
    if (event.pointerId !== activePointerId) return
    const ledIndex = hitTestLed(event)
    if (ledIndex !== null) paint(ledIndex)
  }

  function endPaint(event: PointerEvent) {
    if (event.pointerId !== activePointerId) return
    activePointerId = null
    if (captureElement?.hasPointerCapture?.(event.pointerId)) {
      captureElement.releasePointerCapture(event.pointerId)
    }
    captureElement = null
    const committed = gesture.end()
    if (committed) void lighting.commitFrame("LED painter failed", committed)
  }

  function keyboardPaint(event: MouseEvent, ledIndex: number) {
    // Keyboard activation produces detail 0. A pointer click was already
    // committed by `endPaint` and must not send a second HID frame.
    if (lighting.painterDisabled || event.detail !== 0) return
    gesture.begin(lighting.displayFrame)
    paint(ledIndex)
    const committed = gesture.end()
    if (committed) void lighting.commitFrame("LED painter failed", committed)
  }
</script>

<svelte:window
  onpointermove={movePaint}
  onpointerup={endPaint}
  onpointercancel={endPaint}
/>

{#if topology.kind === "keyboard"}
  <div bind:this={painterRoot} class="flex size-full touch-none select-none">
    <KeyboardEditorKeyboard>
      {#snippet keyGenerator(key)}
        {@const ledIndex = topology.keyToLed[key]}
        {#if ledIndex === null || ledIndex === undefined}
          {#if keymap}
            <KeycodeButton.Root
              aria-label={`Key ${key} has no mapped LED`}
              class="cursor-not-allowed bg-muted text-muted-foreground"
              disabled
              keycode={keymap[0][key]}
              size="sm"
              title={`Key ${key} has no mapped LED`}
            />
          {:else}
            <KeycodeButton.Skeleton class="bg-muted" />
          {/if}
        {:else if !keymap}
          <KeycodeButton.Skeleton
            class="brightness-75"
            style={`background-color: ${frameColor(ledIndex)}`}
          />
        {:else}
          <KeycodeButton.Root
            aria-label={`Paint key ${key}, LED ${ledIndex}`}
            class="cursor-crosshair text-white [text-shadow:0_1px_2px_rgb(0_0_0/80%)] hover:brightness-110"
            data-rgb-led-index={ledIndex}
            disabled={lighting.painterDisabled}
            keycode={keymap[0][key]}
            onclick={(event) => keyboardPaint(event, ledIndex)}
            onlostpointercapture={endPaint}
            onpointerdown={(event) => beginPaint(event, ledIndex)}
            size="sm"
            style={`background-color: ${frameColor(ledIndex)}`}
            title={`Key ${key} → LED ${ledIndex}`}
          />
        {/if}
      {/snippet}
    </KeyboardEditorKeyboard>
  </div>
{:else}
  <div
    bind:this={painterRoot}
    class="grid size-full touch-none grid-cols-[repeat(auto-fill,minmax(3rem,1fr))] content-center gap-2 overflow-y-auto p-6 select-none"
  >
    {#each Array(lighting.displayFrame.length / 3).keys() as ledIndex (ledIndex)}
      <button
        aria-label={`Paint firmware LED ${ledIndex}`}
        class="aspect-square max-h-16 cursor-crosshair rounded-md border text-xs font-medium text-white shadow-xs outline-none [text-shadow:0_1px_2px_rgb(0_0_0/80%)] hover:brightness-110 focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
        data-rgb-led-index={ledIndex}
        disabled={lighting.painterDisabled}
        onclick={(event) => keyboardPaint(event, ledIndex)}
        onlostpointercapture={endPaint}
        onpointerdown={(event) => beginPaint(event, ledIndex)}
        style={`background-color: ${frameColor(ledIndex)}`}
        title={`Firmware LED ${ledIndex}`}
        type="button"
      >
        {ledIndex}
      </button>
    {/each}
  </div>
{/if}
