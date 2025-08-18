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

import { HMKKeyboardState } from "@/hooks/use-hmk-keyboard"
import { DataViewReader } from "@/lib/data-view-reader"
import {
  KeyboardGetKeymapOptions,
  KeyboardSetKeymapOptions,
} from "@/types/keyboard"
import { HMKCommand } from "@/types/libhmk"

const GET_KEYMAP_MAX_ENTRIES = 63

export async function getKeymap(
  { device, metadata: { numKeys } }: HMKKeyboardState,
  { profile, layer }: KeyboardGetKeymapOptions,
) {
  const ret: number[] = []
  for (let i = 0; i < numKeys; i += GET_KEYMAP_MAX_ENTRIES) {
    const reader = new DataViewReader(
      await device.sendCommand({
        command: HMKCommand.GET_KEYMAP,
        payload: [profile, layer, i],
      }),
    )

    for (let j = 0; j < GET_KEYMAP_MAX_ENTRIES && i + j < numKeys; j++) {
      ret.push(reader.getUInt8())
    }
  }

  return ret
}

const SET_KEYMAP_MAX_ENTRIES = 59

export async function setKeymap(
  { device }: HMKKeyboardState,
  { profile, layer, offset, keymap }: KeyboardSetKeymapOptions,
) {
  for (let i = 0; i < keymap.length; i += SET_KEYMAP_MAX_ENTRIES) {
    const part = keymap.slice(i, i + SET_KEYMAP_MAX_ENTRIES)
    await device.sendCommand({
      command: HMKCommand.SET_KEYMAP,
      payload: [profile, layer, offset + i, part.length, ...part],
    })
  }
}
