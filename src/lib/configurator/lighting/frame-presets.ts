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

import type { HMK_RGBColor } from "$lib/libhmk/rgb"

function assertLedCount(ledCount: number) {
  if (!Number.isInteger(ledCount) || ledCount < 1 || ledCount > 0xff) {
    throw new RangeError("LED count must be an integer between 1 and 255.")
  }
}

export function hexToRgb(value: string): HMK_RGBColor {
  const match = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(value)
  if (!match) throw new RangeError("Color must use the #RRGGBB format.")
  return [
    Number.parseInt(match[1], 16),
    Number.parseInt(match[2], 16),
    Number.parseInt(match[3], 16),
  ]
}

export function rgbToHex(color: HMK_RGBColor) {
  return `#${color
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")}`
}

export function createGradientFrame(
  ledCount: number,
  start: HMK_RGBColor,
  end: HMK_RGBColor,
) {
  assertLedCount(ledCount)
  const frame = new Uint8Array(ledCount * 3)
  for (let index = 0; index < ledCount; index++) {
    const progress = ledCount === 1 ? 0 : index / (ledCount - 1)
    for (let channel = 0; channel < 3; channel++) {
      frame[index * 3 + channel] = Math.round(
        start[channel] + (end[channel] - start[channel]) * progress,
      )
    }
  }
  return frame
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

export function createRainbowFrame(ledCount: number) {
  assertLedCount(ledCount)
  const frame = new Uint8Array(ledCount * 3)
  for (let index = 0; index < ledCount; index++) {
    frame.set(hueToRgb(index / ledCount), index * 3)
  }
  return frame
}
