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

import { uint8Schema, uint16Schema } from "$lib/integer"
import z from "zod"

export const HMK_RGB_PROTOCOL_MAJOR = 1
export const HMK_RGB_MAX_CHUNK_BYTES = 60

export const HMK_RGBCapability = {
  ENABLED: 1 << 0,
  BRIGHTNESS: 1 << 1,
  PIXEL: 1 << 2,
  FRAME_CHUNKS: 1 << 3,
  FILL: 1 << 4,
  LIVE_MODE: 1 << 5,
  RESTORE_MODE: 1 << 6,
} as const

export type HMK_RGBCapability =
  (typeof HMK_RGBCapability)[keyof typeof HMK_RGBCapability]

export const HMK_RGBEffect = {
  STATIC: 0,
  BREATHING: 1,
  RAINBOW: 2,
  RAINBOW_WAVE: 3,
  LIVE: 7,
} as const

export type HMK_RGBColor = readonly [r: number, g: number, b: number]

export type HMK_RGBCapabilities = {
  protocolMajor: number
  protocolMinor: number
  ledCount: number
  bytesPerPixel: number
  chunkBytes: number
  liveEffectId: number
  capabilities: number
  colorOrder: number
}

export type HMK_RGBState = {
  capabilities: HMK_RGBCapabilities
  enabled: boolean | null
  brightness: number | null
  effect: number
}

const uniqueEffectsSchema = z
  .array(uint8Schema)
  .max(256)
  .superRefine((val, ctx) => {
    if (new Set(val).size !== val.length) {
      ctx.addIssue({
        code: "custom",
        message: "RGB effect identifiers must be unique",
        input: val,
      })
    }
  })

/** Static build metadata. Runtime command 0x7f remains authoritative. */
export const hmkRgbMetadataSchema = z.object({
  numLeds: uint8Schema.min(1),
  protocolMajor: uint8Schema,
  protocolMinor: uint8Schema,
  effects: uniqueEffectsSchema,
  /**
   * Optional, explicit translation from logical key index to the RGB bridge's
   * LED index. `null` denotes a key without an addressable LED. Hosts must not
   * infer this relationship from matching key and LED counts.
   */
  keyToLed: z.array(uint8Schema.nullable()).max(256).optional(),
})

export type HMK_RGBMetadata = z.infer<typeof hmkRgbMetadataSchema>

export const hmkRgbCapabilitiesSchema = z.object({
  protocolMajor: uint8Schema,
  protocolMinor: uint8Schema,
  ledCount: uint8Schema.min(1),
  bytesPerPixel: uint8Schema,
  chunkBytes: uint8Schema,
  liveEffectId: uint8Schema,
  capabilities: uint16Schema,
  colorOrder: uint8Schema,
})

export function hasRgbCapability(
  capabilities: HMK_RGBCapabilities,
  capability: HMK_RGBCapability,
) {
  return (capabilities.capabilities & capability) !== 0
}
