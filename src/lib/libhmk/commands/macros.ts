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
  GetMacrosParams,
  SetMacrosParams,
} from "$lib/keyboard"
import type { Commander } from "$lib/keyboard/commander"
import type { KeyboardMetadata } from "$lib/keyboard/metadata"
import { HMK_Command } from "."

const GET_MACROS_MAX_BYTES = 62
const SET_MACROS_MAX_BYTES = 59

export async function getMacros(
  commander: Commander,
  { macroBufferSize }: KeyboardMetadata,
  { profile }: GetMacrosParams,
) {
  const ret: number[] = []
  for (
    let offset = 0;
    offset < macroBufferSize;
    offset += GET_MACROS_MAX_BYTES
  ) {
    const reader = new DataViewReader(
      await commander.sendCommand({
        command: HMK_Command.GET_MACROS,
        payload: [profile, ...uint16ToUInt8s(offset)],
      }),
    )
    const len = reader.uint8()
    for (let i = 0; i < len && ret.length < macroBufferSize; i++) {
      ret.push(reader.uint8())
    }
  }

  return ret
}

export async function setMacros(
  commander: Commander,
  { profile, offset, data }: SetMacrosParams,
) {
  for (let i = 0; i < data.length; i += SET_MACROS_MAX_BYTES) {
    const part = data.slice(i, i + SET_MACROS_MAX_BYTES)
    await commander.sendCommand({
      command: HMK_Command.SET_MACROS,
      payload: [profile, ...uint16ToUInt8s(offset + i), part.length, ...part],
    })
  }
}
