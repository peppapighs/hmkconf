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

import { analogCurvePresets } from "$lib/configurator/lib/gamepad"
import {
  HMK_FIRMWARE_MAX_VERSION,
  type HMK_GamepadMode,
  type HMK_Options,
} from "$lib/libhmk"
import { defaultActuation, type HMK_Actuation } from "$lib/libhmk/actuation"
import {
  DEFAULT_TICK_RATE,
  defaultAdvancedKey,
  type HMK_AdvancedKey,
} from "$lib/libhmk/advanced-keys"
import { HMK_GamepadButton, type HMK_GamepadOptions } from "$lib/libhmk/gamepad"
import { defaultMacroNode, type HMK_MacroNode } from "$lib/libhmk/macro"
import {
  HMK_RGBCapability,
  HMK_RGBEffect,
  type HMK_RGBCapabilities,
  type HMK_RGBColor,
} from "$lib/libhmk/rgb"
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
import { demoMetadata, type KeyboardMetadata } from "./metadata"

const DEMO_RGB_LED_COUNT = 24
// These are the 24 key shapes rendered by the demo's default KLE options.
// Map them explicitly so every simulated LED remains reachable exactly once.
const DEMO_RENDERED_RGB_KEYS = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 17, 18, 19, 20, 21, 22, 23,
  24, 25,
] as const
const DEMO_KEY_TO_LED: (number | null)[] = Array(demoMetadata.numKeys).fill(
  null,
)
for (const [led, key] of DEMO_RENDERED_RGB_KEYS.entries()) {
  DEMO_KEY_TO_LED[key] = led
}
const demoRgbCapabilities: HMK_RGBCapabilities = {
  protocolMajor: 1,
  protocolMinor: 0,
  ledCount: DEMO_RGB_LED_COUNT,
  bytesPerPixel: 3,
  chunkBytes: 60,
  liveEffectId: HMK_RGBEffect.LIVE,
  capabilities:
    HMK_RGBCapability.ENABLED |
    HMK_RGBCapability.BRIGHTNESS |
    HMK_RGBCapability.PIXEL |
    HMK_RGBCapability.FRAME_CHUNKS |
    HMK_RGBCapability.FILL |
    HMK_RGBCapability.LIVE_MODE |
    HMK_RGBCapability.RESTORE_MODE,
  colorOrder: 0,
}

const demoKeyboardMetadata: KeyboardMetadata = {
  ...demoMetadata,
  gamepadApis: ["xinput", "hid"],
  // Keep the demo's intentionally partial topology explicit: the first 24
  // logical keys have LEDs, while the remaining key shapes are non-lighting.
  // This exercises nullable mappings without ever inferring key == LED.
  rgb: {
    numLeds: DEMO_RGB_LED_COUNT,
    protocolMajor: 1,
    protocolMinor: 0,
    effects: [
      HMK_RGBEffect.STATIC,
      HMK_RGBEffect.BREATHING,
      HMK_RGBEffect.RAINBOW,
      HMK_RGBEffect.RAINBOW_WAVE,
      HMK_RGBEffect.LIVE,
    ],
    keyToLed: DEMO_KEY_TO_LED,
  },
}

const {
  adcResolution,
  numProfiles,
  numKeys,
  numAdvancedKeys,
  numMacroNodes,
  defaultKeymaps,
} = demoMetadata

type DemoKeyboardProfileState = {
  keymap: number[][]
  actuationMap: HMK_Actuation[]
  advancedKeys: HMK_AdvancedKey[]
  macros: HMK_MacroNode[]
  gamepadButtons: number[]
  gamepadOptions: HMK_GamepadOptions
  tickRate: number
}

function defaultProfile(profile: number): DemoKeyboardProfileState {
  return {
    keymap: defaultKeymaps[profile],
    actuationMap: Array(numKeys).fill(defaultActuation),
    advancedKeys: Array(numAdvancedKeys).fill(defaultAdvancedKey),
    macros: Array(numMacroNodes).fill(defaultMacroNode),
    gamepadButtons: Array(numKeys).fill(HMK_GamepadButton.NONE),
    gamepadOptions: {
      analogCurve: analogCurvePresets[0].curve,
      keyboardEnabled: true,
      gamepadOverride: false,
      squareJoystick: false,
      snappyJoystick: true,
    },
    tickRate: DEFAULT_TICK_RATE,
  }
}

