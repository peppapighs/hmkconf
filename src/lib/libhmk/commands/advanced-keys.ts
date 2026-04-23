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

import { DataViewReader } from "$lib/data-view-reader"
import { uint16ToUInt8s } from "$lib/integer"
import type {
  GetAdvancedKeysParams,
  SetAdvancedKeysParams,
} from "$lib/keyboard"
import type { Commander } from "$lib/keyboard/commander"
import type { KeyboardMetadata } from "$lib/keyboard/metadata"
import { isFeatureAvailable } from "$lib/utils"
import { HMK_Command } from "."
import { HMK_AKType, type HMK_AdvancedKey } from "../advanced-keys"

function getAdvancedKeySize(
  firmwareVersion: number,
  { numDynamicKeystrokeMaxBindings }: KeyboardMetadata,
) {
  if (!isFeatureAvailable("numDynamicKeystrokeMaxBindings", firmwareVersion)) {
    return 12
  } else {
    return (
      3 + // Layer, Key, Type
      Math.max(
        3, // Null Bind
        numDynamicKeystrokeMaxBindings * 2 + 1, // Dynamic Keystroke
        5, // Tap-Hold
        3, // Toggle
      )
    )
  }
}

export async function getAdvancedKeys(
  firmwareVersion: number,
  commander: Commander,
  keyboardMetadata: KeyboardMetadata,
  { profile }: GetAdvancedKeysParams,
) {
  const { numAdvancedKeys, numDynamicKeystrokeMaxBindings } = keyboardMetadata
  const advancedKeySize = getAdvancedKeySize(firmwareVersion, keyboardMetadata)
  const totalBytes = numAdvancedKeys * advancedKeySize
  const buffer = new Uint8Array(totalBytes)

  if (!isFeatureAvailable("numDynamicKeystrokeMaxBindings", firmwareVersion)) {
    const GET_ADVANCED_KEYS_MAX_ENTRIES = 5
    for (let i = 0; i < numAdvancedKeys; i += GET_ADVANCED_KEYS_MAX_ENTRIES) {
      const view = await commander.sendCommand({
        command: HMK_Command.GET_ADVANCED_KEYS,
        payload: [profile, i],
      })
      const numBytes =
        Math.min(GET_ADVANCED_KEYS_MAX_ENTRIES, numAdvancedKeys - i) *
        advancedKeySize
      buffer.set(new Uint8Array(view.buffer, 0, numBytes), i * advancedKeySize)
    }
  } else {
    for (let i = 0; i < totalBytes; ) {
      const view = await commander.sendCommand({
        command: HMK_Command.GET_ADVANCED_KEYS,
        payload: [profile, i & 0xff, (i >> 8) & 0xff],
      })
      const numBytes = view.getUint8(0)
      buffer.set(new Uint8Array(view.buffer, 1, numBytes), i)
      i += numBytes
    }
  }

  const ret: HMK_AdvancedKey[] = []
  for (let i = 0; i < numAdvancedKeys; i++) {
    const reader = new DataViewReader(
      new DataView(buffer.buffer),
      i * advancedKeySize,
    )
    const layer = reader.uint8()
    const key = reader.uint8()
    const type = reader.uint8()

    switch (type) {
      case HMK_AKType.NULL_BIND:
        ret.push({
          layer,
          key,
          action: {
            type,
            secondaryKey: reader.uint8(),
            behavior: reader.uint8(),
            bottomOutPoint: reader.uint8(),
          },
        })
        break
      case HMK_AKType.DYNAMIC_KEYSTROKE:
        ret.push({
          layer,
          key,
          action: {
            type,
            keycodes: [...Array(numDynamicKeystrokeMaxBindings)].map(() =>
              reader.uint8(),
            ),
            bitmap: [...Array(numDynamicKeystrokeMaxBindings)].map(() => {
              const bitmapRaw = reader.uint8()
              return [...Array(4)].map((_, i) => (bitmapRaw >> (i * 2)) & 3)
            }),
            bottomOutPoint: reader.uint8(),
          },
        })
        break
      case HMK_AKType.TAP_HOLD:
        ret.push({
          layer,
          key,
          action: {
            type,
            tapKeycode: reader.uint8(),
            holdKeycode: reader.uint8(),
            tappingTerm: reader.uint16(),
            holdOnOtherKeyPress: reader.uint8() !== 0,
          },
        })
        break
      case HMK_AKType.TOGGLE:
        ret.push({
          layer,
          key,
          action: {
            type,
            keycode: reader.uint8(),
            tappingTerm: reader.uint16(),
          },
        })
        break
      case HMK_AKType.NONE:
      default:
        ret.push({ layer, key, action: { type } })
        break
    }
  }

  return ret
}

export async function setAdvancedKeys(
  firmwareVersion: number,
  commander: Commander,
  keyboardMetadata: KeyboardMetadata,
  { profile, offset, data }: SetAdvancedKeysParams,
) {
  const advancedKeySize = getAdvancedKeySize(firmwareVersion, keyboardMetadata)
  const buffer = []

  for (const { layer, key, action } of data) {
    const current = [layer, key, action.type]
    switch (action.type) {
      case HMK_AKType.NULL_BIND:
        current.push(
          action.secondaryKey,
          action.behavior,
          action.bottomOutPoint,
        )
        break
      case HMK_AKType.DYNAMIC_KEYSTROKE:
        current.push(
          ...action.keycodes,
          ...action.bitmap.map((bitmap) =>
            bitmap.reduce((acc, bit, i) => acc | (bit << (2 * i)), 0),
          ),
          action.bottomOutPoint,
        )
        break
      case HMK_AKType.TAP_HOLD:
        current.push(
          action.tapKeycode,
          action.holdKeycode,
          ...uint16ToUInt8s(action.tappingTerm),
          action.holdOnOtherKeyPress ? 1 : 0,
        )
        break
      case HMK_AKType.TOGGLE:
        current.push(action.keycode, ...uint16ToUInt8s(action.tappingTerm))
        break
      case HMK_AKType.NONE:
      default:
        break
    }
    current.push(...Array(advancedKeySize - current.length).fill(0))
    buffer.push(...current)
  }

  if (!isFeatureAvailable("numDynamicKeystrokeMaxBindings", firmwareVersion)) {
    const SET_ADVANCED_KEYS_MAX_ENTRIES = 5
    for (let i = 0; i < data.length; i += SET_ADVANCED_KEYS_MAX_ENTRIES) {
      const partLength = Math.min(
        SET_ADVANCED_KEYS_MAX_ENTRIES,
        data.length - i,
      )
      const payload = [profile, offset + i, partLength]
      payload.push(
        ...buffer.slice(
          i * advancedKeySize,
          (i + partLength) * advancedKeySize,
        ),
      )

      await commander.sendCommand({
        command: HMK_Command.SET_ADVANCED_KEYS,
        payload,
      })
    }
  } else {
    const SET_ADVANCED_KEYS_BYTES_PER_PACKET = 59
    for (
      let i = 0;
      i < buffer.length;
      i += SET_ADVANCED_KEYS_BYTES_PER_PACKET
    ) {
      const part = buffer.slice(i, i + SET_ADVANCED_KEYS_BYTES_PER_PACKET)
      const partOffset = offset * advancedKeySize + i
      await commander.sendCommand({
        command: HMK_Command.SET_ADVANCED_KEYS,
        payload: [
          profile,
          partOffset & 0xff,
          (partOffset >> 8) & 0xff,
          part.length,
          ...part,
        ],
      })
    }
  }
}
