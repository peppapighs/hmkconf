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

import type { Keyboard } from "$lib/keyboard"
import {
  hasRgbCapability,
  HMK_RGBCapability,
  HMK_RGBEffect,
  type HMK_RGBCapabilities,
  type HMK_RGBMetadata,
  type HMK_RGBState,
} from "$lib/libhmk/rgb"
import {
  createGradientFrame,
  createRainbowFrame,
  hexToRgb,
  rgbToHex,
} from "./frame-presets"
import { paintRgbFramePixel, resolveRgbLedTopology } from "./led-topology"

export const RGB_EFFECT_NAMES: Record<number, string> = {
  [HMK_RGBEffect.STATIC]: "Static",
  [HMK_RGBEffect.BREATHING]: "Breathing",
  [HMK_RGBEffect.RAINBOW]: "Rainbow",
  [HMK_RGBEffect.RAINBOW_WAVE]: "Rainbow wave",
  [HMK_RGBEffect.LIVE]: "Live (PC-controlled)",
}

export const RGB_PALETTE = [
  "#ffffff",
  "#ef4444",
  "#f59e0b",
  "#22c55e",
  "#06b6d4",
  "#7c3aed",
] as const

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

export class LightingState {
  readonly keyboard: Keyboard
  readonly metadata: HMK_RGBMetadata
  readonly fallbackFrame: Uint8Array

  capabilities = $state<HMK_RGBCapabilities | null>(null)
  rgbState = $state<HMK_RGBState | null>(null)
  rgbFrame = $state<Uint8Array | null>(null)
  loading = $state(true)
  negotiated = $state(false)
  pending = $state(false)
  localError = $state<string | null>(null)
  frameError = $state<string | null>(null)
  fillColor = $state("#7c3aed")
  gradientEndColor = $state("#06b6d4")
  ledIndex = $state(0)
  ledColor = $state("#ffffff")

  constructor(keyboard: Keyboard) {
    if (!keyboard.metadata.rgb) {
      throw new Error(
        "Lighting was mounted for a keyboard without RGB metadata.",
      )
    }
    this.keyboard = keyboard
    this.metadata = keyboard.metadata.rgb
    this.fallbackFrame = new Uint8Array(this.metadata.numLeds * 3)
  }

  get currentEffectName() {
    return this.rgbState
      ? (RGB_EFFECT_NAMES[this.rgbState.effect] ??
          `Effect ${this.rgbState.effect}`)
      : "Loading…"
  }

  get topology() {
    return resolveRgbLedTopology(
      this.keyboard.metadata,
      this.capabilities?.ledCount ?? this.metadata.numLeds,
    )
  }

  get displayFrame() {
    return this.rgbFrame ?? this.fallbackFrame
  }

  get canLiveWrite() {
    const capabilities = this.capabilities
    const state = this.rgbState
    return Boolean(
      capabilities &&
      state &&
      this.supports(HMK_RGBCapability.FRAME_CHUNKS) &&
      this.supports(HMK_RGBCapability.LIVE_MODE) &&
      (state.effect === capabilities.liveEffectId ||
        this.supports(HMK_RGBCapability.RESTORE_MODE)),
    )
  }

  get canPixelWrite() {
    const capabilities = this.capabilities
    const state = this.rgbState
    return Boolean(
      capabilities &&
      state &&
      this.supports(HMK_RGBCapability.PIXEL) &&
      this.supports(HMK_RGBCapability.LIVE_MODE) &&
      (state.effect === capabilities.liveEffectId ||
        this.supports(HMK_RGBCapability.RESTORE_MODE)),
    )
  }

  get canStaticWrite() {
    const capabilities = this.capabilities
    const state = this.rgbState
    return Boolean(
      capabilities &&
      state &&
      this.supports(HMK_RGBCapability.FILL) &&
      this.metadata.effects.includes(HMK_RGBEffect.STATIC) &&
      (state.effect !== capabilities.liveEffectId ||
        this.supports(HMK_RGBCapability.RESTORE_MODE)),
    )
  }

  get painterDisabled() {
    return (
      this.pending ||
      !this.canLiveWrite ||
      this.rgbState?.enabled === false ||
      this.frameError !== null
    )
  }

  get topologyLabel() {
    switch (this.topology.source) {
      case "metadata":
        return "Device key-to-LED map"
      case "kbhe-75he":
        return "KBHE declared logical-to-physical map"
      default:
        return "Firmware LED indices (no key map advertised)"
    }
  }

  supports(capability: HMK_RGBCapability) {
    return this.capabilities
      ? hasRgbCapability(this.capabilities, capability)
      : false
  }

  async refreshFrame(current: HMK_RGBCapabilities) {
    if (!hasRgbCapability(current, HMK_RGBCapability.FRAME_CHUNKS)) {
      this.rgbFrame = null
      this.frameError = null
      return
    }
    this.frameError = null
    try {
      this.rgbFrame = await this.keyboard.getRgbFrame({
        capabilities: current,
      })
    } catch (error) {
      this.rgbFrame = null
      this.frameError = errorMessage(error)
    }
  }

  async retryFrame() {
    if (!this.capabilities || this.pending) return
    this.pending = true
    try {
      await this.refreshFrame(this.capabilities)
    } finally {
      this.pending = false
    }
  }

