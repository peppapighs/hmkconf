import { describe, expect, test } from "bun:test"
import { HMK_Command } from "."
import {
  HMK_RGBCapability,
  HMK_RGBEffect,
  type HMK_RGBCapabilities,
} from "../rgb"
import {
  getRgbCapabilities,
  getRgbFrame,
  HMK_RGBCommandError,
  HMK_RGBProtocolError,
  setRgbBrightness,
  setRgbStaticColor,
  writeRgbFrame,
} from "./rgb"

type Request = {
  command: HMK_Command
  payload?: number[]
  timeout?: number
}

const capabilities: HMK_RGBCapabilities = {
  protocolMajor: 1,
  protocolMinor: 0,
  ledCount: 82,
  bytesPerPixel: 3,
  chunkBytes: 60,
  liveEffectId: HMK_RGBEffect.LIVE,
  capabilities: 0x7f,
  colorOrder: 0,
}

class FakeRgbCommander {
  requests: Request[] = []
  enabled = true
  brightness = 128
  effect: number = HMK_RGBEffect.RAINBOW
  previousEffect: number = HMK_RGBEffect.STATIC
  frame = Uint8Array.from({ length: 82 * 3 }, (_, index) => index & 0xff)
  failCommand: HMK_Command | null = null
  failChunk: number | null = null
  corruptEchoCommand: HMK_Command | null = null
  capabilityOverrides: Partial<HMK_RGBCapabilities> = {}

  async sendCommand(options: Request) {
    this.requests.push(options)
    const payload = options.payload ?? []
    if (
      payload[0] !== 0 &&
      options.command >= 0x60 &&
      options.command <= 0x7f
    ) {
      throw new Error("RGB request did not reserve byte 1")
    }
    const data = payload.slice(1)
    const response = new Uint8Array(63)
    if (
      options.command === this.failCommand ||
      (options.command === HMK_Command.SET_LED_ALL_CHUNK &&
        data[0] === this.failChunk)
    ) {
      response[0] = 3
      return new DataView(response.buffer)
    }

    switch (options.command) {
      case HMK_Command.GET_RGB_CAPABILITIES: {
        const caps = { ...capabilities, ...this.capabilityOverrides }
        response.set(
          [
            caps.protocolMajor,
            caps.protocolMinor,
            caps.ledCount,
            caps.bytesPerPixel,
            caps.chunkBytes,
            caps.liveEffectId,
            caps.capabilities & 0xff,
            caps.capabilities >> 8,
            caps.colorOrder,
          ],
          1,
        )
        break
      }
      case HMK_Command.GET_LED_ENABLED:
        response[1] = this.enabled ? 1 : 0
        break
      case HMK_Command.SET_LED_ENABLED:
        this.enabled = data[0] !== 0
        response[1] = this.enabled ? 1 : 0
        break
      case HMK_Command.GET_LED_BRIGHTNESS:
        response[1] = this.brightness
        break
      case HMK_Command.SET_LED_BRIGHTNESS:
        this.brightness = data[0] ?? 0
        response[1] = this.brightness
        break
      case HMK_Command.GET_LED_EFFECT:
        response[1] = this.effect
        break
      case HMK_Command.SET_LED_EFFECT: {
        const effect = data[0] ?? 0
        if (effect !== this.effect) this.previousEffect = this.effect
        this.effect = effect
        response[1] = effect
        break
      }
      case HMK_Command.RESTORE_LED_EFFECT:
        ;[this.effect, this.previousEffect] = [this.previousEffect, this.effect]
        response[1] = this.effect
        break
      case HMK_Command.GET_LED_PIXEL: {
        const index = data[0] ?? 0
        response[1] = index
        response.set(this.frame.slice(index * 3, index * 3 + 3), 2)
        break
      }
      case HMK_Command.SET_LED_PIXEL: {
        const index = data[0] ?? 0
        this.frame.set(data.slice(1, 4), index * 3)
        response.set(data.slice(0, 4), 1)
        break
      }
      case HMK_Command.GET_LED_ALL: {
        const chunk = data[0] ?? 0
        const bytes = this.frame.slice(chunk * 60, (chunk + 1) * 60)
        response[1] = chunk
        response[2] = bytes.length
        response.set(bytes, 3)
        break
      }
      case HMK_Command.SET_LED_ALL_CHUNK:
        response[1] = data[0] ?? 0
        response[2] = data[1] ?? 0
        break
      case HMK_Command.LED_FILL:
        this.frame = Uint8Array.from(
          { length: this.frame.length },
          (_, index) => data[index % 3] ?? 0,
        )
        response.set(data.slice(0, 3), 1)
        break
      case HMK_Command.LED_CLEAR:
        this.frame.fill(0)
        break
      default:
        throw new Error(`Unexpected command ${options.command}`)
    }

    if (options.command === this.corruptEchoCommand) response[1] ^= 1
    return new DataView(response.buffer)
  }
}

