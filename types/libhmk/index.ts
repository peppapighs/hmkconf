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

import z from "zod"

import { MAX_NUM_KEYS, MAX_NUM_LAYERS } from "@/constants/libhmk"

import { uint8Schema, uint16Schema } from "../common/integer"

export enum HMKCommand {
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

  UNKNOWN = 255,
}

export const hmkAnalogInfoSchema = z.object({
  adcValue: uint16Schema,
  distance: uint8Schema,
})

export type HMKAnalogInfo = z.infer<typeof hmkAnalogInfoSchema>

export const hmkCalibrationSchema = z.object({
  initialRestValue: uint16Schema,
  initialBottomOutThreshold: uint16Schema,
})

export type HMKCalibration = z.infer<typeof hmkCalibrationSchema>

export const hmkOptionsSchema = z.object({
  xInputEnabled: z.boolean(),
})

export type HMKOptions = z.infer<typeof hmkOptionsSchema>

export const hmkActuationSchema = z.object({
  actuationPoint: uint8Schema,
  rtDown: uint8Schema,
  rtUp: uint8Schema,
  continuous: z.boolean(),
})

export type HMKActuation = z.infer<typeof hmkActuationSchema>

export enum HMKAKType {
  NONE = 0,
  NULL_BIND,
  DYNAMIC_KEYSTROKE,
  TAP_HOLD,
  TOGGLE,
}

export const hmkAKNoneSchema = z.object({
  type: z.literal(HMKAKType.NONE),
})

export type HMKAKNone = z.infer<typeof hmkAKNoneSchema>

export enum HMKNullBindBehavior {
  LAST = 0,
  PRIMARY,
  SECONDARY,
  NEUTRAL,
  DISTANCE,
}

export const hmkAKNullBindSchema = z.object({
  type: z.literal(HMKAKType.NULL_BIND),
  secondaryKey: uint8Schema,
  behavior: z.enum(HMKNullBindBehavior),
  bottomOutPoint: uint8Schema,
})

export type HMKAKNullBind = z.infer<typeof hmkAKNullBindSchema>

export enum HMKDKSAction {
  HOLD = 0,
  PRESS,
  RELEASE,
  TAP,
}

export const hmkAKDynamicKeystrokeSchema = z.object({
  type: z.literal(HMKAKType.DYNAMIC_KEYSTROKE),
  keycodes: z.array(uint8Schema).length(4),
  bitmap: z.array(z.array(z.enum(HMKDKSAction)).length(4)).length(4),
  bottomOutPoint: uint8Schema,
})

export type HMKAKDynamicKeystroke = z.infer<typeof hmkAKDynamicKeystrokeSchema>

export const hmkAKTapHoldSchema = z.object({
  type: z.literal(HMKAKType.TAP_HOLD),
  tapKeycode: uint8Schema,
  holdKeycode: uint8Schema,
  tappingTerm: uint16Schema,
  holdOnOtherKeyPress: z.boolean(),
})

export type HMKAKTapHold = z.infer<typeof hmkAKTapHoldSchema>

export const hmkAKToggleSchema = z.object({
  type: z.literal(HMKAKType.TOGGLE),
  keycode: uint8Schema,
  tappingTerm: uint16Schema,
})

export type HMKAKToggle = z.infer<typeof hmkAKToggleSchema>

export const hmkAdvancedKeySchema = z.object({
  layer: uint8Schema.max(MAX_NUM_LAYERS - 1),
  key: uint8Schema.max(MAX_NUM_KEYS - 1),
  action: z.union([
    hmkAKNoneSchema,
    hmkAKNullBindSchema,
    hmkAKDynamicKeystrokeSchema,
    hmkAKTapHoldSchema,
    hmkAKToggleSchema,
  ]),
})

export type HMKAdvancedKey = z.infer<typeof hmkAdvancedKeySchema>

export const hmkGamepadAnalogCurveSchema = z
  .array(
    z.object({
      x: uint8Schema,
      y: uint8Schema,
    }),
  )
  .length(4)

export enum HMKGamepadButton {
  NONE = 0,

  // Digital buttons
  A,
  B,
  X,
  Y,
  UP,
  DOWN,
  LEFT,
  RIGHT,
  START,
  BACK,
  HOME,
  LS,
  RS,
  LB,
  RB,

  // Analog buttons
  LS_UP,
  LS_DOWN,
  LS_LEFT,
  LS_RIGHT,
  RS_UP,
  RS_DOWN,
  RS_LEFT,
  RS_RIGHT,
  LT,
  RT,
}

export type HMKGamepadAnalogCurve = z.infer<typeof hmkGamepadAnalogCurveSchema>

export const hmkGamepadOptionsSchema = z.object({
  analogCurve: hmkGamepadAnalogCurveSchema,
  keyboardEnabled: z.boolean(),
  gamepadOverride: z.boolean(),
  squareJoystick: z.boolean(),
  snappyJoystick: z.boolean(),
})

export type HMKGamepadOptions = z.infer<typeof hmkGamepadOptionsSchema>
