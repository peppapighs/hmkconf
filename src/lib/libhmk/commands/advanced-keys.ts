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
import { HMK_Command } from "."
import {
  HMK_AKType,
  HMK_DKS_NUM_ACTIONS,
  getAdvancedKeySize,
  type HMK_AdvancedKey,
} from "../advanced-keys"

const GET_ADVANCED_KEYS_MAX_BYTES = 62
const SET_ADVANCED_KEYS_MAX_BYTES = 59

export async function getAdvancedKeys(
  commander: Commander,
  { numAdvancedKeys, dynamicKeystrokeMaxBindings }: KeyboardMetadata,
  { profile }: GetAdvancedKeysParams,
) {
  const advancedKeySize = getAdvancedKeySize(dynamicKeystrokeMaxBindings)
  const totalSize = advancedKeySize * numAdvancedKeys
  const bytes: number[] = []

  for (let offset = 0; offset < totalSize; offset += GET_ADVANCED_KEYS_MAX_BYTES) {
    const len = Math.min(GET_ADVANCED_KEYS_MAX_BYTES, totalSize - offset)
    const view = await commander.sendCommand({
      command: HMK_Command.GET_ADVANCED_KEYS,
      payload: [profile, ...uint16ToUInt8s(offset), len],
    })

    const reader = new DataViewReader(view)
    const chunkLen = reader.uint8()
    for (let i = 0; i < chunkLen; i++) {
      bytes.push(reader.uint8())
    }
  }

  const ret: HMK_AdvancedKey[] = []
  const view = new DataView(Uint8Array.from(bytes).buffer)
  for (let i = 0; i < numAdvancedKeys; i++) {
      const reader = new DataViewReader(view, i * advancedKeySize)
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
              keycodes: [...Array(dynamicKeystrokeMaxBindings)].map(() =>
                reader.uint8(),
              ),
              bitmap: [...Array(dynamicKeystrokeMaxBindings)].map(() => {
                const bitmapRaw = reader.uint8()
                return [...Array(HMK_DKS_NUM_ACTIONS)].map(
                  (_, i) => (bitmapRaw >> (i * 2)) & 3,
                )
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
  commander: Commander,
  { dynamicKeystrokeMaxBindings }: KeyboardMetadata,
  { profile, offset, data }: SetAdvancedKeysParams,
) {
  const advancedKeySize = getAdvancedKeySize(dynamicKeystrokeMaxBindings)
  const serialized: number[] = []

  for (const { layer, key, action } of data) {
      const buffer = [layer, key, action.type]
      switch (action.type) {
        case HMK_AKType.NULL_BIND:
          buffer.push(
            action.secondaryKey,
            action.behavior,
            action.bottomOutPoint,
          )
          break
        case HMK_AKType.DYNAMIC_KEYSTROKE:
          buffer.push(
            ...action.keycodes,
            ...action.bitmap.map((bitmap) =>
              bitmap.reduce((acc, bit, i) => acc | (bit << (2 * i)), 0),
            ),
            action.bottomOutPoint,
          )
          break
        case HMK_AKType.TAP_HOLD:
          buffer.push(
            action.tapKeycode,
            action.holdKeycode,
            ...uint16ToUInt8s(action.tappingTerm),
            action.holdOnOtherKeyPress ? 1 : 0,
          )
          break
        case HMK_AKType.TOGGLE:
          buffer.push(action.keycode, ...uint16ToUInt8s(action.tappingTerm))
          break
        case HMK_AKType.NONE:
        default:
          break
      }
      buffer.push(...Array(advancedKeySize - buffer.length).fill(0))
      serialized.push(...buffer)
  }

  let byteOffset = offset * advancedKeySize
  for (let i = 0; i < serialized.length; i += SET_ADVANCED_KEYS_MAX_BYTES) {
    const chunk = serialized.slice(i, i + SET_ADVANCED_KEYS_MAX_BYTES)
    await commander.sendCommand({
      command: HMK_Command.SET_ADVANCED_KEYS,
      payload: [profile, ...uint16ToUInt8s(byteOffset), chunk.length, ...chunk],
    })
    byteOffset += chunk.length
  }
}
