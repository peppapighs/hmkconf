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

import { formatHexColor, parseHexColor } from "$lib/color"
import type { HMK_RGBColor } from "$lib/libhmk/rgb"

/**
 * Where an LED sits on the board. WS2812 chains are usually wired in a
 * serpentine, so a preset laid out by chain index paints a snake instead of a
 * sweep. Callers that know the physical layout pass it here.
 */
export type LedPlacement = { led: number; position: number }

function assertLedCount(ledCount: number) {
  if (!Number.isInteger(ledCount) || ledCount < 1 || ledCount > 0xff) {
    throw new RangeError("LED count must be an integer between 1 and 255.")
  }
}

export function hexToRgb(value: string): HMK_RGBColor {
  const color = parseHexColor(value)
  if (!color) throw new RangeError("Color must use the #RRGGBB format.")
  return color
}

export function rgbToHex(color: HMK_RGBColor) {
  return formatHexColor(color)
}

/**
 * Paint every LED from a 0-1 ramp. Placements are rescaled so the first and
 * last LED on the board always land on the ends of the ramp; without them the
 * ramp falls back to the chain order.
 */
function createRampFrame(
  ledCount: number,
  placements: readonly LedPlacement[] | undefined,
  colorAt: (progress: number) => HMK_RGBColor,
) {
  assertLedCount(ledCount)
  const frame = new Uint8Array(ledCount * 3)

  if (!placements || placements.length === 0) {
    for (let index = 0; index < ledCount; index++) {
      frame.set(colorAt(ledCount === 1 ? 0 : index / (ledCount - 1)), index * 3)
    }
    return frame
  }

  const positions = placements.map(({ position }) => position)
  const min = Math.min(...positions)
  const span = Math.max(...positions) - min
  for (const { led, position } of placements) {
    if (!Number.isInteger(led) || led < 0 || led >= ledCount) {
      throw new RangeError(`LED ${led} is outside the ${ledCount}-LED frame.`)
    }
    frame.set(colorAt(span === 0 ? 0 : (position - min) / span), led * 3)
  }
  return frame
}

export function createGradientFrame(
  ledCount: number,
  start: HMK_RGBColor,
  end: HMK_RGBColor,
  placements?: readonly LedPlacement[],
) {
  return createRampFrame(ledCount, placements, (progress) => [
    Math.round(start[0] + (end[0] - start[0]) * progress),
    Math.round(start[1] + (end[1] - start[1]) * progress),
    Math.round(start[2] + (end[2] - start[2]) * progress),
  ])
}

function hueToRgb(hue: number): HMK_RGBColor {
  const sector = hue * 6
  const offset = sector - Math.floor(sector)
  const rising = Math.round(offset * 0xff)
  const falling = 0xff - rising

  switch (Math.floor(sector) % 6) {
    case 0:
      return [0xff, rising, 0]
    case 1:
      return [falling, 0xff, 0]
    case 2:
      return [0, 0xff, rising]
    case 3:
      return [0, falling, 0xff]
    case 4:
      return [rising, 0, 0xff]
    default:
      return [0xff, 0, falling]
  }
}

export function createRainbowFrame(
  ledCount: number,
  placements?: readonly LedPlacement[],
) {
  // The chain-ordered ramp stops one step short of a full turn so the first and
  // last LED are not the same red; a positioned ramp spans the whole spectrum.
  const scale = placements?.length ? 1 : (ledCount - 1) / ledCount
  return createRampFrame(ledCount, placements, (progress) =>
    hueToRgb(progress * scale),
  )
}
