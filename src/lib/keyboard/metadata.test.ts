import { describe, expect, test } from "bun:test"
import { keyboardMetadataSchema } from "./metadata"

function metadata(overrides: Record<string, unknown> = {}) {
  return {
    name: "Test keyboard",
    vendorId: "0x9172",
    productId: "0x0004",
    adcResolution: 12,
    numProfiles: 1,
    numLayers: 1,
    numKeys: 1,
    numAdvancedKeys: 1,
    numMacroNodes: 1,
    layout: { keymap: [[{ key: 0 }]] },
    defaultKeymap: [["KC_A"]],
    ...overrides,
  }
}

describe("keyboard metadata RGB and gamepad extensions", () => {
  test("keeps legacy metadata compatible", () => {
    const parsed = keyboardMetadataSchema.parse(metadata())

    expect(parsed.gamepadApis).toEqual(["xinput"])
    expect(parsed.rgb).toBeNull()
    expect(parsed.defaultKeymaps).toHaveLength(1)
  })

  test("parses HID gamepad and RGB build metadata", () => {
    const parsed = keyboardMetadataSchema.parse(
      metadata({
        gamepadApis: ["xinput", "hid"],
        rgb: {
          numLeds: 82,
          protocolMajor: 1,
          protocolMinor: 0,
          effects: [0, 1, 2, 3, 7],
        },
      }),
    )

    expect(parsed.gamepadApis).toEqual(["xinput", "hid"])
    expect(parsed.rgb).toEqual({
      numLeds: 82,
      protocolMajor: 1,
      protocolMinor: 0,
      effects: [0, 1, 2, 3, 7],
    })
  })

  test("validates an explicit key-to-LED topology", () => {
    expect(
      keyboardMetadataSchema.parse(
        metadata({
          rgb: {
            numLeds: 2,
            protocolMajor: 1,
            protocolMinor: 0,
            effects: [0, 7],
            keyToLed: [1],
          },
        }),
      ).rgb?.keyToLed,
    ).toEqual([1])

    expect(() =>
      keyboardMetadataSchema.parse(
        metadata({
          rgb: {
            numLeds: 1,
            protocolMajor: 1,
            protocolMinor: 0,
            effects: [0],
            keyToLed: [],
          },
        }),
      ),
    ).toThrow("Expected RGB keyToLed to have 1 entries")
    expect(() =>
      keyboardMetadataSchema.parse(
        metadata({
          rgb: {
            numLeds: 1,
            protocolMajor: 1,
            protocolMinor: 0,
            effects: [0],
            keyToLed: [1],
          },
        }),
      ),
    ).toThrow("outside the advertised 1-LED range")
  })

  test("ignores future gamepad APIs while preserving supported ones", () => {
    expect(
      keyboardMetadataSchema.parse(
        metadata({ gamepadApis: ["xinput", "switch-pro", "hid"] }),
      ).gamepadApis,
    ).toEqual(["xinput", "hid"])
    expect(
      keyboardMetadataSchema.parse(metadata({ gamepadApis: ["future-api"] }))
        .gamepadApis,
    ).toEqual([])
  })

  test("rejects ambiguous APIs and malformed RGB geometry", () => {
    expect(() =>
      keyboardMetadataSchema.parse(metadata({ gamepadApis: ["hid", "hid"] })),
    ).toThrow()
    expect(() =>
      keyboardMetadataSchema.parse(
        metadata({
          rgb: {
            numLeds: 0,
            protocolMajor: 1,
            protocolMinor: 0,
            effects: [0, 0],
          },
        }),
      ),
    ).toThrow()
  })
})
