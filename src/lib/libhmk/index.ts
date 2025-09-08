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

import { uint16Schema } from "$lib/integer"
import z from "zod"

export const HMK_FIRMWARE_VERSION = 0x0103

export const HMK_DEVICE_USAGE_PAGE = 0xffab
export const HMK_DEVICE_USAGE_ID = 0xab

export const HMK_MAX_NUM_PROFILES = 8
export const HMK_MAX_NUM_LAYERS = 8
export const HMK_MAX_NUM_KEYS = 256
export const HMK_MAX_NUM_ADVANCED_KEYS = 64

export const HMK_MIN_DISTANCE = 4
export const HMK_MAX_DISTANCE = 255

export const hmkCalibrationSchema = z.object({
  initialRestValue: uint16Schema,
  initialBottomOutThreshold: uint16Schema,
})

export type HMK_Calibration = z.infer<typeof hmkCalibrationSchema>

export const hmkOptionsSchema = z.object({
  xInputEnabled: z.boolean(),
})

export type HMK_Options = z.infer<typeof hmkOptionsSchema>
