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

import { displayUInt16 } from "$lib/integer"
import {
  HMK_DEVICE_USAGE_ID,
  HMK_DEVICE_USAGE_PAGE,
  HMK_FIRMWARE_MIN_VERSION,
} from "$lib/libhmk"
import {
  getActuationMap,
  setActuationMap,
} from "$lib/libhmk/commands/actuation-map"
import {
  getAdvancedKeys,
  setAdvancedKeys,
} from "$lib/libhmk/commands/advanced-keys"
import { analogInfo } from "$lib/libhmk/commands/analog-info"
import { bootloader } from "$lib/libhmk/commands/bootloader"
import {
  getCalibration,
  recalibrate,
  saveCalibrationThreshold,
  setCalibration,
} from "$lib/libhmk/commands/calibration"
import { factoryReset } from "$lib/libhmk/commands/factory-reset"
import { firmwareVersion } from "$lib/libhmk/commands/firmware-version"
import {
  getGamepadButtons,
  setGamepadButtons,
} from "$lib/libhmk/commands/gamepad-buttons"
import {
  getGamepadOptions,
  setGamepadOptions,
} from "$lib/libhmk/commands/gamepad-options"
import { getKeymap, setKeymap } from "$lib/libhmk/commands/keymap"
import { getMacros, setMacros } from "$lib/libhmk/commands/macros"
import { getMetadata } from "$lib/libhmk/commands/metadata"
import { getOptions, setOptions } from "$lib/libhmk/commands/options"
import {
  duplicateProfile,
  getProfile,
  resetProfile,
} from "$lib/libhmk/commands/profile"
import { reboot } from "$lib/libhmk/commands/reboot"
import {
  clearRgb,
  fillRgb,
  getRgbCapabilities,
  getRgbFrame,
  getRgbPixel,
  getRgbState,
  restoreRgbEffect,
  setRgbBrightness,
  setRgbEffect,
  setRgbEnabled,
  setRgbPixel,
  setRgbStaticColor,
  writeRgbFrame,
} from "$lib/libhmk/commands/rgb"
import { getSerial } from "$lib/libhmk/commands/serial"
import { getTickRate, setTickRate } from "$lib/libhmk/commands/tick-rate"
import { displayVersion, isWebHIDSSupported } from "$lib/utils"
import type {
  DuplicateProfileParams,
  FillRgbParams,
  GetActuationMapParams,
  GetAdvancedKeysParams,
  GetGamepadButtonsParams,
  GetGamepadOptionsParams,
  GetKeymapParams,
  GetMacrosParams,
  GetRgbPixelParams,
  GetRgbStateParams,
  GetTickRateParams,
  Keyboard,
  ResetProfileParams,
  SetActuationMapParams,
  SetAdvancedKeysParams,
  SetCalibrationParams,
  SetGamepadButtonsParams,
  SetGamepadOptionsParams,
  SetKeymapParams,
  SetMacrosParams,
  SetOptionsParams,
  SetRgbBrightnessParams,
  SetRgbEffectParams,
  SetRgbEnabledParams,
  SetRgbPixelParams,
  SetTickRateParams,
  WriteRgbFrameParams,
} from "."
import { Commander } from "./commander"
import type { KeyboardMetadata } from "./metadata"

type HMKKeyboardProps = {
  id: string
  version: number
  metadata: KeyboardMetadata
  commander: Commander
  onDisconnect?: (keyboard: Keyboard) => void
}

class HMKKeyboard implements Keyboard {
  id: string
  demo = false
  version: number
  metadata: KeyboardMetadata
  commander: Commander
  onDisconnect?: (keyboard: Keyboard) => void
  #disconnectHandler?: (event: HIDConnectionEvent) => void
  #disconnectPromise?: Promise<void>

  constructor({
    id,
    version,
    metadata,
    commander,
    onDisconnect,
  }: HMKKeyboardProps) {
    this.id = id
    this.version = version
    this.metadata = metadata
    this.commander = commander
    this.onDisconnect = onDisconnect
  }

  listenForDisconnect() {
    this.#disconnectHandler = (event) => {
      if (event.device !== this.commander.hidDevice) return
      void this.disconnect().catch((err) => console.error(err))
    }
    navigator.hid.addEventListener("disconnect", this.#disconnectHandler)
  }