describe("libhmk RGB bridge commands", () => {
  test("negotiates capabilities through the reserved status byte", async () => {
    const commander = new FakeRgbCommander()

    await expect(getRgbCapabilities(commander as never)).resolves.toEqual(
      capabilities,
    )
    expect(commander.requests[0]).toEqual({
      command: HMK_Command.GET_RGB_CAPABILITIES,
      payload: [0],
    })
  })

  test("rejects incompatible geometry, device status, and stale echoes", async () => {
    const commander = new FakeRgbCommander()
    commander.capabilityOverrides = { bytesPerPixel: 4 }
    await expect(getRgbCapabilities(commander as never)).rejects.toBeInstanceOf(
      HMK_RGBProtocolError,
    )

    commander.capabilityOverrides = { liveEffectId: 6 }
    await expect(getRgbCapabilities(commander as never)).rejects.toBeInstanceOf(
      HMK_RGBProtocolError,
    )

    commander.capabilityOverrides = {}
    commander.failCommand = HMK_Command.SET_LED_BRIGHTNESS
    await expect(
      setRgbBrightness(commander as never, capabilities, 96),
    ).rejects.toBeInstanceOf(HMK_RGBCommandError)

    commander.failCommand = null
    commander.corruptEchoCommand = HMK_Command.SET_LED_BRIGHTNESS
    await expect(
      setRgbBrightness(commander as never, capabilities, 96),
    ).rejects.toThrow("stale or mismatched")
  })

  test("reads a complete frame with canonical chunk lengths", async () => {
    const commander = new FakeRgbCommander()
    const frame = await getRgbFrame(commander as never, capabilities)

    expect(frame).toEqual(commander.frame)
    expect(
      commander.requests
        .filter((request) => request.command === HMK_Command.GET_LED_ALL)
        .map((request) => request.payload),
    ).toEqual([
      [0, 0],
      [0, 1],
      [0, 2],
      [0, 3],
      [0, 4],
    ])
  })

  test("enters live mode and writes an 82-LED frame in five chunks", async () => {
    const commander = new FakeRgbCommander()
    const frame = Uint8Array.from(
      { length: capabilities.ledCount * 3 },
      (_, index) => (index * 7) & 0xff,
    )

    await writeRgbFrame(commander as never, capabilities, frame)

    expect(commander.effect).toBe(HMK_RGBEffect.LIVE)
    const chunks = commander.requests.filter(
      (request) => request.command === HMK_Command.SET_LED_ALL_CHUNK,
    )
    expect(chunks).toHaveLength(5)
    expect(chunks.map((request) => request.payload?.[1])).toEqual([
      0, 1, 2, 3, 4,
    ])
    expect(chunks.map((request) => request.payload?.[2])).toEqual([
      60, 60, 60, 60, 6,
    ])
  })

  test("restores the previous effect when a transitioned frame upload fails", async () => {
    const commander = new FakeRgbCommander()
    commander.effect = HMK_RGBEffect.RAINBOW
    commander.failChunk = 2

    await expect(
      writeRgbFrame(
        commander as never,
        capabilities,
        new Uint8Array(capabilities.ledCount * 3),
      ),
    ).rejects.toBeInstanceOf(HMK_RGBCommandError)
    expect(commander.effect).toBe(HMK_RGBEffect.RAINBOW)
    expect(
      commander.requests.some(
        (request) => request.command === HMK_Command.RESTORE_LED_EFFECT,
      ),
    ).toBe(true)
  })

  test("does not leave live mode after a failed upload that was already live", async () => {
    const commander = new FakeRgbCommander()
    commander.effect = HMK_RGBEffect.LIVE
    commander.failChunk = 1

    await expect(
      writeRgbFrame(
        commander as never,
        capabilities,
        new Uint8Array(capabilities.ledCount * 3),
      ),
    ).rejects.toBeInstanceOf(HMK_RGBCommandError)
    expect(commander.effect).toBe(HMK_RGBEffect.LIVE)
    expect(
      commander.requests.some(
        (request) => request.command === HMK_Command.RESTORE_LED_EFFECT,
      ),
    ).toBe(false)
  })

  test("composes persistent static color and rolls the effect back on failure", async () => {
    const commander = new FakeRgbCommander()
    commander.effect = HMK_RGBEffect.RAINBOW_WAVE
    commander.failCommand = HMK_Command.LED_FILL

    await expect(
      setRgbStaticColor(commander as never, capabilities, [10, 20, 30]),
    ).rejects.toBeInstanceOf(HMK_RGBCommandError)
    expect(commander.effect).toBe(HMK_RGBEffect.RAINBOW_WAVE)
  })

  test("gates commands using the negotiated capability bitmap", async () => {
    const commander = new FakeRgbCommander()
    const noBrightness = {
      ...capabilities,
      capabilities: capabilities.capabilities & ~HMK_RGBCapability.BRIGHTNESS,
    }

    await expect(
      setRgbBrightness(commander as never, noBrightness, 96),
    ).rejects.toThrow("does not advertise")
    expect(commander.requests).toHaveLength(0)
  })
})
