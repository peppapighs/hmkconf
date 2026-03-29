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

import {
  ArrowDownFromLineIcon,
  ArrowDownToLineIcon,
  ArrowUpFromLineIcon,
  ArrowUpToLineIcon,
  FileQuestionMarkIcon,
  LayersIcon,
  LayoutTemplateIcon,
  MoveHorizontalIcon,
  ToggleLeftIcon,
} from "@lucide/svelte"
import { displayUInt8 } from "$lib/integer"
import {
  DEFAULT_BOTTOM_OUT_POINT,
  DEFAULT_TAPPING_TERM,
  defaultAdvancedKey,
  HMK_AKType,
  HMK_DKSAction,
  HMK_DKS_NUM_ACTIONS,
  HMK_NullBindBehavior,
  type HMK_AdvancedKey,
} from "$lib/libhmk/advanced-keys"
import { Keycode } from "$lib/libhmk/keycodes"
import type { Component } from "svelte"

export type AdvancedKeyMetadata = {
  type: HMK_AKType
  icon: Component
  title: string
  description: string
  numKeys: number
  keycodes: Keycode[]
}

export const advancedKeyMetadata: AdvancedKeyMetadata[] = [
  {
    type: HMK_AKType.NULL_BIND,
    icon: MoveHorizontalIcon,
    title: "Null Bind",
    description:
      "Monitor 2 selected keys and register them according to your chosen behavior.",
    numKeys: 2,
    keycodes: [Keycode.AK_NULL_BIND_PRIMARY, Keycode.AK_NULL_BIND_SECONDARY],
  },
  {
    type: HMK_AKType.DYNAMIC_KEYSTROKE,
    icon: LayersIcon,
    title: "Dynamic Keystroke",
    description:
      "Assign multiple bindings to a single key. Each binding can be configured with 4 different actions based on the key's position.",
    numKeys: 1,
    keycodes: [Keycode.AK_DYNAMIC_KEYSTROKE],
  },
  {
    type: HMK_AKType.TAP_HOLD,
    icon: LayoutTemplateIcon,
    title: "Tap-Hold",
    description:
      "Register different bindings depending on whether the key is tapped or held.",
    numKeys: 1,
    keycodes: [Keycode.AK_TAP_HOLD],
  },
  {
    type: HMK_AKType.TOGGLE,
    icon: ToggleLeftIcon,
    title: "Toggle",
    description:
      "Toggle between key press and release states. Hold the key for a normal key behavior.",
    numKeys: 1,
    keycodes: [Keycode.AK_TOGGLE],
  },
]

export function getAdvancedKeyMetadata(type: HMK_AKType): AdvancedKeyMetadata {
  const metadata = advancedKeyMetadata.find((m) => m.type === type)
  return (
    metadata ?? {
      type,
      icon: FileQuestionMarkIcon,
      title: `Unknown ${displayUInt8(type)}`,
      description: "This Advanced Key type is not recognized.",
      numKeys: 0,
      keycodes: [],
    }
  )
}

export function createAdvancedKey(options: {
  layer: number
  type: HMK_AKType
  keys: number[]
  keycodes: Keycode[]
  dynamicKeystrokeMaxBindings: number
}): HMK_AdvancedKey {
  const { layer, type, keys, keycodes, dynamicKeystrokeMaxBindings } = options

  switch (type) {
    case HMK_AKType.NULL_BIND:
      return {
        layer,
        key: keys[0],
        action: {
          type,
          secondaryKey: keys[1],
          behavior: HMK_NullBindBehavior.LAST,
          bottomOutPoint: 0,
        },
      }
    case HMK_AKType.DYNAMIC_KEYSTROKE:
      return {
        layer,
        key: keys[0],
        action: {
          type,
          keycodes: [
            keycodes[0],
            ...Array(dynamicKeystrokeMaxBindings - 1).fill(Keycode.KC_NO),
          ],
          bitmap: [
            [
              HMK_DKSAction.PRESS,
              HMK_DKSAction.HOLD,
              HMK_DKSAction.HOLD,
              HMK_DKSAction.RELEASE,
            ],
            ...Array(dynamicKeystrokeMaxBindings - 1)
              .fill(null)
              .map(() => Array(HMK_DKS_NUM_ACTIONS).fill(HMK_DKSAction.HOLD)),
          ],
          bottomOutPoint: DEFAULT_BOTTOM_OUT_POINT,
        },
      }
    case HMK_AKType.TAP_HOLD:
      return {
        layer,
        key: keys[0],
        action: {
          type,
          tapKeycode: keycodes[0],
          holdKeycode: Keycode.KC_NO,
          tappingTerm: DEFAULT_TAPPING_TERM,
          holdOnOtherKeyPress: false,
        },
      }
    case HMK_AKType.TOGGLE:
      return {
        layer,
        key: keys[0],
        action: {
          type,
          keycode: keycodes[0],
          tappingTerm: DEFAULT_TAPPING_TERM,
        },
      }
    default:
      return defaultAdvancedKey
  }
}

