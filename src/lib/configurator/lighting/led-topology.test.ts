import { DemoKeyboard } from "$lib/keyboard/demo-keyboard.svelte"
import { demoMetadata, type KeyboardMetadata } from "$lib/keyboard/metadata"
import { describe, expect, test } from "bun:test"
import {
  getRgbFramePixel,
  KBHE_75HE_KEY_TO_LED,
  paintRgbFramePixel,
  resolveRgbLedTopology,
  RgbFramePaintGesture,
} from "./led-topology"

function withRgb(overrides: Partial<KeyboardMetadata> = {}): KeyboardMetadata {
  return {
    ...demoMetadata,
    rgb: {
      numLeds: 3,
      protocolMajor: 1,
      protocolMinor: 0,
      effects: [0, 7],
    },
    ...overrides,
  }
}

describe("RGB LED topology", () => {
  test("uses an explicit metadata map before any device fallback", () => {
    const metadata = withRgb({
      numKeys: 3,
      rgb: {
        numLeds: 3,
        protocolMajor: 1,
        protocolMinor: 0,
        effects: [0],
        keyToLed: [2, null, 0],
      },
    })

    expect(resolveRgbLedTopology(metadata, 3)).toEqual({
      kind: "keyboard",
      source: "metadata",
      keyToLed: [2, null, 0],
    })
  })

  test("declares the KBHE logical-to-physical translation", () => {
    const metadata = withRgb({
      vendorId: 0x9172,
      productId: 0x0004,
      numKeys: 82,
      rgb: {
        numLeds: 82,
        protocolMajor: 1,
        protocolMinor: 0,
        effects: [0, 7],
      },
    })
    const topology = resolveRgbLedTopology(metadata, 82)

    expect(topology.kind).toBe("keyboard")
    expect(topology.source).toBe("kbhe-75he")
    expect(KBHE_75HE_KEY_TO_LED).toHaveLength(82)
    expect(KBHE_75HE_KEY_TO_LED[14]).toBe(28)
    expect(KBHE_75HE_KEY_TO_LED[44]).toBe(57)
    expect(KBHE_75HE_KEY_TO_LED[72]).toBe(81)
    expect(KBHE_75HE_KEY_TO_LED[81]).toBe(72)
    expect(new Set(KBHE_75HE_KEY_TO_LED).size).toBe(82)
  })

  test("takes the demo keyboard's advertised key-to-LED map", () => {
    const demo = new DemoKeyboard()
    const ledCount = demo.metadata.rgb!.numLeds
    const topology = resolveRgbLedTopology(demo.metadata, ledCount)

    // libhmk now undoes the serpentine wiring itself and states the map, so no
    // host has to recognise the board from its USB identity.
    expect(topology.kind).toBe("keyboard")
    if (topology.kind !== "keyboard") throw new Error("Expected key mapping")
    expect(topology.source).toBe("metadata")
    expect(topology.keyToLed).toEqual([...Array(ledCount).keys()])
  })

  test("falls back to safe firmware-index painting for unknown devices", () => {
    expect(resolveRgbLedTopology(withRgb(), 3)).toEqual({
      kind: "led-grid",
      source: "firmware-index",
      keyToLed: null,
    })
  })

  test("paints one LED in a cloned frame", () => {
    const frame = Uint8Array.from([0, 1, 2, 3, 4, 5])
    const painted = paintRgbFramePixel(frame, 1, [9, 8, 7])

    expect([...frame]).toEqual([0, 1, 2, 3, 4, 5])
    expect([...painted]).toEqual([0, 1, 2, 9, 8, 7])
    expect(getRgbFramePixel(painted, 1)).toEqual([9, 8, 7])
    expect(() => paintRgbFramePixel(frame, 2, [0, 0, 0])).toThrow()
  })

  test("coalesces a drag into exactly one final frame", () => {
    const gesture = new RgbFramePaintGesture()
    const frame = new Uint8Array(9)

    gesture.begin(frame)
    expect(gesture.paint(0, [1, 2, 3])).not.toBeNull()
    expect(gesture.paint(1, [4, 5, 6])).not.toBeNull()
    expect(gesture.paint(1, [4, 5, 6])).toBeNull()
    expect([...(gesture.end() ?? [])]).toEqual([1, 2, 3, 4, 5, 6, 0, 0, 0])
    expect(gesture.end()).toBeNull()
  })
})
