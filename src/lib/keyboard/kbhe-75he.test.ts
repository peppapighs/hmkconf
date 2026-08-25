import { createGradientFrame } from "$lib/configurator/lighting/frame-presets"
import { resolveRgbLedTopology } from "$lib/configurator/lighting/led-topology"
import { Keycode } from "$lib/libhmk/keycodes"
import { HMK_RGBEffect } from "$lib/libhmk/rgb"
import { describe, expect, test } from "bun:test"
import { DemoKeyboard } from "./demo-keyboard.svelte"
import { kbhe75heMetadata } from "./kbhe-75he"
import { demoMetadata } from "./metadata"

describe("KBHE 75HE metadata", () => {
  test("mirrors the libhmk keyboard.json identity and RGB section", () => {
    expect(kbhe75heMetadata.vendorId).toBe(0x9172)
    expect(kbhe75heMetadata.productId).toBe(0x0004)
    expect(kbhe75heMetadata.numKeys).toBe(82)
    expect(kbhe75heMetadata.gamepadApis).toEqual(["xinput", "hid"])
    expect(kbhe75heMetadata.rgb).toMatchObject({
      numLeds: 82,
      protocolMajor: 1,
      protocolMinor: 0,
    })
    expect(kbhe75heMetadata.rgb?.effects).toEqual([
      HMK_RGBEffect.STATIC,
      HMK_RGBEffect.BREATHING,
      HMK_RGBEffect.RAINBOW,
      HMK_RGBEffect.RAINBOW_WAVE,
      HMK_RGBEffect.LIVE,
    ])
  })

  test("matches the canonical navigation column on the default layer", () => {
    const defaultLayer = kbhe75heMetadata.defaultKeymaps[0][0]

    expect([28, 43, 57].map((index) => defaultLayer[index])).toEqual([
      Keycode.KC_HOME,
      Keycode.KC_PGUP,
      Keycode.KC_PGDN,
    ])
  })

  test("lays every key out without overlapping another", () => {
    const boxes: { x: number; y: number; w: number; h: number }[] = []
    let x = 0
    let y = 0
    for (const row of kbhe75heMetadata.layout.keymap) {
      for (const key of row) {
        x += key.x
        y += key.y
        boxes.push({ x, y, w: key.w, h: key.h })
        x += key.w
      }
      x = 0
      y += 1
    }

    expect(boxes).toHaveLength(82)
    for (const [index, a] of boxes.entries()) {
      for (const b of boxes.slice(index + 1)) {
        const overlaps =
          a.x < b.x + b.w &&
          b.x < a.x + a.w &&
          a.y < b.y + b.h &&
          b.y < a.y + a.h
        expect(overlaps).toBe(false)
      }
    }
    expect(Math.max(...boxes.map((box) => box.x + box.w))).toBe(16.25)
    expect(Math.max(...boxes.map((box) => box.y + box.h))).toBe(6.5)
  })

  test("keeps lighting off keyboards that declare no RGB section", () => {
    // The lighting tab is mounted from `metadata.rgb`, so a non-RGB board such
    // as the HE60 regression target must never advertise one.
    expect(demoMetadata.rgb).toBeNull()
  })

  test("runs the demo against the only RGB-capable target", () => {
    expect(new DemoKeyboard().metadata).toBe(kbhe75heMetadata)
  })

  test("sweeps host presets across the board, not along the chain", () => {
    // The WS2812 strip snakes back on every other row, so a preset indexed by
    // chain order paints a zig-zag. Feeding board positions fixes it.
    const topology = resolveRgbLedTopology(kbhe75heMetadata, 82)
    if (topology.kind !== "keyboard") throw new Error("Expected key mapping")

    const placements: { led: number; position: number }[] = []
    let x = 0
    for (const row of kbhe75heMetadata.layout.keymap) {
      for (const key of row) {
        x += key.x
        const led = topology.keyToLed[key.key]
        if (led !== null && led !== undefined) {
          placements.push({ led, position: x + key.w / 2 })
        }
        x += key.w
      }
      x = 0
    }

    const frame = createGradientFrame(82, [0, 0, 0], [255, 0, 0], placements)
    const byPosition = [...placements].sort((a, b) => a.position - b.position)
    const reds = byPosition.map(({ led }) => frame[led * 3])

    expect(reds[0]).toBe(0)
    expect(reds[reds.length - 1]).toBe(255)
    for (const [index, red] of reds.slice(1).entries()) {
      expect(red).toBeGreaterThanOrEqual(reds[index])
    }
  })
})
