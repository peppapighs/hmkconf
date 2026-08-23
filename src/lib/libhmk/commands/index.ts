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

export enum HMK_Command {
  FIRMWARE_VERSION = 0,
  REBOOT,
  BOOTLOADER,
  FACTORY_RESET,
  RECALIBRATE,
  ANALOG_INFO,
  GET_CALIBRATION,
  SET_CALIBRATION,
  GET_PROFILE,
  GET_OPTIONS,
  SET_OPTIONS,
  RESET_PROFILE,
  DUPLICATE_PROFILE,
  GET_METADATA,
  GET_SERIAL,
  SAVE_CALIBRATION_THRESHOLD,

  GET_LED_ENABLED = 0x60,
  SET_LED_ENABLED = 0x61,
  GET_LED_BRIGHTNESS = 0x62,
  SET_LED_BRIGHTNESS = 0x63,
  GET_LED_PIXEL = 0x64,
  SET_LED_PIXEL = 0x65,
  GET_LED_ALL = 0x68,
  SET_LED_ALL_CHUNK = 0x6a,
  LED_CLEAR = 0x6b,
  LED_FILL = 0x6c,
  GET_LED_EFFECT = 0x6e,
  SET_LED_EFFECT = 0x6f,
  RESTORE_LED_EFFECT = 0x76,
  GET_RGB_CAPABILITIES = 0x7f,

  GET_KEYMAP = 128,
  SET_KEYMAP,
  GET_ACTUATION_MAP,
  SET_ACTUATION_MAP,
  GET_ADVANCED_KEYS,
  SET_ADVANCED_KEYS,
  GET_TICK_RATE,
  SET_TICK_RATE,
  GET_GAMEPAD_BUTTONS,
  SET_GAMEPAD_BUTTONS,
  GET_GAMEPAD_OPTIONS,
  SET_GAMEPAD_OPTIONS,
  GET_MACROS,
  SET_MACROS,

  UNKNOWN = 255,
}

export const HMK_RAW_HID_EP_SIZE = 64

export const hmkAnalogInfoSchema = z.object({
  adcValue: uint16Schema,
  distance: uint8Schema,
})

export type HMK_AnalogInfo = z.infer<typeof hmkAnalogInfoSchema>
