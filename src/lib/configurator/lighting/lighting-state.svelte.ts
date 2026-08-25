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
  type HMK_RGBColor,
  type HMK_RGBMetadata,
  type HMK_RGBState,
} from "$lib/libhmk/rgb"
import { renderHmkRgbEffectFrame } from "$lib/libhmk/rgb-effects"
import { toast } from "svelte-sonner"
import {
  createGradientFrame,
  createRainbowFrame,
  hexToRgb,
  rgbToHex,
  type LedPlacement,
} from "./frame-presets"
import { resolveRgbLedTopology } from "./led-topology"

export type RgbEffectInfo = {
  name: string
  description: string
  /** Driven by the base color that `LED_FILL` persists. */
  colored: boolean
  /** Phase advances every 20 ms in `rgb_task()`. */
  animated: boolean
}

export const RGB_EFFECTS: Record<number, RgbEffectInfo> = {
  [HMK_RGBEffect.STATIC]: {
    name: "Static",
    description: "One solid color across the whole board.",
    colored: true,
    animated: false,
  },
  [HMK_RGBEffect.BREATHING]: {
    name: "Breathing",
    description: "Fades your color in and out.",
    colored: true,
    animated: true,
  },
  [HMK_RGBEffect.RAINBOW]: {
    name: "Rainbow",
    description: "Cycles the whole board through the spectrum.",
    colored: false,
    animated: true,
  },
  [HMK_RGBEffect.RAINBOW_WAVE]: {
    name: "Rainbow Wave",
    description: "Sweeps the spectrum across the board.",
    colored: false,
    animated: true,
  },
  [HMK_RGBEffect.LIVE]: {
    name: "Per-Key",
    description: "Paint each key yourself from this app.",
    colored: false,
    animated: false,
  },
}

export function rgbEffectInfo(effect: number): RgbEffectInfo {
  return (
    RGB_EFFECTS[effect] ?? {
      name: `Effect ${effect}`,
      description: "A private effect outside libhmk's portable set.",
      colored: false,
      animated: true,
    }
  )
}

