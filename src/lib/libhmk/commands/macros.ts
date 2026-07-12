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
import type { GetMacrosParams, SetMacrosParams } from "$lib/keyboard"
import type { Commander } from "$lib/keyboard/commander"
import type { KeyboardMetadata } from "$lib/keyboard/metadata"
import { isFeatureAvailable } from "$lib/utils"
import { HMK_Command } from "."
import type { HMK_MacroNode } from "../macro"

const MACRO_NODE_SIZE = 4

export async function getMacros(
  firmwareVersion: number,
  commander: Commander,
  keyboardMetadata: KeyboardMetadata,
  { profile }: GetMacrosParams,
) {
  if (!isFeatureAvailable("advancedKeyMacro", firmwareVersion)) return []

  const { numMacroNodes } = keyboardMetadata
  const totalBytes = numMacroNodes * MACRO_NODE_SIZE
  const buffer = new Uint8Array(totalBytes)

  for (let i = 0; i < totalBytes;) {
    const view = await commander.sendCommand({
      command: HMK_Command.GET_MACROS,
      payload: [profile, i & 0xff, (i >> 8) & 0xff],
    })
    const numBytes = view.getUint8(0)
    buffer.set(new Uint8Array(view.buffer, 1, numBytes), i)
    i += numBytes
  }

  const ret: HMK_MacroNode[] = []
  for (let i = 0; i < numMacroNodes; i++) {
    const reader = new DataViewReader(
      new DataView(buffer.buffer),
      i * MACRO_NODE_SIZE,
    )
    const keycode = reader.uint8()
    const actionAndDelay = reader.uint16()
    const [action, delay] = [actionAndDelay & 0x7, actionAndDelay >> 3]
    const next = reader.uint8()

    ret.push({ keycode, action, delay, next })
  }

  return ret
}

const SET_MACROS_BYTES_PER_PACKET = 59

export async function setMacros(
  firmwareVersion: number,
  commander: Commander,
  { profile, offset, data }: SetMacrosParams,
) {
  if (!isFeatureAvailable("advancedKeyMacro", firmwareVersion)) return

  const buffer = []

  for (const { keycode, action, delay, next } of data) {
    const actionAndDelay = action | (delay << 3)
    buffer.push(
      keycode,
      actionAndDelay & 0xff,
      (actionAndDelay >> 8) & 0xff,
      next,
    )
  }

  for (let i = 0; i < buffer.length; i += SET_MACROS_BYTES_PER_PACKET) {
    const part = buffer.slice(i, i + SET_MACROS_BYTES_PER_PACKET)
    const partOffset = offset * MACRO_NODE_SIZE + i
    await commander.sendCommand({
      command: HMK_Command.SET_MACROS,
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
