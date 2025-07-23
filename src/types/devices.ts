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
import { DeviceMetadata } from "./device-metadata"

export enum DeviceCommand {
  FIRMWARE_VERSION = 0,
  REBOOT,
  BOOTLOADER,
  FACTORY_RESET,
  RECALIBRATE,
  ANALOG_INFO,
  GET_CALIBRATION,
  SET_CALIBRATION,
  GET_PROFILE,

  GET_KEYMAP = 128,
  SET_KEYMAP,
  GET_ACTUATION_MAP,
  SET_ACTUATION_MAP,
  GET_ADVANCED_KEYS,
  SET_ADVANCED_KEYS,
  GET_TICK_RATE,
  SET_TICK_RATE,

  UNKNOWN = 255,
}

export type DeviceState = {
  id: string
  metadata: DeviceMetadata
  isDemo: boolean
}

export type DeviceAnalogInfo = {
  adcValue: number
  distance: number
}

export const deviceCalibrationSchema = z.object({
  initialRestValue: z.number().int().min(0),
  initialBottomOutThreshold: z.number().int().min(0),
})

export type DeviceCalibration = z.infer<typeof deviceCalibrationSchema>

export const deviceActuationSchema = z.object({
  actuationPoint: z.number().int().min(0).max(255),
  rtDown: z.number().int().min(0).max(255),
  rtUp: z.number().int().min(0).max(255),
  continuous: z.boolean(),
})

export type DeviceActuation = z.infer<typeof deviceActuationSchema>

export enum DeviceAKType {
  NONE = 0,
  NULL_BIND,
  DYNAMIC_KEYSTROKE,
  TAP_HOLD,
  TOGGLE,
}

export const deviceAKNoneSchema = z.object({
  type: z.literal(DeviceAKType.NONE),
})

export type DeviceAKNone = z.infer<typeof deviceAKNoneSchema>

export enum DeviceNullBindBehavior {
  LAST = 0,
  PRIMARY,
  SECONDARY,
  NEUTRAL,
  DISTANCE,
}

export const deviceAKNullBind = z.object({
  type: z.literal(DeviceAKType.NULL_BIND),
  secondaryKey: z.number().min(0).max(255),
  behavior: z
    .number()
    .refine((val) => Object.values(DeviceNullBindBehavior).includes(val), {
      error: "Invalid Null Bind behavior",
    }),
  bottomOutPoint: z.number().min(0).max(255),
})

export type DeviceAKNullBind = z.infer<typeof deviceAKNullBind>

export enum DeviceDKSAction {
  HOLD = 0,
  PRESS,
  RELEASE,
  TAP,
}

export const deviceAKDynamicKeystroke = z.object({
  type: z.literal(DeviceAKType.DYNAMIC_KEYSTROKE),
  keycodes: z.array(z.number().int().min(0).max(255)).length(4),
  bitmap: z
    .array(
      z
        .array(
          z
            .number()
            .refine((val) => Object.values(DeviceDKSAction).includes(val), {
              error: "Invalid Dynamic Keystroke action",
            }),
        )
        .length(4),
    )
    .length(4),
  bottomOutPoint: z.number().int().min(0).max(255),
})

export type DeviceAKDynamicKeystroke = z.infer<typeof deviceAKDynamicKeystroke>

export const deviceAKTapHold = z.object({
  type: z.literal(DeviceAKType.TAP_HOLD),
  tapKeycode: z.number().int().min(0).max(255),
  holdKeycode: z.number().int().min(0).max(255),
  tappingTerm: z.number().int().min(0).max(65535),
  holdOnOtherKeyPress: z.boolean(),
})

export type DeviceAKTapHold = z.infer<typeof deviceAKTapHold>

export const deviceAKToggle = z.object({
  type: z.literal(DeviceAKType.TOGGLE),
  keycode: z.number().int().min(0).max(255),
  tappingTerm: z.number().int().min(0).max(65535),
})

export type DeviceAKToggle = z.infer<typeof deviceAKToggle>

export const deviceAdvancedKeySchema = z.object({
  layer: z.number().int().min(0).max(7),
  key: z.number().int().min(0).max(255),
  ak: z.union([
    deviceAKNoneSchema,
    deviceAKNullBind,
    deviceAKDynamicKeystroke,
    deviceAKTapHold,
    deviceAKToggle,
  ]),
})

export type DeviceAdvancedKey = z.infer<typeof deviceAdvancedKeySchema>

export type DeviceAction = {
  connect(): Promise<void>
  disconnect(): Promise<void>
  firmwareVersion(): Promise<number>
  reboot(): Promise<void>
  bootloader(): Promise<void>
  factoryReset(): Promise<void>
  recalibrate(): Promise<void>
  analogInfo(): Promise<DeviceAnalogInfo[]>
  getCalibration(): Promise<DeviceCalibration>
  setCalibration(calibration: DeviceCalibration): Promise<void>
  getProfile(): Promise<number>
  getKeymap(profile: number): Promise<number[][]>
  setKeymap(
    profile: number,
    layer: number,
    start: number,
    keymap: number[],
  ): Promise<void>
  getActuationMap(profile: number): Promise<DeviceActuation[]>
  setActuationMap(
    profile: number,
    start: number,
    actuation: DeviceActuation[],
  ): Promise<void>
  getAdvancedKeys(profile: number): Promise<DeviceAdvancedKey[]>
  setAdvancedKeys(
    profile: number,
    start: number,
    advancedKeys: DeviceAdvancedKey[],
  ): Promise<void>
  getTickRate(profile: number): Promise<number>
  setTickRate(profile: number, tickRate: number): Promise<void>
}

export type Device = DeviceState & DeviceAction

export type DeviceAdvancedKeyMetadata = {
  type: DeviceAKType
  name: string
  description: string
  numKeys: number
  keycodes: number[]
  create(layer: number, keys: number[], keymap: number[]): DeviceAdvancedKey
}

export type DeviceNullBindBehaviorMetadata = {
  behavior: DeviceNullBindBehavior
  name: string
  description: string
}
