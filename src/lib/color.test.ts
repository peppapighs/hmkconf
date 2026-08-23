import { describe, expect, test } from "bun:test"
import {
  contrastTextColor,
  formatHexColor,
  hsvToRgb,
  parseHexColor,
  rgbToHsv,
} from "./color"

describe("color", () => {
  test("parses and formats hex colors", () => {
    expect(parseHexColor("#12aBf0")).toEqual([0x12, 0xab, 0xf0])
    expect(parseHexColor("12abf0")).toEqual([0x12, 0xab, 0xf0])
    expect(parseHexColor("#12abf")).toBeNull()
    expect(formatHexColor([0x12, 0xab, 0xf0])).toBe("#12abf0")
  })

  test("clamps out-of-range channels when formatting", () => {
    expect(formatHexColor([-10, 128.4, 999])).toBe("#0080ff")
  })

  test("round-trips through HSV", () => {
    for (const hex of ["#000000", "#ffffff", "#ef4444", "#22c55e", "#7c3aed"]) {
      const rgb = parseHexColor(hex)!
      expect(formatHexColor(hsvToRgb(rgbToHsv(rgb)))).toBe(hex)
    }
  })

  test("reports the primary hues", () => {
    expect(rgbToHsv([255, 0, 0]).h).toBe(0)
    expect(rgbToHsv([0, 255, 0]).h).toBe(120)
    expect(rgbToHsv([0, 0, 255]).h).toBe(240)
    expect(rgbToHsv([128, 128, 128])).toEqual({ h: 0, s: 0, v: 128 / 255 })
  })

  test("labels bright colors in black and dim colors in white", () => {
    expect(contrastTextColor([0xff, 0xff, 0xff])).toBe("#000000")
    expect(contrastTextColor([0x22, 0xc5, 0x5e])).toBe("#000000")
    expect(contrastTextColor([0, 0, 0])).toBe("#ffffff")
    expect(contrastTextColor([0x7c, 0x3a, 0xed])).toBe("#ffffff")
  })
})
