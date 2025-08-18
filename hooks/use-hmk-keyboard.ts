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

import { useState } from "react"
import { v7 as uuidv7 } from "uuid"

import {
  HMK_DEVICE_USAGE_ID,
  HMK_DEVICE_USAGE_PAGE,
  HMK_VERSION,
} from "@/constants/libhmk"
import { CommandDevice } from "@/lib/command-device"
import {
  getActuationMap,
  setActuationMap,
} from "@/lib/libhmk/commands/actuation-map"
import {
  getAdvancedKeys,
  setAdvancedKeys,
} from "@/lib/libhmk/commands/advanced-keys"
import { analogInfo } from "@/lib/libhmk/commands/analog-info"
import { bootloader } from "@/lib/libhmk/commands/bootloader"
import {
  getCalibration,
  setCalibration,
} from "@/lib/libhmk/commands/calibration"
import { factoryReset } from "@/lib/libhmk/commands/factory-reset"
import { firmwareVersion } from "@/lib/libhmk/commands/firmware-version"
import {
  getGamepadButtons,
  setGamepadButtons,
} from "@/lib/libhmk/commands/gamepad-buttons"
import {
  getGamepadOptions,
  setGamepadOptions,
} from "@/lib/libhmk/commands/gamepad-options"
import { getKeymap, setKeymap } from "@/lib/libhmk/commands/keymap"
import { getMetadata } from "@/lib/libhmk/commands/metadata"
import { getOptions, setOptions } from "@/lib/libhmk/commands/options"
import {
  duplicateProfile,
  getProfile,
  resetProfile,
} from "@/lib/libhmk/commands/profile"
import { reboot } from "@/lib/libhmk/commands/reboot"
import { recalibrate } from "@/lib/libhmk/commands/recalibrate"
import { getTickRate, setTickRate } from "@/lib/libhmk/commands/tick-rate"
import { displayVersion } from "@/lib/ui"
import { isWebHIDSupported } from "@/lib/utils"
import { KeyboardAction, KeyboardState } from "@/types/keyboard"
import { KeyboardMetadata } from "@/types/keyboard/metadata"

export type HMKKeyboardState = KeyboardState & {
  device: CommandDevice
}

type HMKKeyboard = HMKKeyboardState & KeyboardAction

export function useHMKKeyboard() {
  const [keyboard, setKeyboard] = useState<HMKKeyboard | null>(null)

  const connect = async () => {
    if (!isWebHIDSupported()) {
      throw new Error("WebHID is not supported in this browser.")
    }

    if (keyboard !== null) {
      await keyboard.disconnect()
      setKeyboard(null)
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

    if (devices.length === 0) {
      return
    }

    const device = devices[0]

    if (!device.opened) {
      await device.open()
    }

    const keyboardState: HMKKeyboardState = {
      id: uuidv7(),
      metadata: {} as KeyboardMetadata,
      isDemo: false,
      device: new CommandDevice(device),
    }

    try {
      const version = await firmwareVersion(keyboardState)
      if (version < HMK_VERSION) {
        throw new Error(
          `Device firmware version ${displayVersion(version)} is outdated. Please update the firmware to ${displayVersion(HMK_VERSION)} or later.`,
        )
      }

      const metadata = await getMetadata(keyboardState)
      keyboardState.metadata = metadata
    } catch (err) {
      await keyboardState.device.clear()
      await device.forget()

      throw err
    }

    const hmkKeyboard: HMKKeyboard = {
      ...keyboardState,

      disconnect: async () => {
        navigator.hid.removeEventListener("disconnect", hmkKeyboard.disconnect)
        await keyboardState.device.clear()
        await device.close()
        setKeyboard(null)
      },
      forget: async () => {
        navigator.hid.removeEventListener("disconnect", hmkKeyboard.disconnect)
        await keyboardState.device.clear()
        await device.forget()
        setKeyboard(null)
      },

      firmwareVersion: (...args) => firmwareVersion(keyboardState, ...args),
      reboot: (...args) => reboot(keyboardState, ...args),
      bootloader: (...args) => bootloader(keyboardState, ...args),
      factoryReset: (...args) => factoryReset(keyboardState, ...args),
      recalibrate: (...args) => recalibrate(keyboardState, ...args),
      analogInfo: (...args) => analogInfo(keyboardState, ...args),
      getCalibration: (...args) => getCalibration(keyboardState, ...args),
      setCalibration: (...args) => setCalibration(keyboardState, ...args),
      getOptions: (...args) => getOptions(keyboardState, ...args),
      setOptions: (...args) => setOptions(keyboardState, ...args),
      getProfile: (...args) => getProfile(keyboardState, ...args),
      resetProfile: (...args) => resetProfile(keyboardState, ...args),
      duplicateProfile: (...args) => duplicateProfile(keyboardState, ...args),

      getKeymap: (...args) => getKeymap(keyboardState, ...args),
      setKeymap: (...args) => setKeymap(keyboardState, ...args),
      getActuationMap: (...args) => getActuationMap(keyboardState, ...args),
      setActuationMap: (...args) => setActuationMap(keyboardState, ...args),
      getAdvancedKeys: (...args) => getAdvancedKeys(keyboardState, ...args),
      setAdvancedKeys: (...args) => setAdvancedKeys(keyboardState, ...args),
      getTickRate: (...args) => getTickRate(keyboardState, ...args),
      setTickRate: (...args) => setTickRate(keyboardState, ...args),
      getGamepadButtons: (...args) => getGamepadButtons(keyboardState, ...args),
      setGamepadButtons: (...args) => setGamepadButtons(keyboardState, ...args),
      getGamepadOptions: (...args) => getGamepadOptions(keyboardState, ...args),
      setGamepadOptions: (...args) => setGamepadOptions(keyboardState, ...args),
    }

    navigator.hid.addEventListener("disconnect", hmkKeyboard.disconnect)

    setKeyboard(hmkKeyboard)
  }

  return { connect, keyboard }
}
