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
    formatHexColor,
    hsvToRgb,
    parseHexColor,
    rgbToHsv,
    type HSV,
  } from "$lib/color"
  import { cn } from "$lib/utils"
  import { untrack } from "svelte"
  import { Input } from "./ui/input"
  import { Label } from "./ui/label"
  import * as Popover from "./ui/popover"

  let {
    class: className,
    disabled,
    id,
    onCommit,
    presets = [],
    title = "Color",
    value = $bindable("#ffffff"),
  }: {
    class?: string
    disabled?: boolean
    id?: string
    /**
     * Called once a gesture ends, so a caller that writes the color to a
     * device does not send one report per pointer move.
     */
    onCommit?: (value: string) => void
    presets?: readonly string[]
    title?: string
    value?: string
  } = $props()

  let hsv = $state<HSV>({ h: 0, s: 0, v: 1 })
  let hexDraft = $state(value)

  const hueColor = $derived(formatHexColor(hsvToRgb({ h: hsv.h, s: 1, v: 1 })))
  const normalized = $derived(
    formatHexColor(parseHexColor(value) ?? [255, 255, 255]),
  )

  // Adopt colors chosen elsewhere (a preset, the device, another field) without
  // fighting the local HSV state, which keeps the hue a neutral color drops.
  $effect(() => {
    const color = parseHexColor(value)
    if (!color) return
    untrack(() => {
      hexDraft = formatHexColor(color)
      if (formatHexColor(hsvToRgb(hsv)) === hexDraft) return
      const next = rgbToHsv(color)
      hsv = {
        h: next.s === 0 || next.v === 0 ? hsv.h : next.h,
        s: next.s,
        v: next.v,
      }
    })
  })

  const clamp = (ratio: number) => Math.min(1, Math.max(0, ratio))

  function update(next: Partial<HSV>) {
    hsv = { ...hsv, ...next }
    value = formatHexColor(hsvToRgb(hsv))
  }

  function commit(next?: string) {
    if (next !== undefined) value = next
    onCommit?.(value)
  }

  function track(event: PointerEvent, pick: (event: PointerEvent) => void) {
    if (disabled || event.button !== 0) return
    event.preventDefault()
    ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
    pick(event)
  }

  function dragging(event: PointerEvent) {
    return (event.currentTarget as HTMLElement).hasPointerCapture(
      event.pointerId,
    )
  }

  function pickSaturationValue(event: PointerEvent) {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
    update({
      s: clamp((event.clientX - rect.left) / rect.width),
      v: 1 - clamp((event.clientY - rect.top) / rect.height),
    })
  }

  function pickHue(event: PointerEvent) {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
    update({ h: clamp((event.clientX - rect.left) / rect.width) * 360 })
  }

  function nudgeSaturationValue(event: KeyboardEvent) {
    const step = event.shiftKey ? 0.1 : 0.02
    const moves: Record<string, Partial<HSV>> = {
      ArrowLeft: { s: clamp(hsv.s - step) },
      ArrowRight: { s: clamp(hsv.s + step) },
      ArrowDown: { v: clamp(hsv.v - step) },
      ArrowUp: { v: clamp(hsv.v + step) },
    }
    const move = moves[event.key]
    if (!move) return
    event.preventDefault()
    update(move)
    commit()
  }

  function nudgeHue(event: KeyboardEvent) {
    const step = event.shiftKey ? 30 : 5
    if (event.key === "ArrowLeft") update({ h: (hsv.h - step + 360) % 360 })
    else if (event.key === "ArrowRight") update({ h: (hsv.h + step) % 360 })
    else return
    event.preventDefault()
    commit()
  }

  function applyHexDraft(next: string) {
    hexDraft = next
    const color = parseHexColor(next)
    if (color) value = formatHexColor(color)
  }
</script>

<Popover.Root>
  <Popover.Trigger
    aria-label={`${title}: ${normalized}`}
    class={cn(
      "size-9 rounded-md border shadow-xs transition-transform outline-none hover:scale-105 focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
      className,
    )}
    {disabled}
    {id}
    style={`background-color: ${normalized}`}
  ></Popover.Trigger>
  <Popover.Content align="start" class="w-64 gap-3">
    <button
      aria-label={`${title} saturation and brightness`}
      class="relative h-36 w-full cursor-crosshair touch-none rounded-md border outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      onkeydown={nudgeSaturationValue}
      onlostpointercapture={() => commit()}
      onpointerdown={(event) => track(event, pickSaturationValue)}
      onpointermove={(event) => dragging(event) && pickSaturationValue(event)}
      style={`background-image: linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${hueColor})`}
      type="button"
    >
      <span
        class="pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow ring-1 ring-black/30"
        style={`left: ${hsv.s * 100}%; top: ${(1 - hsv.v) * 100}%; background-color: ${normalized}`}
      ></span>
    </button>

    <div
      aria-label={`${title} hue`}
      aria-valuemax={360}
      aria-valuemin={0}
      aria-valuenow={Math.round(hsv.h)}
      class="relative h-4 w-full cursor-ew-resize touch-none rounded-full border outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      onkeydown={nudgeHue}
      onlostpointercapture={() => commit()}
      onpointerdown={(event) => track(event, pickHue)}
      onpointermove={(event) => dragging(event) && pickHue(event)}
      role="slider"
      style="background-image: linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)"
      tabindex="0"
    >
      <span
        class="pointer-events-none absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow ring-1 ring-black/30"
        style={`left: ${(hsv.h / 360) * 100}%; background-color: ${hueColor}`}
      ></span>
    </div>

    <div class="grid gap-1.5">
      <Label
        class="text-xs font-medium text-muted-foreground"
        for={`${id}-hex`}
      >
        Hex
      </Label>
      <Input
        autocomplete="off"
        class="h-8 font-mono"
        id={`${id}-hex`}
        maxlength={7}
        onblur={() => {
          hexDraft = normalized
          commit()
        }}
        oninput={(event) => applyHexDraft(event.currentTarget.value)}
        onkeydown={(event) => event.key === "Enter" && commit()}
        spellcheck={false}
        value={hexDraft}
      />
    </div>

    {#if presets.length > 0}
      <div
        aria-label={`${title} presets`}
        class="flex flex-wrap gap-1.5"
        role="group"
      >
        {#each presets as preset (preset)}
          <button
            aria-label={preset}
            aria-pressed={normalized === preset.toLowerCase()}
            class="size-6 rounded-md border shadow-xs transition-transform outline-none hover:scale-110 focus-visible:ring-3 focus-visible:ring-ring/50 aria-pressed:ring-2 aria-pressed:ring-ring aria-pressed:ring-offset-2 aria-pressed:ring-offset-popover"
            onclick={() => commit(preset)}
            style={`background-color: ${preset}`}
            type="button"
          ></button>
        {/each}
      </div>
    {/if}
  </Popover.Content>
</Popover.Root>
