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

/** SRGB channels, each an integer between 0 and 255. */
export type RGB = readonly [r: number, g: number, b: number]

/** Hue in degrees, saturation and value between 0 and 1. */
export type HSV = { h: number; s: number; v: number }

const HEX_PATTERN = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i

export function parseHexColor(value: string): RGB | null {
  const match = HEX_PATTERN.exec(value.trim())
  return match
    ? [
        Number.parseInt(match[1], 16),
        Number.parseInt(match[2], 16),
        Number.parseInt(match[3], 16),
      ]
    : null
}

export function formatHexColor(color: RGB) {
  return `#${color
    .map((value) =>
      Math.max(0, Math.min(255, Math.round(value)))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`
}

export function rgbToHsv(color: RGB): HSV {
  const [r, g, b] = color.map((value) => value / 255)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const span = max - min

  let h = 0
  if (span > 0) {
    if (max === r) h = ((g - b) / span) % 6
    else if (max === g) h = (b - r) / span + 2
    else h = (r - g) / span + 4
    h *= 60
    if (h < 0) h += 360
  }
  return { h, s: max === 0 ? 0 : span / max, v: max }
}

export function hsvToRgb({ h, s, v }: HSV): RGB {
  const hue = ((h % 360) + 360) % 360
  const chroma = v * s
  const second = chroma * (1 - Math.abs(((hue / 60) % 2) - 1))
  const offset = v - chroma
  const [r, g, b] =
    hue < 60
      ? [chroma, second, 0]
      : hue < 120
        ? [second, chroma, 0]
        : hue < 180
          ? [0, chroma, second]
          : hue < 240
            ? [0, second, chroma]
            : hue < 300
              ? [second, 0, chroma]
              : [chroma, 0, second]
  return [
    Math.round((r + offset) * 255),
    Math.round((g + offset) * 255),
    Math.round((b + offset) * 255),
  ]
}

/**
 * Pick a label color that stays legible on top of a filled swatch or key. A
 * white label disappears on a white or pastel LED, a black one on a dim LED.
 */
export function contrastTextColor(color: RGB) {
  const [red, green, blue] = color
  const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 0xff
  return luminance > 0.55 ? "#000000" : "#ffffff"
}