export type NullBindBehaviorMetadata = {
  behavior: HMK_NullBindBehavior
  title: string
  description: string
}

export const nullBindBehaviorMetadata: NullBindBehaviorMetadata[] = [
  {
    behavior: HMK_NullBindBehavior.LAST,
    title: "Last Input Priority",
    description: "Activate the key that was pressed last.",
  },
  {
    behavior: HMK_NullBindBehavior.PRIMARY,
    title: "Absolute Priority (Key 1)",
    description: "Key 1 will take priority over Key 2.",
  },
  {
    behavior: HMK_NullBindBehavior.SECONDARY,
    title: "Absolute Priority (Key 2)",
    description: "Key 2 will take priority over Key 1.",
  },
  {
    behavior: HMK_NullBindBehavior.NEUTRAL,
    title: "Neutral",
    description: "Neither key will be activated.",
  },
  {
    behavior: HMK_NullBindBehavior.DISTANCE,
    title: "Distance Priority (Rappy Snappy)",
    description: "Activate whichever key is pressed down further.",
  },
]

export function getNullBindBehaviorMetadata(
  behavior: HMK_NullBindBehavior,
): NullBindBehaviorMetadata {
  const metadata = nullBindBehaviorMetadata.find((m) => m.behavior === behavior)
  return (
    metadata ?? {
      behavior,
      title: `Unknown ${displayUInt8(behavior)}`,
      description: "This Null Bind behavior is not recognized.",
    }
  )
}

export const DKS_BIT_COLUMN_WIDTH = 90
export const DKS_ROW_PADDING = 8
export const DKS_ACTION_SIZE = 32

export type DynamicKeystrokeHeader = {
  icon: Component
  tooltip: string
}

export const dynamicKeystrokeHeaders: DynamicKeystrokeHeader[] = [
  { icon: ArrowDownFromLineIcon, tooltip: "Key press" },
  { icon: ArrowDownToLineIcon, tooltip: "Key fully pressed" },
  { icon: ArrowUpFromLineIcon, tooltip: "Key release from fully pressed" },
  { icon: ArrowUpToLineIcon, tooltip: "Key release" },
]

export function bitmapToIntervals(bitmap: HMK_DKSAction[]) {
  const ret: [number, number][] = []

  let left = null
  for (let i = 0; i < HMK_DKS_NUM_ACTIONS; i++) {
    if (bitmap[i] === HMK_DKSAction.HOLD) continue

    if (left !== null) {
      ret.push([left, i])
      left = null
    }

    if (bitmap[i] === HMK_DKSAction.PRESS) {
      left = i
    } else if (bitmap[i] === HMK_DKSAction.TAP) {
      ret.push([i, i])
    }
  }

  return ret
}

export function intervalsToBitmap(intervals: [number, number][]) {
  const bitmap: HMK_DKSAction[] = Array(HMK_DKS_NUM_ACTIONS).fill(
    HMK_DKSAction.HOLD,
  )

  for (const [l, r] of intervals) {
    if (l === r) {
      bitmap[l] = HMK_DKSAction.TAP
    } else {
      bitmap[l] = HMK_DKSAction.PRESS
      if (r < HMK_DKS_NUM_ACTIONS) bitmap[r] = HMK_DKSAction.RELEASE
    }
  }

  return bitmap
}

export function getDKSIntervalLeft([l]: [number, number]) {
  return l * DKS_BIT_COLUMN_WIDTH + DKS_ROW_PADDING
}

export function getDKSIntervalWidth([l, r]: [number, number]) {
  return l === r
    ? DKS_ACTION_SIZE
    : (r - l) * DKS_BIT_COLUMN_WIDTH - DKS_ROW_PADDING
}
