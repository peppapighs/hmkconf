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

import { DataViewReader } from "$lib/data-view-reader"
import type { SetOptionsParams } from "$lib/keyboard"
import type { Commander } from "$lib/keyboard/commander"
import { HMK_Command } from "."
import {
  featureVersionMap,
  type HMK_GamepadApi,
  type HMK_GamepadMode,
  type HMK_Options,
} from ".."

const LEGACY_GAMEPAD_APIS: readonly HMK_GamepadApi[] = ["xinput"]

function hasHidGamepadApi(gamepadApis: readonly HMK_GamepadApi[]) {
  return gamepadApis.includes("hid")
}

function usesLegacySaveThresholdBit(
  gamepadApis: readonly HMK_GamepadApi[],
  firmwareVersion: number | undefined,
) {
  return (
    !hasHidGamepadApi(gamepadApis) &&
    (firmwareVersion === undefined ||
      firmwareVersion < featureVersionMap.saveCalibrationThreshold)
  )
}

function assertSupportedMode(
  mode: HMK_GamepadMode,
  gamepadApis: readonly HMK_GamepadApi[],
) {
  if (mode !== "disabled" && !gamepadApis.includes(mode)) {
    throw new Error(`The keyboard does not advertise the ${mode} gamepad API.`)
  }
}

/** Decode the global options word without reinterpreting legacy bit 1 as HID. */
export function decodeOptionsWord(
  optionsRaw: number,
  gamepadApis: readonly HMK_GamepadApi[] = LEGACY_GAMEPAD_APIS,
  firmwareVersion?: number,
): HMK_Options {
  const xInputEnabled = ((optionsRaw >> 0) & 1) !== 0
  const secondBit = ((optionsRaw >> 1) & 1) !== 0
  const highPollingRateEnabled = ((optionsRaw >> 2) & 1) !== 0

  if (hasHidGamepadApi(gamepadApis)) {
    const gamepadMode: HMK_GamepadMode = xInputEnabled
      ? "xinput"
      : secondBit
        ? "hid"
        : "disabled"
    assertSupportedMode(gamepadMode, gamepadApis)
    return {
      xInputEnabled,
      // In HID-aware metadata, bit 1 selects HID only when XInput is disabled,
      // matching the firmware's XInput-first priority.
      saveBottomOutThreshold: false,
      highPollingRateEnabled,
      gamepadMode,
      rawWord: optionsRaw,
    }
  }

  const gamepadMode: HMK_GamepadMode = xInputEnabled ? "xinput" : "disabled"
  assertSupportedMode(gamepadMode, gamepadApis)
  return {
    xInputEnabled,
    saveBottomOutThreshold: usesLegacySaveThresholdBit(
      gamepadApis,
      firmwareVersion,
    )
      ? secondBit
      : false,
    highPollingRateEnabled,
    gamepadMode,
    rawWord: optionsRaw,
  }
}

/** Encode exactly one of disabled/XInput/HID while preserving legacy bit 1. */
export function encodeOptionsWord(
  options: HMK_Options,
  gamepadApis: readonly HMK_GamepadApi[] = LEGACY_GAMEPAD_APIS,
  firmwareVersion?: number,
) {
  const gamepadMode =
    options.gamepadMode ?? (options.xInputEnabled ? "xinput" : "disabled")
  assertSupportedMode(gamepadMode, gamepadApis)

  const xInputBit = gamepadMode === "xinput" ? 1 : 0
  const secondBit = hasHidGamepadApi(gamepadApis)
    ? gamepadMode === "hid"
      ? 1
      : 0
    : usesLegacySaveThresholdBit(gamepadApis, firmwareVersion) &&
        options.saveBottomOutThreshold
      ? 1
      : 0

  const knownBits =
    (xInputBit << 0) |
    (secondBit << 1) |
    ((options.highPollingRateEnabled ? 1 : 0) << 2)

  // All UI setters spread the last GET_OPTIONS result. Keep every bit outside
  // the v1 known mask so future flags survive an unrelated setting change.
  return ((options.rawWord ?? 0) & ~0b111) | knownBits
}

export async function getOptions(
  commander: Commander,
  gamepadApis: readonly HMK_GamepadApi[] = LEGACY_GAMEPAD_APIS,
  firmwareVersion?: number,
): Promise<HMK_Options> {
  const optionsRaw = new DataViewReader(
    await commander.sendCommand({ command: HMK_Command.GET_OPTIONS }),
  ).uint16()

  return decodeOptionsWord(optionsRaw, gamepadApis, firmwareVersion)
}

export async function setOptions(
  commander: Commander,
  { data }: SetOptionsParams,
  gamepadApis: readonly HMK_GamepadApi[] = LEGACY_GAMEPAD_APIS,
  firmwareVersion?: number,
) {
  const encoded = encodeOptionsWord(data, gamepadApis, firmwareVersion)
  await commander.sendCommand({
    command: HMK_Command.SET_OPTIONS,
    payload: [encoded & 0xff, encoded >> 8],
  })
}
