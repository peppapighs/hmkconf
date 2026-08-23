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
import {
  hmkRgbEffectPhase,
  renderHmkRgbEffectFrame,
} from "$lib/libhmk/rgb-effects"
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
import { kbhe75heMetadata } from "./kbhe-75he"

/*
 * The demo mirrors the KBHE 75HE libhmk image, which is the only target in
 * `keyboards/` that declares an `rgb` section. Its capability bitmap is the
 * full portable set advertised by `src/commands.c`.
 */
const DEMO_RGB_LED_COUNT = kbhe75heMetadata.rgb!.numLeds
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

// `DEFAULT_RGB` in the firmware's `eeconfig.h`, with the KBHE build flags from
// `keyboard.json`: enabled, brightness 50/255, static, white base color.
const DEMO_RGB_DEFAULT_BRIGHTNESS = 50
const DEMO_RGB_DEFAULT_COLOR: HMK_RGBColor = [255, 255, 255]

const demoKeyboardMetadata = kbhe75heMetadata

const {
  adcResolution,
  numProfiles,
  numKeys,
  numAdvancedKeys,
  numMacroNodes,
  defaultKeymaps,
} = kbhe75heMetadata

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
    baseColor: HMK_RGBColor
    liveFrame: Uint8Array
    effectStartedAt: number
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
      brightness: DEMO_RGB_DEFAULT_BRIGHTNESS,
      effect: HMK_RGBEffect.STATIC,
      restoreEffect: HMK_RGBEffect.STATIC,
      baseColor: DEMO_RGB_DEFAULT_COLOR,
      liveFrame: new Uint8Array(DEMO_RGB_LED_COUNT * 3),
      effectStartedAt: 0,
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
        // Entering live mode seeds the staging buffer with whatever the last
        // autonomous frame showed, exactly like `rgb_set_effect()`.
        this.#state.rgb.liveFrame = this.#renderFrame()
      }
    } else {
      this.#state.rgb.restoreEffect = data
      this.#state.rgb.effectStartedAt = performance.now()
    }
    this.#state.rgb.effect = data
  }
  async restoreRgbEffect() {
    await this.setRgbEffect({ data: this.#state.rgb.restoreEffect })
    return this.#state.rgb.effect
  }
  async getRgbPixel({ index }: GetRgbPixelParams): Promise<HMK_RGBColor> {
    this.#assertRgbIndex(index)
    const frame = this.#renderFrame()
    const offset = index * 3
    return [frame[offset], frame[offset + 1], frame[offset + 2]]
  }
  async setRgbPixel({ index, data }: SetRgbPixelParams) {
    this.#assertRgbIndex(index)
    this.#enterLiveMode()
    this.#state.rgb.liveFrame.set(data, index * 3)
  }
  async fillRgb({ data }: FillRgbParams) {
    // `rgb_fill()`: a fill in an autonomous mode rewrites the persistent base
    // color, while a fill in live mode is a runtime frame operation.
    if (this.#state.rgb.effect === HMK_RGBEffect.LIVE) {
      for (let index = 0; index < DEMO_RGB_LED_COUNT; index++) {
        this.#state.rgb.liveFrame.set(data, index * 3)
      }
    } else {
      this.#state.rgb.baseColor = data
    }
  }
  async clearRgb(params: GetRgbStateParams) {
    await this.fillRgb({ ...params, data: [0, 0, 0] })
  }
  async setRgbStaticColor(params: FillRgbParams) {
    await this.setRgbEffect({ data: HMK_RGBEffect.STATIC })
    await this.fillRgb(params)
  }
  async getRgbFrame() {
    return this.#renderFrame()
  }
  async writeRgbFrame({ data }: WriteRgbFrameParams) {
    if (data.length !== DEMO_RGB_LED_COUNT * 3) {
      throw new RangeError(
        `Demo RGB frame has ${data.length} bytes; expected ${DEMO_RGB_LED_COUNT * 3}.`,
      )
    }
    this.#enterLiveMode()
    this.#state.rgb.liveFrame.set(Array.from(data))
  }

  /** Displayed frame: the host stream in live mode, the effect otherwise. */
  #renderFrame() {
    const { effect, baseColor, liveFrame, effectStartedAt } = this.#state.rgb
    if (effect === HMK_RGBEffect.LIVE) return liveFrame.slice()
    return (
      renderHmkRgbEffectFrame(
        effect,
        hmkRgbEffectPhase(performance.now() - effectStartedAt),
        DEMO_RGB_LED_COUNT,
        baseColor,
      ) ?? liveFrame.slice()
    )
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
      this.#state.rgb.liveFrame = this.#renderFrame()
      this.#state.rgb.effect = HMK_RGBEffect.LIVE
    }
  }
}
