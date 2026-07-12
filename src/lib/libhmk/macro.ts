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

import { uint8Schema, uint16Schema } from "$lib/integer"
import z from "zod"
import { Keycode } from "./keycodes"

export enum HMK_MacroAction {
  NONE = 0,
  PRESS,
  TAP,
  RELEASE,
}

export const HMK_MACRO_NODE_NONE = 0xff
export const HMK_MAX_MACRO_DELAY = 0x1fff

export const hmkMacroNodeSchema = z.object({
  keycode: uint8Schema,
  action: z.enum(HMK_MacroAction),
  delay: uint16Schema.max(HMK_MAX_MACRO_DELAY),
  next: uint8Schema,
})

export type HMK_MacroNode = z.infer<typeof hmkMacroNodeSchema>

export const defaultMacroNode: HMK_MacroNode = {
  keycode: Keycode.KC_NO,
  action: HMK_MacroAction.NONE,
  delay: 0,
  next: HMK_MACRO_NODE_NONE,
}
