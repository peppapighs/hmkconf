import { describe, expect, test } from "bun:test"
import {
  createGradientFrame,
  createRainbowFrame,
  hexToRgb,
  rgbToHex,
} from "./frame-presets"

describe("RGB frame presets", () => {
  test("creates a gradient with exact endpoints", () => {
    expect([...createGradientFrame(3, [0, 10, 20], [100, 110, 120])]).toEqual([
      0, 10, 20, 50, 60, 70, 100, 110, 120,
    ])
  })

  test("creates one RGB triplet per rainbow LED", () => {
    const frame = createRainbowFrame(6)
    expect(frame).toHaveLength(18)
    expect([...frame.slice(0, 3)]).toEqual([255, 0, 0])
    expect([...frame.slice(9, 12)]).toEqual([0, 255, 255])
  })

  test("round-trips HTML colors", () => {
    expect(hexToRgb("#12aBf0")).toEqual([0x12, 0xab, 0xf0])
    expect(rgbToHex([0x12, 0xab, 0xf0])).toBe("#12abf0")
  })

  test("rejects colors outside the #RRGGBB format", () => {
    expect(() => hexToRgb("rgb(1,2,3)")).toThrow(RangeError)
  })

  test("follows board positions instead of the serpentine chain order", () => {
    // Two rows wired right-to-left on the way back: LED 2 sits leftmost on the
    // second row, so a left-to-right gradient must reach it near the start.
    const placements = [
      { led: 0, position: 0 },
      { led: 1, position: 1 },
      { led: 2, position: 0 },
      { led: 3, position: 1 },
    ]
    const frame = createGradientFrame(4, [0, 0, 0], [100, 200, 40], placements)

    expect([...frame.slice(0, 3)]).toEqual([0, 0, 0])
    expect([...frame.slice(3, 6)]).toEqual([100, 200, 40])
    expect([...frame.slice(6, 9)]).toEqual([0, 0, 0])
    expect([...frame.slice(9, 12)]).toEqual([100, 200, 40])
  })

  test("spans the full spectrum once when LEDs are positioned", () => {
    const frame = createRainbowFrame(3, [
      { led: 0, position: 10 },
      { led: 1, position: 20 },
      { led: 2, position: 30 },
    ])

    // Red at the left edge, cyan halfway, back to red at the right edge.
    expect([...frame.slice(0, 3)]).toEqual([255, 0, 0])
    expect([...frame.slice(3, 6)]).toEqual([0, 255, 255])
    expect([...frame.slice(6, 9)]).toEqual([255, 0, 0])
  })

  test("rejects placements outside the frame", () => {
    expect(() => createRainbowFrame(2, [{ led: 5, position: 0 }])).toThrow(
      RangeError,
    )
  })
})
