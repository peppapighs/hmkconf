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

export type DeviceCalibration = {
  initialRestValue: number
  initialBottomOutThreshold: number
}

export type DeviceActuation = {
  actuationPoint: number
  rtDown: number
  rtUp: number
  continuous: boolean
}

export enum DeviceAKType {
  NONE = 0,
  NULL_BIND,
  DYNAMIC_KEYSTROKE,
  TAP_HOLD,
  TOGGLE,
}

export type DeviceAKNone = {
  type: DeviceAKType.NONE
}

export enum DeviceNullBindBehavior {
  LAST = 0,
  PRIMARY,
  SECONDARY,
  NEUTRAL,
  DISTANCE,
}

export type DeviceAKNullBind = {
  type: DeviceAKType.NULL_BIND
  secondaryKey: number
  behavior: DeviceNullBindBehavior
  bottomOutPoint: number
}

export enum DeviceDKSAction {
  HOLD = 0,
  PRESS,
  RELEASE,
  TAP,
}

export type DeviceAKDynamicKeystroke = {
  type: DeviceAKType.DYNAMIC_KEYSTROKE
  keycodes: number[]
  bitmap: DeviceDKSAction[][]
  bottomOutPoint: number
}

export type DeviceAKTapHold = {
  type: DeviceAKType.TAP_HOLD
  tapKeycode: number
  holdKeycode: number
  tappingTerm: number
  holdOnOtherKeyPress: boolean
}

export type DeviceAKToggle = {
  type: DeviceAKType.TOGGLE
  keycode: number
  tappingTerm: number
}

export type DeviceAdvancedKey = {
  layer: number
  key: number
  ak:
    | DeviceAKNone
    | DeviceAKNullBind
    | DeviceAKDynamicKeystroke
    | DeviceAKTapHold
    | DeviceAKToggle
}

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