export const RGB_PALETTE = [
  "#ffffff",
  "#ef4444",
  "#f59e0b",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#7c3aed",
  "#ec4899",
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
  /** Last frame read from the device. Only authoritative in live mode. */
  rgbFrame = $state<Uint8Array | null>(null)
  loading = $state(true)
  negotiated = $state(false)
  pending = $state(false)
  localError = $state<string | null>(null)
  frameError = $state<string | null>(null)

  /**
   * Base color of the autonomous effects. Bridge v1 has no counterpart to
   * `LED_FILL`, so it is seeded from a uniform static frame and otherwise
   * mirrors what this session last sent.
   */
  baseColor = $state("#ffffff")
  paintColor = $state("#7c3aed")
  gradientEndColor = $state("#06b6d4")
  /** Effect phase driven by the tab so previews match `rgb_task()` timing. */
  previewPhase = $state(0)
  /**
   * Where each LED sits on the rendered board, set by the tab. It stands in for
   * the firmware's `RGB_LED_POS_X`: host presets sweep across the board rather
   * than along the WS2812 chain, and the preview places the rainbow wave the
   * same way the keyboard does.
   */
  ledPlacements = $state<readonly LedPlacement[]>([])

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

  get ledCount() {
    return this.capabilities?.ledCount ?? this.metadata.numLeds
  }

  get effect() {
    return this.rgbState?.effect ?? HMK_RGBEffect.STATIC
  }

  get effectInfo() {
    return rgbEffectInfo(this.effect)
  }

  get isLive() {
    return (
      this.capabilities !== null &&
      this.rgbState !== null &&
      this.rgbState.effect === this.capabilities.liveEffectId
    )
  }

  get lightingOff() {
    return this.rgbState?.enabled === false
  }

  get topology() {
    return resolveRgbLedTopology(this.keyboard.metadata, this.ledCount)
  }

  /**
   * What the keyboard is showing. Autonomous effects are rendered locally with
   * the firmware's own math: the bridge cannot stream an animation, and reading
   * a frame per repaint would saturate the HID pipe.
   */
  get displayFrame(): Uint8Array {
    if (this.isLive) return this.rgbFrame ?? this.fallbackFrame
    // Reading the phase only for animated effects keeps the 82 keys off the
    // clock while the gallery tiles keep animating.
    const phase = this.effectInfo.animated ? this.previewPhase : 0
    return (
      this.effectFrame(this.effect, phase, this.ledCount) ??
      this.rgbFrame ??
      this.fallbackFrame
    )
  }

  /**
   * Phase offset per LED for travelling effects, 0-255 across the board's
   * width, mirroring what the generator bakes into `RGB_LED_POS_X`.
   */
  get waveOffsets(): Uint8Array | undefined {
    const placements = this.ledPlacements
    if (placements.length !== this.ledCount) return undefined
    const positions = placements.map(({ position }) => position)
    const low = Math.min(...positions)
    const span = Math.max(...positions) - low
    const offsets = new Uint8Array(this.ledCount)
    for (const { led, position } of placements) {
      offsets[led] =
        span === 0 ? 0 : Math.round(((position - low) * 255) / span)
    }
    return offsets
  }

  /** Render any advertised effect, for the keyboard and the effect gallery. */
  effectFrame(effect: number, phase: number, ledCount: number) {
    return renderHmkRgbEffectFrame(
      effect,
      phase,
      ledCount,
      hexToRgb(this.baseColor),
      ledCount === this.ledCount ? this.waveOffsets : undefined,
    )
  }

  get canFill() {
    return this.supports(HMK_RGBCapability.FILL)
  }

  get canSelectLive() {
    return (
      this.supports(HMK_RGBCapability.LIVE_MODE) &&
      this.metadata.effects.includes(HMK_RGBEffect.LIVE)
    )
  }

  get canPaint() {
    return Boolean(
      this.isLive &&
      this.supports(HMK_RGBCapability.FRAME_CHUNKS) &&
      !this.lightingOff &&
      this.frameError === null,
    )
  }

  get painterDisabled() {
    return this.pending || !this.canPaint
  }

  /** Plain-language reason the keyboard above is not editable right now. */
  get painterHint() {
    if (!this.capabilities || !this.rgbState || this.frameError) return null
    if (this.lightingOff) return "Turn lighting on to edit it here."
    if (this.isLive && !this.supports(HMK_RGBCapability.FRAME_CHUNKS)) {
      return "This keyboard does not support painting individual keys."
    }
    return null
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
      this.rgbFrame = await this.keyboard.getRgbFrame({ capabilities: current })
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

  /**
   * A static frame is the base color on every LED, which is the only way the
   * v1 bridge exposes it: there is no GET_COLOR counterpart to `LED_FILL`.
   */
  #adoptBaseColorFromFrame() {
    const frame = this.rgbFrame
    if (!frame || this.rgbState?.effect !== HMK_RGBEffect.STATIC) return
    const first: HMK_RGBColor = [frame[0], frame[1], frame[2]]
    for (let index = 3; index < frame.length; index++) {
      if (frame[index] !== first[index % 3]) return
    }
    this.baseColor = rgbToHex(first)
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
          `This keyboard speaks RGB protocol ${capabilities.protocolMajor}.${capabilities.protocolMinor}, but its firmware metadata requires ${this.metadata.protocolMajor}.${this.metadata.protocolMinor}.`,
        )
      }
      if (capabilities.ledCount !== this.metadata.numLeds) {
        throw new Error(
          `This keyboard reports ${capabilities.ledCount} LEDs, but its firmware metadata declares ${this.metadata.numLeds}.`,
        )
      }
      this.capabilities = capabilities
      this.rgbState = await this.keyboard.getRgbState({ capabilities })
      await this.refreshFrame(capabilities)
      this.#adoptBaseColorFromFrame()
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
    try {
      await action(this.capabilities)
      if (refresh) {
        this.rgbState = await this.keyboard.getRgbState({
          capabilities: this.capabilities,
        })
      }
      return true
    } catch (error) {
      // Once the bridge is negotiated, failures are transient device errors.
      // Report them through the app-wide toaster instead of growing a
      // permanent error region inside the panel.
      toast.error(`${label}: ${errorMessage(error)}`)
      return false
    } finally {
      this.pending = false
    }
  }

  setEnabled(enabled: boolean) {
    void this.#perform("Could not switch the lighting", (capabilities) =>
      this.keyboard.setRgbEnabled({ capabilities, data: enabled }),
    )
  }

  setBrightness(brightness: number) {
    void this.#perform("Could not set the brightness", (capabilities) =>
      this.keyboard.setRgbBrightness({ capabilities, data: brightness }),
    )
  }

  setEffect(effect: number) {
    if (!Number.isInteger(effect) || !this.metadata.effects.includes(effect)) {
      toast.error("This keyboard does not advertise that effect.")
      return
    }
    if (effect === HMK_RGBEffect.LIVE && !this.canSelectLive) {
      toast.error("This keyboard does not advertise PC-controlled live mode.")
      return
    }
    void this.#perform("Could not change the effect", async (capabilities) => {
      await this.keyboard.setRgbEffect({ data: effect })
      await this.refreshFrame(capabilities)
    })
  }

  /**
   * `LED_FILL` outside live mode rewrites the effect's persistent base color,
   * which is how Static and Breathing are recolored.
   */
  setBaseColor(color: string) {
    const rgb = hexToRgb(color)
    void this.#perform("Could not save the color", async (capabilities) => {
      await this.keyboard.fillRgb({ capabilities, data: rgb })
      this.baseColor = color
    })
  }

  /** Live-mode fill: one report instead of a full chunked frame upload. */
  fillLiveFrame(color: string) {
    if (!this.isLive) return
    const rgb = hexToRgb(color)
    void this.#perform("Could not fill the keys", async (capabilities) => {
      await this.keyboard.fillRgb({ capabilities, data: rgb })
      const frame = new Uint8Array(this.ledCount * 3)
      for (let index = 0; index < this.ledCount; index++) {
        frame.set(rgb, index * 3)
      }
      this.rgbFrame = frame
      this.frameError = null
    })
  }

  clearLiveFrame() {
    this.fillLiveFrame("#000000")
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

  /**
   * Host presets sweep across the board, not along the WS2812 chain: the KBHE
   * strip is wired in a serpentine, so a chain-ordered ramp paints a snake.
   */
  sendGradient() {
    if (!this.capabilities) return
    void this.commitFrame(
      "Could not send the gradient",
      createGradientFrame(
        this.ledCount,
        hexToRgb(this.paintColor),
        hexToRgb(this.gradientEndColor),
        this.ledPlacements,
      ),
    )
  }

  sendRainbow() {
    if (!this.capabilities) return
    void this.commitFrame(
      "Could not send the rainbow",
      createRainbowFrame(this.ledCount, this.ledPlacements),
    )
  }
}
