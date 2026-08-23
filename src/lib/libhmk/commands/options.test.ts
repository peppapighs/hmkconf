import { describe, expect, test } from "bun:test"
import { HMK_Command } from "."
import type { HMK_Options } from ".."
import {
  decodeOptionsWord,
  encodeOptionsWord,
  getOptions,
  setOptions,
} from "./options"

const legacyOptions: HMK_Options = {
  xInputEnabled: true,
  saveBottomOutThreshold: true,
  highPollingRateEnabled: true,
}

describe("global options compatibility codec", () => {
  test("preserves the legacy save-threshold meaning of bit 1", () => {
    expect(decodeOptionsWord(0b111)).toEqual({
      ...legacyOptions,
      gamepadMode: "xinput",
      rawWord: 0b111,
    })
    expect(encodeOptionsWord(legacyOptions)).toBe(0b111)
  })

  test("clears reserved bit 1 on non-HID firmware 1.7 and newer", () => {
    const apis = ["xinput"] as const
    expect(decodeOptionsWord(0b111, apis, 0x0106)).toMatchObject({
      saveBottomOutThreshold: true,
    })
    expect(decodeOptionsWord(0b111, apis, 0x0107)).toMatchObject({
      saveBottomOutThreshold: false,
    })
    expect(encodeOptionsWord(legacyOptions, apis, 0x0106)).toBe(0b111)
    expect(encodeOptionsWord(legacyOptions, apis, 0x0107)).toBe(0b101)
  })

  test("uses bit 1 as mutually exclusive HID only when advertised", () => {
    const apis = ["xinput", "hid"] as const
    expect(decodeOptionsWord(0b110, apis)).toEqual({
      xInputEnabled: false,
      saveBottomOutThreshold: false,
      highPollingRateEnabled: true,
      gamepadMode: "hid",
      rawWord: 0b110,
    })
    expect(
      encodeOptionsWord(
        {
          ...legacyOptions,
          gamepadMode: "hid",
        },
        apis,
      ),
    ).toBe(0b110)
    expect(
      encodeOptionsWord(
        {
          ...legacyOptions,
          gamepadMode: "disabled",
        },
        apis,
      ),
    ).toBe(0b100)
  })

  test("rejects invalid or unsupported gamepad combinations", () => {
    expect(() => decodeOptionsWord(0b011, ["xinput", "hid"])).toThrow(
      "both enabled",
    )
    expect(() =>
      encodeOptionsWord({ ...legacyOptions, gamepadMode: "hid" }),
    ).toThrow("does not advertise")
  })

  test("preserves unknown option bits across known setting changes", () => {
    const decoded = decodeOptionsWord(0xa584, ["xinput", "hid"])
    expect(
      encodeOptionsWord(
        { ...decoded, gamepadMode: "hid", highPollingRateEnabled: true },
        ["xinput", "hid"],
      ),
    ).toBe(0xa586)
  })

  test("get/set use the selected codec without changing the command ABI", async () => {
    const requests: Array<{ command: HMK_Command; payload?: number[] }> = []
    const commander = {
      async sendCommand(options: { command: HMK_Command; payload?: number[] }) {
        requests.push(options)
        return new DataView(Uint8Array.from([0b010, 0]).buffer)
      },
    }
    const apis = ["xinput", "hid"] as const

    expect(await getOptions(commander as never, apis, 0x0109)).toMatchObject({
      gamepadMode: "hid",
    })
    await setOptions(
      commander as never,
      {
        data: {
          xInputEnabled: false,
          saveBottomOutThreshold: false,
          highPollingRateEnabled: true,
          gamepadMode: "hid",
        },
      },
      apis,
      0x0109,
    )

    expect(requests).toEqual([
      { command: HMK_Command.GET_OPTIONS },
      { command: HMK_Command.SET_OPTIONS, payload: [0b110, 0] },
    ])
  })
})