  async negotiate() {
    if (this.pending) return
    this.loading = true
    this.pending = true
    this.localError = null
    this.frameError = null
    try {
      const capabilities = await this.keyboard.getRgbCapabilities()
      if (
        capabilities.protocolMajor !== this.metadata.protocolMajor ||
        capabilities.protocolMinor < this.metadata.protocolMinor
      ) {
        throw new Error(
          `RGB metadata requires protocol ${this.metadata.protocolMajor}.${this.metadata.protocolMinor}, but the device negotiated ${capabilities.protocolMajor}.${capabilities.protocolMinor}.`,
        )
      }
      if (capabilities.ledCount !== this.metadata.numLeds) {
        throw new Error(
          `RGB metadata advertises ${this.metadata.numLeds} LEDs, but the device negotiated ${capabilities.ledCount}.`,
        )
      }
      this.capabilities = capabilities
      this.rgbState = await this.keyboard.getRgbState({ capabilities })
      await this.refreshFrame(capabilities)
    } catch (error) {
      this.capabilities = null
      this.rgbState = null
      this.rgbFrame = null
      this.localError = errorMessage(error)
    } finally {
      this.pending = false
      this.loading = false
    }
  }

  async #perform(
    label: string,
    action: (current: HMK_RGBCapabilities) => Promise<void>,
    refresh = true,
  ) {
    if (!this.capabilities || this.pending) return false
    this.pending = true
    this.localError = null
    try {
      await action(this.capabilities)
      if (refresh) {
        this.rgbState = await this.keyboard.getRgbState({
          capabilities: this.capabilities,
        })
      }
      return true
    } catch (error) {
      this.localError = `${label}: ${errorMessage(error)}`
      return false
    } finally {
      this.pending = false
    }
  }

  setEnabled(enabled: boolean) {
    void this.#perform("Enable control failed", (capabilities) =>
      this.keyboard.setRgbEnabled({ capabilities, data: enabled }),
    )
  }

  setBrightness(brightness: number) {
    void this.#perform("Brightness update failed", (capabilities) =>
      this.keyboard.setRgbBrightness({ capabilities, data: brightness }),
    )
  }

  setEffect(value: string) {
    const effect = Number(value)
    if (!Number.isInteger(effect) || !this.metadata.effects.includes(effect)) {
      this.localError = `Effect ${value} is not advertised by this keyboard.`
      return
    }
    if (
      effect === HMK_RGBEffect.LIVE &&
      !this.supports(HMK_RGBCapability.LIVE_MODE)
    ) {
      this.localError =
        "This keyboard does not advertise PC-controlled live mode."
      return
    }
    void this.#perform("Effect update failed", async (capabilities) => {
      await this.keyboard.setRgbEffect({ data: effect })
      await this.refreshFrame(capabilities)
    })
  }

  applyStaticFill() {
    const color = hexToRgb(this.fillColor)
    void this.#perform("Static fill failed", async (capabilities) => {
      await this.keyboard.setRgbStaticColor({ capabilities, data: color })
      this.rgbFrame = createGradientFrame(capabilities.ledCount, color, color)
      this.frameError = null
    })
  }

  clearFrame() {
    void this.#perform("Clear failed", async (capabilities) => {
      // A bare LED_CLEAR leaves autonomous effects running. Use the same
      // rollback-safe STATIC transition as a normal solid fill.
      await this.keyboard.setRgbStaticColor({
        capabilities,
        data: [0, 0, 0],
      })
      this.rgbFrame = new Uint8Array(
        capabilities.ledCount * capabilities.bytesPerPixel,
      )
      this.frameError = null
    })
  }

  restoreEffect() {
    void this.#perform("Effect restore failed", async (capabilities) => {
      await this.keyboard.restoreRgbEffect()
      await this.refreshFrame(capabilities)
    })
  }

  readPixel() {
    void this.#perform(
      "LED read failed",
      async (capabilities) => {
        this.ledColor = rgbToHex(
          await this.keyboard.getRgbPixel({
            capabilities,
            index: this.ledIndex,
          }),
        )
      },
      false,
    )
  }

  writePixel() {
    const color = hexToRgb(this.ledColor)
    void this.#perform("LED update failed", async (capabilities) => {
      await this.keyboard.setRgbPixel({
        capabilities,
        index: this.ledIndex,
        data: color,
      })
      // PIXEL is independently negotiable from FRAME_CHUNKS. Keep a local
      // preview instead of issuing an unsupported full-frame read.
      this.rgbFrame = paintRgbFramePixel(
        this.displayFrame,
        this.ledIndex,
        color,
      )
      this.frameError = null
    })
  }

  previewFrame(frame: Uint8Array) {
    this.rgbFrame = frame
  }

  async commitFrame(label: string, frame: Uint8Array) {
    const succeeded = await this.#perform(label, async (capabilities) => {
      await this.keyboard.writeRgbFrame({ capabilities, data: frame })
      this.rgbFrame = frame.slice()
      this.frameError = null
    })
    if (!succeeded && this.capabilities) {
      this.pending = true
      try {
        await this.refreshFrame(this.capabilities)
      } finally {
        this.pending = false
      }
    }
  }

  sendGradient() {
    if (!this.capabilities) return
    void this.commitFrame(
      "Gradient frame failed",
      createGradientFrame(
        this.capabilities.ledCount,
        hexToRgb(this.fillColor),
        hexToRgb(this.gradientEndColor),
      ),
    )
  }

  sendRainbow() {
    if (!this.capabilities) return
    void this.commitFrame(
      "Rainbow frame failed",
      createRainbowFrame(this.capabilities.ledCount),
    )
  }
}
