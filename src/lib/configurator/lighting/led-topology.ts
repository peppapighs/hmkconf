/*
 * This program is free software: you can redistribute it and/or modify it under
 * the terms of the GNU General Public License as published by the Free Software
 * Foundation, either version 3 of the License, or (at your option) any later
 * version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU General Public License for more
 * details.
 *
 * You should have received a copy of the GNU General Public License along with
 * this program. If not, see <https://www.gnu.org/licenses/>.
 */

import type { KeyboardMetadata } from "$lib/keyboard/metadata"
import type { HMK_RGBColor } from "$lib/libhmk/rgb"

export type KeyboardLedTopology = {
  kind: "keyboard"
  source: "metadata" | "kbhe-75he"
  keyToLed: readonly (number | null)[]
}

export type IndexedLedTopology = {
  kind: "led-grid"
  source: "firmware-index"
  keyToLed: null
}

export type RgbLedTopology = KeyboardLedTopology | IndexedLedTopology

/**
 * KBHE 75HE logical K01..K82 -> physical WS2812 chain index.
 *
 * This table is intentionally written out rather than inferred from key count.
 * It matches `LOGICAL_LED_INDEX_TO_PHYSICAL_LED_INDEX` in the KBHE firmware;
 * libhmk's STM32F723 backend currently exposes the physical chain order.
 */
export const KBHE_75HE_KEY_TO_LED = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 28, 27, 26, 25, 24, 23, 22, 21,
  20, 19, 18, 17, 16, 15, 14, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
  41, 42, 43, 57, 56, 55, 54, 53, 52, 51, 50, 49, 48, 47, 46, 45, 44, 58, 59,
  60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 81, 80, 79, 78, 77, 76, 75,
  74, 73, 72,
] as const satisfies readonly number[]

function isKbhe75He(metadata: KeyboardMetadata, ledCount: number) {
  return (
    metadata.vendorId === 0x9172 &&
    metadata.productId === 0x0004 &&
    metadata.numKeys === KBHE_75HE_KEY_TO_LED.length &&
    metadata.rgb?.numLeds === KBHE_75HE_KEY_TO_LED.length &&
    ledCount === KBHE_75HE_KEY_TO_LED.length
  )
}

/** Resolve only declared mappings; unknown devices stay in LED-index mode. */
export function resolveRgbLedTopology(
  metadata: KeyboardMetadata,
  ledCount: number,
): RgbLedTopology {
  const advertised = metadata.rgb?.keyToLed
  if (
    advertised !== undefined &&
    metadata.rgb?.numLeds === ledCount &&
    advertised.length === metadata.numKeys
  ) {
    return { kind: "keyboard", source: "metadata", keyToLed: advertised }
  }

  if (isKbhe75He(metadata, ledCount)) {
    return {
      kind: "keyboard",
      source: "kbhe-75he",
      keyToLed: KBHE_75HE_KEY_TO_LED,
    }
  }

  return { kind: "led-grid", source: "firmware-index", keyToLed: null }
}

export function getRgbFramePixel(
  frame: ArrayLike<number>,
  ledIndex: number,
): HMK_RGBColor {
  const ledCount = frame.length / 3
  if (
    !Number.isInteger(ledCount) ||
    !Number.isInteger(ledIndex) ||
    ledIndex < 0 ||
    ledIndex >= ledCount
  ) {
    throw new RangeError("RGB frame or LED index is out of range.")
  }
  const offset = ledIndex * 3
  return [frame[offset], frame[offset + 1], frame[offset + 2]]
}

/** Return a new frame so a local painter preview remains reactive. */
export function paintRgbFramePixel(
  frame: Uint8Array,
  ledIndex: number,
  color: HMK_RGBColor,
) {
  getRgbFramePixel(frame, ledIndex)
  const next = frame.slice()
  next.set(color, ledIndex * 3)
  return next
}

/**
 * Keeps high-frequency pointer previews local and yields at most one frame at
 * the end of a gesture, so dragging never streams one HID transaction per LED.
 */
export class RgbFramePaintGesture {
  #draft: Uint8Array | null = null
  #dirty = false

  begin(frame: Uint8Array) {
    this.#draft = frame.slice()
    this.#dirty = false
  }

  paint(ledIndex: number, color: HMK_RGBColor) {
    if (!this.#draft) return null
    const current = getRgbFramePixel(this.#draft, ledIndex)
    if (current.every((value, channel) => value === color[channel])) {
      return null
    }
    this.#draft = paintRgbFramePixel(this.#draft, ledIndex, color)
    this.#dirty = true
    return this.#draft.slice()
  }

  end() {
    const result = this.#dirty ? (this.#draft?.slice() ?? null) : null
    this.#draft = null
    this.#dirty = false
    return result
  }
}
