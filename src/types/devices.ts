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

export enum DeviceRequest {
  CLASS_REQUEST_FIRMWARE_VERSION = 0,
  CLASS_REQUEST_REBOOT,
  CLASS_REQUEST_BOOTLOADER,
  CLASS_REQUEST_FACTORY_RESET,
  CLASS_REQUEST_RECALIBRATE,
  CLASS_REQUEST_DEBUG,
  CLASS_REQUEST_GET_PROFILE_NUM,
  // Requests below use `wValue` to specify the profile number
  CLASS_REQUEST_GET_KEYMAP,
  CLASS_REQUEST_SET_KEYMAP,
  CLASS_REQUEST_GET_ACTUATIONS,
  CLASS_REQUEST_SET_ACTUATIONS,
  CLASS_REQUEST_GET_AKC,
  CLASS_REQUEST_SET_AKC,
}

export type DeviceState = {
  id: string
  metadata: DeviceMetadata
  isDemo: boolean
}

export type DeviceDebugInfo = {
  adcValue: number
  distance: number
}

export type DeviceActuation = {
  actuationPoint: number
  rtDown: number
  rtUp: number
  continuous: boolean
}

export enum DeviceAKCType {
  AKC_NONE = 0,
  AKC_NULL_BIND,
  AKC_DKS,
  AKC_TAP_HOLD,
  AKC_TOGGLE,
}

export type DeviceAKCNone = {
  type: DeviceAKCType.AKC_NONE
}

export enum DeviceAKCNullBindBehavior {
  NULL_BIND_DISTANCE = 0,
  NULL_BIND_LAST,
  NULL_BIND_PRIMARY,
  NULL_BIND_SECONDARY,
  NULL_BIND_NEUTRAL,
}

export type DeviceAKCNullBind = {
  type: DeviceAKCType.AKC_NULL_BIND
  secondaryKey: number
  behavior: DeviceAKCNullBindBehavior
  bottomOutPoint: number
}

export enum DeviceAKCDKSAction {
  DKS_HOLD = 0,
  DKS_PRESS,
  DKS_RELEASE,
  DKS_TAP,
}

export type DeviceAKCDKS = {
  type: DeviceAKCType.AKC_DKS
  keycodes: number[]
  bitmap: DeviceAKCDKSAction[][]
  bottomOutPoint: number
}

export type DeviceAKCTapHold = {
  type: DeviceAKCType.AKC_TAP_HOLD
  tapKeycode: number
  holdKeycode: number
  tappingTerm: number
}

export type DeviceAKCToggle = {
  type: DeviceAKCType.AKC_TOGGLE
  keycode: number
  tappingTerm: number
}

export type DeviceAKC = {
  layer: number
  key: number
  akc:
    | DeviceAKCNone
    | DeviceAKCNullBind
    | DeviceAKCDKS
    | DeviceAKCTapHold
    | DeviceAKCToggle
}

export type DeviceAction = {
  connect(): Promise<void>
  disconnect(): Promise<void>
  firmwareVersion(): Promise<number>
  reboot(): Promise<void>
  bootloader(): Promise<void>
  factoryReset(): Promise<void>
  recalibrate(): Promise<void>
  debug(): Promise<DeviceDebugInfo[]>
  getProfileNum(): Promise<number>
  getKeymap(profileNum: number): Promise<number[][]>
  setKeymap(profileNum: number, keymap: number[][]): Promise<void>
  getActuations(profileNum: number): Promise<DeviceActuation[]>
  setActuations(
    profileNum: number,
    actuations: DeviceActuation[],
  ): Promise<void>
  getAKC(profileNum: number): Promise<DeviceAKC[]>
  setAKC(profileNum: number, akc: DeviceAKC[]): Promise<void>
}

export type Device = DeviceState & DeviceAction

export type DeviceAKCMetadata = {
  type: DeviceAKCType
  name: string
  description: string
  numKeys: number
  keycodes: number[]
  create(layer: number, keys: number[], keymap: number[]): DeviceAKC
}

export type DeviceAKCNullBindBehaviorMetadata = {
  behavior: DeviceAKCNullBindBehavior
  name: string
  description: string
}