type DemoKeyboardState = {
  options: HMK_Options
  profiles: DemoKeyboardProfileState[]
  rgb: {
    enabled: boolean
    brightness: number
    effect: number
    restoreEffect: number
    frame: Uint8Array
  }
}

export class DemoKeyboard implements Keyboard {
  id = "demo"
  demo = true
  version = HMK_FIRMWARE_MAX_VERSION
  metadata = demoKeyboardMetadata

  #state: DemoKeyboardState = {
    options: {
      xInputEnabled: true,
      saveBottomOutThreshold: false,
      highPollingRateEnabled: true,
      gamepadMode: "xinput",
    },
    profiles: [...Array(numProfiles)].map((_, i) =>
      structuredClone(defaultProfile(i)),
    ),
    rgb: {
      enabled: true,
      brightness: 192,
      effect: HMK_RGBEffect.RAINBOW_WAVE,
      restoreEffect: HMK_RGBEffect.RAINBOW_WAVE,
      frame: new Uint8Array(DEMO_RGB_LED_COUNT * 3),
    },
  }

  async disconnect() {}
  async forget() {}

  async reboot() {}
  async bootloader() {}
  async factoryReset() {}
  async recalibrate() {}
  async analogInfo() {
    return Array(numKeys).fill({ adcValue: 0, distance: 0 })
  }
  async getCalibration() {
    return {
      initialRestValue: (1 << adcResolution) - 1,
      initialBottomOutThreshold: (1 << adcResolution) - 1,
    }
  }
  async setCalibration() {}
  async getProfile() {
    return 0
  }
  async getOptions() {
    return this.#state.options
  }
  async setOptions({ data }: SetOptionsParams) {
    const gamepadMode: HMK_GamepadMode =
      data.gamepadMode ?? (data.xInputEnabled ? "xinput" : "disabled")
    if (
      gamepadMode !== "disabled" &&
      !this.metadata.gamepadApis.includes(gamepadMode)
    ) {
      throw new Error(`Unsupported demo gamepad API: ${gamepadMode}.`)
    }
    this.#state.options = {
      ...data,
      xInputEnabled: gamepadMode === "xinput",
      saveBottomOutThreshold: false,
      gamepadMode,
    }
  }
  async resetProfile({ profile }: ResetProfileParams) {
    this.#state.profiles[profile] = structuredClone(defaultProfile(profile))
  }
  async duplicateProfile({ profile, srcProfile }: DuplicateProfileParams) {
    this.#state.profiles[profile] = structuredClone(
      this.#state.profiles[srcProfile],
    )
  }
  async saveCalibrationThreshold() {
    return
  }

  async getKeymap({ profile }: GetKeymapParams) {
    return this.#state.profiles[profile].keymap
  }
  async setKeymap({ profile, layer, offset, data }: SetKeymapParams) {
    for (let i = 0; i < data.length; i++) {
      this.#state.profiles[profile].keymap[layer][offset + i] = data[i]
    }
  }
  async getActuationMap({ profile }: GetActuationMapParams) {
    return this.#state.profiles[profile].actuationMap
  }
  async setActuationMap({ profile, offset, data }: SetActuationMapParams) {
    for (let i = 0; i < data.length; i++) {
      this.#state.profiles[profile].actuationMap[offset + i] = data[i]
    }
  }
  async getAdvancedKeys({ profile }: GetAdvancedKeysParams) {
    return this.#state.profiles[profile].advancedKeys
  }
  async setAdvancedKeys({ profile, offset, data }: SetAdvancedKeysParams) {
    for (let i = 0; i < data.length; i++) {
      this.#state.profiles[profile].advancedKeys[offset + i] = data[i]
    }
  }
  async getGamepadButtons(params: GetGamepadButtonsParams): Promise<number[]> {
    return this.#state.profiles[params.profile].gamepadButtons
  }
  async setGamepadButtons({ profile, offset, data }: SetGamepadButtonsParams) {
    for (let i = 0; i < data.length; i++) {
      this.#state.profiles[profile].gamepadButtons[offset + i] = data[i]
    }
  }
  async getGamepadOptions({ profile }: GetGamepadOptionsParams) {
    return this.#state.profiles[profile].gamepadOptions
  }
  async setGamepadOptions({ profile, data }: SetGamepadOptionsParams) {
    this.#state.profiles[profile].gamepadOptions = data
  }
  async getTickRate({ profile }: GetTickRateParams) {
    return this.#state.profiles[profile].tickRate
  }
  async setTickRate({ profile, data }: SetTickRateParams) {
    this.#state.profiles[profile].tickRate = data
  }
  async getMacros({ profile }: GetMacrosParams) {
    return this.#state.profiles[profile].macros
  }
  async setMacros({ profile, offset, data }: SetMacrosParams) {
    for (let i = 0; i < data.length; i++) {
      this.#state.profiles[profile].macros[offset + i] = data[i]
    }
  }

  async getRgbCapabilities() {
    return demoRgbCapabilities
  }
  async getRgbState({ capabilities }: GetRgbStateParams) {
    const { enabled, brightness, effect } = this.#state.rgb
    return { capabilities, enabled, brightness, effect }
  }
  async setRgbEnabled({ data }: SetRgbEnabledParams) {
    this.#state.rgb.enabled = data
  }
  async setRgbBrightness({ data }: SetRgbBrightnessParams) {
    this.#state.rgb.brightness = data
  }
  async setRgbEffect({ data }: SetRgbEffectParams) {
    if (data === HMK_RGBEffect.LIVE) {
      if (this.#state.rgb.effect !== HMK_RGBEffect.LIVE) {
        this.#state.rgb.restoreEffect = this.#state.rgb.effect
      }
    } else {
      this.#state.rgb.restoreEffect = data
    }
    this.#state.rgb.effect = data
  }
  async restoreRgbEffect() {
    this.#state.rgb.effect = this.#state.rgb.restoreEffect
    return this.#state.rgb.effect
  }
  async getRgbPixel({ index }: GetRgbPixelParams): Promise<HMK_RGBColor> {
    this.#assertRgbIndex(index)
    const offset = index * 3
    return [
      this.#state.rgb.frame[offset],
      this.#state.rgb.frame[offset + 1],
      this.#state.rgb.frame[offset + 2],
    ]
  }
  async setRgbPixel({ index, data }: SetRgbPixelParams) {
    this.#assertRgbIndex(index)
    this.#enterLiveMode()
    this.#state.rgb.frame.set(data, index * 3)
  }
  async fillRgb({ data }: FillRgbParams) {
    for (let index = 0; index < demoRgbCapabilities.ledCount; index++) {
      this.#state.rgb.frame.set(data, index * 3)
    }
  }
  async clearRgb() {
    this.#state.rgb.frame.fill(0)
  }
  async setRgbStaticColor(params: FillRgbParams) {
    await this.setRgbEffect({ data: HMK_RGBEffect.STATIC })
    await this.fillRgb(params)
  }
  async getRgbFrame() {
    return this.#state.rgb.frame.slice()
  }
  async writeRgbFrame({ data }: WriteRgbFrameParams) {
    if (data.length !== this.#state.rgb.frame.length) {
      throw new RangeError(
        `Demo RGB frame has ${data.length} bytes; expected ${this.#state.rgb.frame.length}.`,
      )
    }
    this.#enterLiveMode()
    this.#state.rgb.frame.set(Array.from(data))
  }

  #assertRgbIndex(index: number) {
    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index >= demoRgbCapabilities.ledCount
    ) {
      throw new RangeError(
        `LED index must be between 0 and ${demoRgbCapabilities.ledCount - 1}.`,
      )
    }
  }

  #enterLiveMode() {
    if (this.#state.rgb.effect !== HMK_RGBEffect.LIVE) {
      this.#state.rgb.restoreEffect = this.#state.rgb.effect
      this.#state.rgb.effect = HMK_RGBEffect.LIVE
    }
  }
}
