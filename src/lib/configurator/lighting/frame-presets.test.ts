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
})