  #removeDisconnectListener() {
    if (!this.#disconnectHandler) return
    navigator.hid.removeEventListener("disconnect", this.#disconnectHandler)
    this.#disconnectHandler = undefined
  }

  #detach(forget: boolean) {
    if (this.#disconnectPromise) return this.#disconnectPromise
    this.#disconnectPromise = (async () => {
      this.#removeDisconnectListener()
      try {
        await this.commander.clear()
        if (forget) {
          await this.commander.hidDevice.forget()
        } else if (this.commander.hidDevice.opened) {
          await this.commander.hidDevice.close()
        }
      } finally {
        const callback = this.onDisconnect
        this.onDisconnect = undefined
        callback?.(this)
      }
    })()
    return this.#disconnectPromise
  }

  disconnect() {
    return this.#detach(false)
  }
  forget() {
    return this.#detach(true)
  }

  reboot() {
    return reboot(this.commander)
  }
  bootloader() {
    return bootloader(this.commander)
  }
  factoryReset() {
    return factoryReset(this.commander)
  }
  recalibrate() {
    return recalibrate(this.commander)
  }
  analogInfo() {
    return analogInfo(this.commander, this.metadata)
  }
  getCalibration() {
    return getCalibration(this.commander)
  }
  setCalibration(params: SetCalibrationParams) {
    return setCalibration(this.commander, params)
  }
  getProfile() {
    return getProfile(this.commander)
  }
  getOptions() {
    return getOptions(this.commander, this.metadata.gamepadApis, this.version)
  }
  setOptions(params: SetOptionsParams) {
    return setOptions(
      this.commander,
      params,
      this.metadata.gamepadApis,
      this.version,
    )
  }
  resetProfile(params: ResetProfileParams) {
    return resetProfile(this.commander, params)
  }
  duplicateProfile(params: DuplicateProfileParams) {
    return duplicateProfile(this.commander, params)
  }
  saveCalibrationThreshold() {
    return saveCalibrationThreshold(this.commander)
  }

  getKeymap(params: GetKeymapParams) {
    return getKeymap(this.commander, this.metadata, params)
  }
  setKeymap(params: SetKeymapParams) {
    return setKeymap(this.commander, params)
  }
  getActuationMap(params: GetActuationMapParams) {
    return getActuationMap(this.commander, this.metadata, params)
  }
  setActuationMap(params: SetActuationMapParams) {
    return setActuationMap(this.commander, params)
  }
  getAdvancedKeys(params: GetAdvancedKeysParams) {
    return getAdvancedKeys(this.version, this.commander, this.metadata, params)
  }
  setAdvancedKeys(params: SetAdvancedKeysParams) {
    return setAdvancedKeys(this.version, this.commander, this.metadata, params)
  }
  getTickRate(params: GetTickRateParams) {
    return getTickRate(this.commander, params)
  }
  setTickRate(params: SetTickRateParams) {
    return setTickRate(this.commander, params)
  }
  getGamepadButtons(params: GetGamepadButtonsParams) {
    return getGamepadButtons(this.commander, this.metadata, params)
  }
  setGamepadButtons(params: SetGamepadButtonsParams) {
    return setGamepadButtons(this.commander, params)
  }
  getGamepadOptions(params: GetGamepadOptionsParams) {
    return getGamepadOptions(this.commander, params)
  }
  setGamepadOptions(params: SetGamepadOptionsParams) {
    return setGamepadOptions(this.commander, params)
  }
  getMacros(params: GetMacrosParams) {
    return getMacros(this.version, this.commander, this.metadata, params)
  }
  setMacros(params: SetMacrosParams) {
    return setMacros(this.version, this.commander, params)
  }

  getRgbCapabilities() {
    return getRgbCapabilities(this.commander)
  }
  getRgbState({ capabilities }: GetRgbStateParams) {
    return getRgbState(this.commander, capabilities)
  }
  setRgbEnabled({ capabilities, data }: SetRgbEnabledParams) {
    return setRgbEnabled(this.commander, capabilities, data)
  }
  setRgbBrightness({ capabilities, data }: SetRgbBrightnessParams) {
    return setRgbBrightness(this.commander, capabilities, data)
  }
  setRgbEffect({ data }: SetRgbEffectParams) {
    return setRgbEffect(this.commander, data)
  }
  restoreRgbEffect() {
    return restoreRgbEffect(this.commander)
  }
  getRgbPixel({ capabilities, index }: GetRgbPixelParams) {
    return getRgbPixel(this.commander, capabilities, index)
  }
  setRgbPixel({ capabilities, index, data }: SetRgbPixelParams) {
    return setRgbPixel(this.commander, capabilities, index, data)
  }
  fillRgb({ capabilities, data }: FillRgbParams) {
    return fillRgb(this.commander, capabilities, data)
  }
  clearRgb({ capabilities }: GetRgbStateParams) {
    return clearRgb(this.commander, capabilities)
  }
  setRgbStaticColor({ capabilities, data }: FillRgbParams) {
    return setRgbStaticColor(this.commander, capabilities, data)
  }
  getRgbFrame({ capabilities }: GetRgbStateParams) {
    return getRgbFrame(this.commander, capabilities)
  }
  writeRgbFrame({ capabilities, data }: WriteRgbFrameParams) {
    return writeRgbFrame(this.commander, capabilities, data)
  }
}

export async function connect(
  onDisconnect?: (keyboard: Keyboard) => void,
): Promise<Keyboard | null> {
  if (!isWebHIDSSupported()) {
    throw new Error("WebHID is not supported in this browser.")
  }

  const devices = (await navigator.hid.getDevices()).filter((device) =>
    device.collections.some(
      (collection) =>
        collection.usagePage === HMK_DEVICE_USAGE_PAGE &&
        collection.usage === HMK_DEVICE_USAGE_ID,
    ),
  )

  if (devices.length === 0) {
    devices.push(
      ...(await navigator.hid.requestDevice({
        filters: [
          { usagePage: HMK_DEVICE_USAGE_PAGE, usage: HMK_DEVICE_USAGE_ID },
        ],
      })),
    )
  }

  if (devices.length === 0) return null

  const commander = new Commander(devices[0])
  if (!commander.hidDevice.opened) {
    await commander.hidDevice.open()
  }

  try {
    const version = await firmwareVersion(commander)
    if (version < HMK_FIRMWARE_MIN_VERSION) {
      throw new Error(
        `Device firmware version ${displayVersion(version)} is outdated. Please update the firmware to ${displayVersion(HMK_FIRMWARE_MIN_VERSION)} or later.`,
      )
    }

    const serial = await getSerial(commander)
    const metadata = await getMetadata(commander)
    const keyboard = new HMKKeyboard({
      id: `${displayUInt16(commander.hidDevice.vendorId)}-${displayUInt16(commander.hidDevice.productId)}-${serial}`,
      version,
      metadata,
      commander,
      onDisconnect,
    })

    keyboard.listenForDisconnect()

    return keyboard
  } catch (err) {
    await commander.clear()
    await commander.hidDevice.forget()

    throw err
  }
}
