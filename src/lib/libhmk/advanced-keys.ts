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
import { HMK_MAX_DKS_BINDINGS, HMK_MAX_NUM_KEYS, HMK_MAX_NUM_LAYERS } from "."
import z from "zod"

export const DEFAULT_BOTTOM_OUT_POINT = 230
export const DEFAULT_TAPPING_TERM = 200
export const MIN_TAPPING_TERM = 10
export const MAX_TAPPING_TERM = 1000
export const DEFAULT_TICK_RATE = 30
export const HMK_DEFAULT_DKS_MAX_BINDINGS = 4
export const HMK_DKS_NUM_ACTIONS = 4

export function getAdvancedKeySize(dynamicKeystrokeMaxBindings: number) {
  return Math.max(8, dynamicKeystrokeMaxBindings * 2 + 4)
}

export enum HMK_AKType {
  NONE = 0,
  NULL_BIND,
  DYNAMIC_KEYSTROKE,
  TAP_HOLD,
  TOGGLE,
}

export const hmkAKNoneSchema = z.object({
  type: z.literal(HMK_AKType.NONE),
})

export type HMK_AKNone = z.infer<typeof hmkAKNoneSchema>

export enum HMK_NullBindBehavior {
  LAST = 0,
  PRIMARY,
  SECONDARY,
  NEUTRAL,
  DISTANCE,
}

export const hmkAKNullBindSchema = z.object({
  type: z.literal(HMK_AKType.NULL_BIND),
  secondaryKey: uint8Schema,
  behavior: z.enum(HMK_NullBindBehavior),
  bottomOutPoint: uint8Schema,
})

export type HMK_AKNullBind = z.infer<typeof hmkAKNullBindSchema>

export enum HMK_DKSAction {
  HOLD = 0,
  PRESS,
  RELEASE,
  TAP,
}

export const hmkAKDynamicKeystrokeSchema = z.object({
  type: z.literal(HMK_AKType.DYNAMIC_KEYSTROKE),
  keycodes: z.array(uint8Schema).min(4).max(HMK_MAX_DKS_BINDINGS),
  bitmap: z
    .array(z.array(z.enum(HMK_DKSAction)).length(HMK_DKS_NUM_ACTIONS))
    .min(4)
    .max(HMK_MAX_DKS_BINDINGS),
  bottomOutPoint: uint8Schema,
})

export type HMK_AKDynamicKeystroke = z.infer<typeof hmkAKDynamicKeystrokeSchema>

export const hmkAKTapHoldSchema = z.object({
  type: z.literal(HMK_AKType.TAP_HOLD),
  tapKeycode: uint8Schema,
  holdKeycode: uint8Schema,
  tappingTerm: uint16Schema,
  holdOnOtherKeyPress: z.boolean(),
})

export type HMK_AKTapHold = z.infer<typeof hmkAKTapHoldSchema>

export const hmkAKToggleSchema = z.object({
  type: z.literal(HMK_AKType.TOGGLE),
  keycode: uint8Schema,
  tappingTerm: uint16Schema,
})

export type HMK_AKToggle = z.infer<typeof hmkAKToggleSchema>

export const hmkAdvancedKeySchema = z.object({
  layer: uint8Schema.max(HMK_MAX_NUM_LAYERS - 1),
  key: uint8Schema.max(HMK_MAX_NUM_KEYS - 1),
  action: z.union([
    hmkAKNoneSchema,
    hmkAKNullBindSchema,
    hmkAKDynamicKeystrokeSchema,
    hmkAKTapHoldSchema,
    hmkAKToggleSchema,
  ]),
})

export type HMK_AdvancedKey = z.infer<typeof hmkAdvancedKeySchema>

export const defaultAdvancedKey: HMK_AdvancedKey = {
  layer: 0,
  key: 0,
  action: { type: HMK_AKType.NONE },
}
