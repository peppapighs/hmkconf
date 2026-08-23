import { describe, expect, test } from "bun:test"
import { HMK_RGBEffect } from "./rgb"
import {
  hmkRgbEffectPhase,
  hmkRgbEffectUsesBaseColor,
  hmkRgbHueToColor,
  renderHmkRgbEffectFrame,
} from "./rgb-effects"

const BASE: [number, number, number] = [0x20, 0x40, 0xff]

describe("libhmk RGB effects", () => {
  test("matches the firmware hue sectors", () => {
    // `rgb_hue_to_rgb()` walks six 43-step sectors, so sector boundaries land
    // on multiples of 43 rather than on 256/6.
    expect(hmkRgbHueToColor(0)).toEqual([255, 0, 0])
    expect(hmkRgbHueToColor(43)).toEqual([255, 255, 0])
    expect(hmkRgbHueToColor(86)).toEqual([0, 255, 0])
    expect(hmkRgbHueToColor(129)).toEqual([0, 255, 255])
    expect(hmkRgbHueToColor(172)).toEqual([0, 0, 255])
    expect(hmkRgbHueToColor(215)).toEqual([255, 0, 255])
    expect(hmkRgbHueToColor(256)).toEqual(hmkRgbHueToColor(0))
  })

  test("renders a static frame from the base color", () => {
    const frame = renderHmkRgbEffectFrame(HMK_RGBEffect.STATIC, 91, 3, BASE)
    expect([...frame!]).toEqual([...BASE, ...BASE, ...BASE])
  })

  test("breathes between black and the base color", () => {
    const dark = renderHmkRgbEffectFrame(HMK_RGBEffect.BREATHING, 0, 1, BASE)
    const bright = renderHmkRgbEffectFrame(
      HMK_RGBEffect.BREATHING,
      128,
      1,
      BASE,
    )
    expect([...dark!]).toEqual([0, 0, 0])
    // Phase 128 scales by 254/255, matching the firmware's integer rounding.
    expect([...bright!]).toEqual([0x20, 0x40, 254])
  })

  test("cycles every LED through the same rainbow hue", () => {
    const frame = renderHmkRgbEffectFrame(HMK_RGBEffect.RAINBOW, 43, 2, BASE)
    expect([...frame!]).toEqual([255, 255, 0, 255, 255, 0])
  })

  test("offsets the rainbow wave by LED position", () => {
    const frame = renderHmkRgbEffectFrame(
      HMK_RGBEffect.RAINBOW_WAVE,
      0,
      2,
      BASE,
    )
    expect([...frame!.slice(0, 3)]).toEqual([...hmkRgbHueToColor(0)])
    expect([...frame!.slice(3, 6)]).toEqual([...hmkRgbHueToColor(128)])
  })

  test("sweeps the wave along declared LED positions", () => {
    // Two rows of two LEDs wired as a serpentine: LEDs 0 and 3 share the left
    // column, 1 and 2 the right one, so each column must be one color.
    const frame = renderHmkRgbEffectFrame(
      HMK_RGBEffect.RAINBOW_WAVE,
      0,
      4,
      BASE,
      [0, 128, 128, 0],
    )
    expect([...frame!.slice(0, 3)]).toEqual([...frame!.slice(9, 12)])
    expect([...frame!.slice(3, 6)]).toEqual([...frame!.slice(6, 9)])
    expect([...frame!.slice(0, 3)]).not.toEqual([...frame!.slice(3, 6)])
  })

  test("ignores a wave offset table that does not cover every LED", () => {
    expect(
      renderHmkRgbEffectFrame(HMK_RGBEffect.RAINBOW_WAVE, 0, 4, BASE, [0, 128]),
    ).toEqual(renderHmkRgbEffectFrame(HMK_RGBEffect.RAINBOW_WAVE, 0, 4, BASE))
  })

  test("leaves live and unknown effects to the device", () => {
    expect(renderHmkRgbEffectFrame(HMK_RGBEffect.LIVE, 0, 4, BASE)).toBeNull()
    expect(renderHmkRgbEffectFrame(200, 0, 4, BASE)).toBeNull()
  })

  test("advances one phase step every 20 ms and wraps at 256", () => {
    expect(hmkRgbEffectPhase(0)).toBe(0)
    expect(hmkRgbEffectPhase(19)).toBe(0)
    expect(hmkRgbEffectPhase(20)).toBe(1)
    expect(hmkRgbEffectPhase(256 * 20)).toBe(0)
  })

  test("knows which effects consume the persistent base color", () => {
    expect(hmkRgbEffectUsesBaseColor(HMK_RGBEffect.STATIC)).toBe(true)
    expect(hmkRgbEffectUsesBaseColor(HMK_RGBEffect.BREATHING)).toBe(true)
    expect(hmkRgbEffectUsesBaseColor(HMK_RGBEffect.RAINBOW)).toBe(false)
    expect(hmkRgbEffectUsesBaseColor(HMK_RGBEffect.LIVE)).toBe(false)
  })
})
