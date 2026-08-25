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
  import { contrastTextColor } from "$lib/color"
  import { KeyboardEditorKeyboard } from "$lib/components/keyboard-editor"
  import * as KeycodeButton from "$lib/components/keycode-button"
  import { keymapQueryContext } from "../queries/keymap-query.svelte"
  import { hexToRgb, rgbToHex } from "./frame-presets"
  import { getRgbFramePixel, RgbFramePaintGesture } from "./led-topology"
  import type { LightingState } from "./lighting-state.svelte"

  const { state: lighting }: { state: LightingState } = $props()
  const { current: keymap } = $derived(keymapQueryContext.get().keymap)
  const topology = $derived(lighting.topology)
  const ready = $derived(!lighting.loading && lighting.capabilities !== null)

  const gesture = new RgbFramePaintGesture()
  let painterRoot = $state<HTMLElement | null>(null)
  let captureElement: HTMLElement | null = null
  let activePointerId = $state<number | null>(null)

  /**
   * Keys wear the LED color, so the label follows it and lit LEDs cast a soft
   * glow sized in `em` to track the keyboard's zoom level.
   */
  function ledStyle(ledIndex: number) {
    const color = getRgbFramePixel(lighting.displayFrame, ledIndex)
    const hex = rgbToHex(color)
    const glow = color.some((channel) => channel > 0)
      ? `; box-shadow: 0 0 0.5em ${hex}80`
      : ""
    return `background-color: ${hex}; color: ${contrastTextColor(color)}${glow}`
  }

  function paint(ledIndex: number) {
    const preview = gesture.paint(ledIndex, hexToRgb(lighting.paintColor))
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
    if (committed)
      void lighting.commitFrame("Could not paint the keys", committed)
  }

  function keyboardPaint(event: MouseEvent, ledIndex: number) {
    // Keyboard activation produces detail 0. A pointer click was already
    // committed by `endPaint` and must not send a second HID frame.
    if (lighting.painterDisabled || event.detail !== 0) return
    gesture.begin(lighting.displayFrame)
    paint(ledIndex)
    const committed = gesture.end()
    if (committed)
      void lighting.commitFrame("Could not paint the keys", committed)
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
        {#if !keymap || lighting.loading}
          <KeycodeButton.Skeleton />
        {:else if !ready || ledIndex === null || ledIndex === undefined}
          <KeycodeButton.Root
            class="cursor-not-allowed"
            disabled
            keycode={keymap[0][key]}
            size="sm"
            title={ready ? "This key has no LED" : undefined}
          />
        {:else}
          <KeycodeButton.Root
            class={lighting.canPaint
              ? "cursor-crosshair transition-[filter] hover:brightness-110"
              : "cursor-default"}
            data-rgb-led-index={ledIndex}
            keycode={keymap[0][key]}
            onclick={(event) => keyboardPaint(event, ledIndex)}
            onlostpointercapture={endPaint}
            onpointerdown={(event) => beginPaint(event, ledIndex)}
            size="sm"
            style={ledStyle(ledIndex)}
            tabindex={lighting.canPaint ? 0 : -1}
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
        aria-label={`Paint LED ${ledIndex}`}
        class="aspect-square max-h-16 rounded-md border text-xs font-medium shadow-xs transition-[filter] outline-none focus-visible:ring-3 focus-visible:ring-ring/50 enabled:cursor-crosshair enabled:hover:brightness-110 disabled:pointer-events-none disabled:opacity-50"
        data-rgb-led-index={ledIndex}
        disabled={lighting.painterDisabled}
        onclick={(event) => keyboardPaint(event, ledIndex)}
        onlostpointercapture={endPaint}
        onpointerdown={(event) => beginPaint(event, ledIndex)}
        style={ready ? ledStyle(ledIndex) : undefined}
        type="button"
      >
        {ledIndex}
      </button>
    {/each}
  </div>
{/if}
