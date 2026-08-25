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

import type { HMK_Calibration, HMK_Options } from "$lib/libhmk"
import type { HMK_Actuation } from "$lib/libhmk/actuation"
import type { HMK_AdvancedKey } from "$lib/libhmk/advanced-keys"
import type { HMK_AnalogInfo } from "$lib/libhmk/commands"
import type { HMK_GamepadOptions } from "$lib/libhmk/gamepad"
import type { HMK_MacroNode } from "$lib/libhmk/macro"
import type {
  HMK_RGBCapabilities,
  HMK_RGBColor,
  HMK_RGBState,
} from "$lib/libhmk/rgb"
import { Context } from "runed"
import type { KeyboardMetadata } from "./metadata"

type SetParams<T> = { data: T }

export type SetCalibrationParams = SetParams<HMK_Calibration>

export type SetOptionsParams = SetParams<HMK_Options>

export type ResetProfileParams = { profile: number }
export type DuplicateProfileParams = { profile: number; srcProfile: number }

type GetProfileParams = { profile: number }
type SetProfileParams<T> = { profile: number; data: T }
type SetProfileArrayParams<T> = { profile: number; offset: number; data: T[] }

export type GetKeymapParams = GetProfileParams
export type SetKeymapParams = SetProfileArrayParams<number> & { layer: number }

export type GetActuationMapParams = GetProfileParams
export type SetActuationMapParams = SetProfileArrayParams<HMK_Actuation>

export type GetAdvancedKeysParams = GetProfileParams
export type SetAdvancedKeysParams = SetProfileArrayParams<HMK_AdvancedKey>

export type GetTickRateParams = GetProfileParams
export type SetTickRateParams = SetProfileParams<number>

export type GetMacrosParams = GetProfileParams
export type SetMacrosParams = SetProfileArrayParams<HMK_MacroNode>

export type GetGamepadButtonsParams = GetProfileParams
export type SetGamepadButtonsParams = SetProfileArrayParams<number>
export type GetGamepadOptionsParams = GetProfileParams
export type SetGamepadOptionsParams = SetProfileParams<HMK_GamepadOptions>

export type GetRgbStateParams = { capabilities: HMK_RGBCapabilities }
export type SetRgbEnabledParams = GetRgbStateParams & SetParams<boolean>
export type SetRgbBrightnessParams = GetRgbStateParams & SetParams<number>
export type SetRgbEffectParams = SetParams<number>
export type GetRgbPixelParams = GetRgbStateParams & { index: number }
export type SetRgbPixelParams = GetRgbPixelParams & SetParams<HMK_RGBColor>
export type FillRgbParams = GetRgbStateParams & SetParams<HMK_RGBColor>
export type WriteRgbFrameParams = GetRgbStateParams & {
  data: ArrayLike<number>
}

export type KeyboardState = {
  id: string
  version: number
  metadata: KeyboardMetadata
  demo: boolean
}

export type KeyboardAction = {
  disconnect(): Promise<void>
  forget(): Promise<void>

  reboot(): Promise<void>
  bootloader(): Promise<void>
  factoryReset(): Promise<void>
  recalibrate(): Promise<void>
  analogInfo(): Promise<HMK_AnalogInfo[]>
  getCalibration(): Promise<HMK_Calibration>
  setCalibration(params: SetCalibrationParams): Promise<void>
  getProfile(): Promise<number>
  getOptions(): Promise<HMK_Options>
  setOptions(params: SetOptionsParams): Promise<void>
  resetProfile(params: ResetProfileParams): Promise<void>
  duplicateProfile(params: DuplicateProfileParams): Promise<void>
  saveCalibrationThreshold(): Promise<void>

  getKeymap(params: GetKeymapParams): Promise<number[][]>
  setKeymap(params: SetKeymapParams): Promise<void>
  getActuationMap(params: GetActuationMapParams): Promise<HMK_Actuation[]>
  setActuationMap(params: SetActuationMapParams): Promise<void>
  getAdvancedKeys(params: GetAdvancedKeysParams): Promise<HMK_AdvancedKey[]>
  setAdvancedKeys(params: SetAdvancedKeysParams): Promise<void>
  getTickRate(params: GetTickRateParams): Promise<number>
  setTickRate(params: SetTickRateParams): Promise<void>
  getGamepadButtons(params: GetGamepadButtonsParams): Promise<number[]>
  setGamepadButtons(params: SetGamepadButtonsParams): Promise<void>
  getGamepadOptions(
    params: GetGamepadOptionsParams,
  ): Promise<HMK_GamepadOptions>
  setGamepadOptions(params: SetGamepadOptionsParams): Promise<void>
  getMacros(params: GetMacrosParams): Promise<HMK_MacroNode[]>
  setMacros(params: SetMacrosParams): Promise<void>

  getRgbCapabilities(): Promise<HMK_RGBCapabilities>
  getRgbState(params: GetRgbStateParams): Promise<HMK_RGBState>
  setRgbEnabled(params: SetRgbEnabledParams): Promise<void>
  setRgbBrightness(params: SetRgbBrightnessParams): Promise<void>
  setRgbEffect(params: SetRgbEffectParams): Promise<void>
  restoreRgbEffect(): Promise<number>
  getRgbPixel(params: GetRgbPixelParams): Promise<HMK_RGBColor>
  setRgbPixel(params: SetRgbPixelParams): Promise<void>
  fillRgb(params: FillRgbParams): Promise<void>
  clearRgb(params: GetRgbStateParams): Promise<void>
  setRgbStaticColor(params: FillRgbParams): Promise<void>
  getRgbFrame(params: GetRgbStateParams): Promise<Uint8Array>
  writeRgbFrame(params: WriteRgbFrameParams): Promise<void>
}

export type Keyboard = KeyboardState & KeyboardAction

export const keyboardContext = new Context<Keyboard>("hmk-keyboard")
