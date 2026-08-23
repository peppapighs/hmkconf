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

import { HMK_RGBEffect, type HMK_RGBColor } from "./rgb"

/**
 * Host-side port of libhmk's autonomous effect renderer (`src/rgb.c`).
 *
 * The bridge has no command to stream the running animation, and reading a
 * frame per repaint would saturate the HID pipe. Rendering the advertised
 * effects locally with the firmware's own integer math lets the configurator
 * preview what the keyboard is doing without polling it.
 */

/** `rgb_task()` advances `effect_phase` once every 20 ms. */
export const HMK_RGB_EFFECT_TICK_MS = 20
/** `effect_phase` is a `uint8_t`, so an effect cycle is 256 ticks. */
export const HMK_RGB_EFFECT_PHASE_COUNT = 256

export function hmkRgbEffectPhase(elapsedMs: number) {
  const ticks = Math.floor(elapsedMs / HMK_RGB_EFFECT_TICK_MS)
  return (
    ((ticks % HMK_RGB_EFFECT_PHASE_COUNT) + HMK_RGB_EFFECT_PHASE_COUNT) %
    HMK_RGB_EFFECT_PHASE_COUNT
  )
}

/** Port of `rgb_hue_to_rgb()`: fully saturated hue, 43 steps per sector. */
export function hmkRgbHueToColor(hue: number): HMK_RGBColor {
  const wrapped = ((Math.trunc(hue) % 256) + 256) % 256
  const region = Math.floor(wrapped / 43)
  const rising = (wrapped - region * 43) * 6
  const falling = 255 - rising

  switch (region) {
    case 0:
      return [255, rising, 0]
    case 1:
      return [falling, 255, 0]
    case 2:
      return [0, 255, rising]
    case 3:
      return [0, falling, 255]
    case 4:
      return [rising, 0, 255]
    default:
      return [255, 0, falling]
  }
}

/** Port of the firmware's `(channel * scale + 127) / 255` rounding. */
function scaleChannel(channel: number, scale: number) {
  return Math.floor((channel * scale + 127) / 255)
}

/**
 * Render one autonomous effect frame. Returns `null` for the live effect and
 * for private effect ids, whose pixels only the device knows.
 *
 * `waveOffsets` is the per-LED phase offset of travelling effects, 0-255. It
 * mirrors `RGB_LED_POS_X`: a keyboard that declares its LED positions sweeps
 * the wave along its width, and one that does not spreads the offset over the
 * chain instead.
 */
export function renderHmkRgbEffectFrame(
  effect: number,
  phase: number,
  ledCount: number,
  baseColor: HMK_RGBColor,
  waveOffsets?: ArrayLike<number>,
): Uint8Array | null {
  if (!Number.isInteger(ledCount) || ledCount < 1 || ledCount > 0xff) {
    throw new RangeError("LED count must be an integer between 1 and 255.")
  }
  const frame = new Uint8Array(ledCount * 3)
  const wrapped =
    ((Math.trunc(phase) % HMK_RGB_EFFECT_PHASE_COUNT) +
      HMK_RGB_EFFECT_PHASE_COUNT) %
    HMK_RGB_EFFECT_PHASE_COUNT

  switch (effect) {
    case HMK_RGBEffect.STATIC:
      for (let index = 0; index < ledCount; index++) {
        frame.set(baseColor, index * 3)
      }
      return frame
    case HMK_RGBEffect.BREATHING: {
      const value = wrapped < 128 ? wrapped * 2 : (255 - wrapped) * 2
      const color = baseColor.map((channel) =>
        scaleChannel(channel, value),
      ) as unknown as HMK_RGBColor
      for (let index = 0; index < ledCount; index++) {
        frame.set(color, index * 3)
      }
      return frame
    }
    case HMK_RGBEffect.RAINBOW: {
      const color = hmkRgbHueToColor(wrapped)
      for (let index = 0; index < ledCount; index++) {
        frame.set(color, index * 3)
      }
      return frame
    }
    case HMK_RGBEffect.RAINBOW_WAVE:
      for (let index = 0; index < ledCount; index++) {
        const offset =
          waveOffsets && waveOffsets.length === ledCount
            ? waveOffsets[index]
            : Math.floor((index * 256) / ledCount)
        frame.set(hmkRgbHueToColor(wrapped + offset), index * 3)
      }
      return frame
    default:
      return null
  }
}

/** Whether an effect ignores the persistent base color set by `LED_FILL`. */
export function hmkRgbEffectUsesBaseColor(effect: number) {
  return effect === HMK_RGBEffect.STATIC || effect === HMK_RGBEffect.BREATHING
}
