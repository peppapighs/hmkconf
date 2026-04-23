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
import { getMetadata } from "$lib/libhmk/commands/metadata"
import { getOptions, setOptions } from "$lib/libhmk/commands/options"
import {
  duplicateProfile,
  getProfile,
  resetProfile,
} from "$lib/libhmk/commands/profile"
import { reboot } from "$lib/libhmk/commands/reboot"
import { getSerial } from "$lib/libhmk/commands/serial"
import { getTickRate, setTickRate } from "$lib/libhmk/commands/tick-rate"
import { displayVersion, isWebHIDSSupported } from "$lib/utils"
import type {
  DuplicateProfileParams,
  GetActuationMapParams,
  GetAdvancedKeysParams,
  GetGamepadButtonsParams,
  GetGamepadOptionsParams,
  GetKeymapParams,
  GetTickRateParams,
  Keyboard,
  ResetProfileParams,
  SetActuationMapParams,
  SetAdvancedKeysParams,
  SetCalibrationParams,
  SetGamepadButtonsParams,
  SetGamepadOptionsParams,
  SetKeymapParams,
  SetOptionsParams,
  SetTickRateParams,
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

  async disconnect() {
    await this.commander.clear()
    await this.commander.hidDevice.close()
    this.onDisconnect?.(this)
  }
  async forget() {
    await this.commander.clear()
    await this.commander.hidDevice.forget()
    this.onDisconnect?.(this)
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
    return getOptions(this.commander)
  }
  setOptions(params: SetOptionsParams) {
    return setOptions(this.commander, params)
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
}

export async function connect(
  onDisconnect?: (keyboard: Keyboard) => void,
): Promise<Keyboard | null> {
  if (!isWebHIDSSupported()) {
    throw new Error("WebHID is not supported in this browser.")
  }

  const devices = (await navigator.hid.getDevices()).filter(
    (device) =>
      device.collections[0].usagePage === HMK_DEVICE_USAGE_PAGE &&
      device.collections[0].usage === HMK_DEVICE_USAGE_ID,
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

    navigator.hid.addEventListener("disconnect", async function handler() {
      navigator.hid.removeEventListener("disconnect", handler)
      await keyboard.disconnect()
    })

    return keyboard
  } catch (err) {
    await commander.clear()
    await commander.hidDevice.forget()

    throw err
  }
}
