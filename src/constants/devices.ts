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
  DeviceActuation,
  DeviceAdvancedKey,
  DeviceAdvancedKeyMetadata,
  DeviceAKType,
  DeviceDKSAction,
  DeviceNullBindBehavior,
  DeviceNullBindBehaviorMetadata,
} from "@/types/devices"
import { Keycode } from "@/types/keycodes"

export const SWITCH_DISTANCE = 80

export const DEFAULT_ACTUATION_POINT = 128
export const DEFAULT_RT_DOWN = 32

export const DEFAULT_ACTUATION: DeviceActuation = {
  actuationPoint: DEFAULT_ACTUATION_POINT,
  rtDown: 0,
  rtUp: 0,
  continuous: false,
}

export const DEFAULT_ADVANCED_KEY: DeviceAdvancedKey = {
  layer: 0,
  key: 0,
  ak: {
    type: DeviceAKType.NONE,
  },
}

export const DEFAULT_BOTTOM_OUT_POINT = 230
export const DEFAULT_TAPPING_TERM = 200
export const MIN_TAPPING_TERM = 10
export const MAX_TAPPING_TERM = 1000

export const AK_METADATA: DeviceAdvancedKeyMetadata[] = [
  {
    type: DeviceAKType.NULL_BIND,
    name: "Null Bind (Rappy Snappy + SOCD)",
    description:
      "Monitor 2 keys and select which one is active based on the chosen behavior.",
    numKeys: 2,
    keycodes: [Keycode.AK_NULL_BIND_PRIMARY, Keycode.AK_NULL_BIND_SECONDARY],
    create: (layer, keys) => ({
      layer,
      key: keys[0],
      ak: {
        type: DeviceAKType.NULL_BIND,
        secondaryKey: keys[1],
        behavior: 0,
        bottomOutPoint: 0,
      },
    }),
  },
  {
    type: DeviceAKType.DYNAMIC_KEYSTROKE,
    name: "Dynamic Keystroke",
    description:
      "Assign up to 4 keycodes to a single key. Each keycode can be assigned up to 4 actions for 4 different parts of the keystroke.",
    numKeys: 1,
    keycodes: [Keycode.AK_DYNAMIC_KEYSTROKE],
    create: (layer, keys, keymap) => ({
      layer,
      key: keys[0],
      ak: {
        type: DeviceAKType.DYNAMIC_KEYSTROKE,
        keycodes: [keymap[0], Keycode.KC_NO, Keycode.KC_NO, Keycode.KC_NO],
        bitmap: [
          [
            DeviceDKSAction.PRESS,
            DeviceDKSAction.HOLD,
            DeviceDKSAction.HOLD,
            DeviceDKSAction.RELEASE,
          ],
          Array(4).fill(DeviceDKSAction.HOLD),
          Array(4).fill(DeviceDKSAction.HOLD),
          Array(4).fill(DeviceDKSAction.HOLD),
        ],
        bottomOutPoint: DEFAULT_BOTTOM_OUT_POINT,
      },
    }),
  },
  {
    type: DeviceAKType.TAP_HOLD,
    name: "Tap-Hold",
    description:
      "Send a different keycode depending on whether the key is tapped or held.",
    numKeys: 1,
    keycodes: [Keycode.AK_TAP_HOLD],
    create: (layer, keys, keymap) => ({
      layer,
      key: keys[0],
      ak: {
        type: DeviceAKType.TAP_HOLD,
        tapKeycode: keymap[0],
        holdKeycode: Keycode.KC_NO,
        tappingTerm: DEFAULT_TAPPING_TERM,
        holdOnOtherKeyPress: false,
      },
    }),
  },
  {
    type: DeviceAKType.TOGGLE,
    name: "Toggle",
    description:
      "Toggle between key press and key release. Hold the key for normal behavior.",
    numKeys: 1,
    keycodes: [Keycode.AK_TOGGLE],
    create: (layer, keys, keymap) => ({
      layer,
      key: keys[0],
      ak: {
        type: DeviceAKType.TOGGLE,
        keycode: keymap[0],
        tappingTerm: DEFAULT_TAPPING_TERM,
      },
    }),
  },
]

export const AK_TYPE_TO_METADATA: Record<number, DeviceAdvancedKeyMetadata> =
  AK_METADATA.reduce(
    (acc, metadata) => ({ ...acc, [metadata.type]: metadata }),
    {},
  )

export const NULL_BIND_BEHAVIOR_METADATA: DeviceNullBindBehaviorMetadata[] = [
  {
    behavior: DeviceNullBindBehavior.LAST,
    name: "Last Input",
    description: "Activate the key that was pressed last.",
  },
  {
    behavior: DeviceNullBindBehavior.PRIMARY,
    name: "Absolute Priority (Key 1)",
    description: "Key 1 will take priority over key 2.",
  },
  {
    behavior: DeviceNullBindBehavior.SECONDARY,
    name: "Absolute Priority (Key 2)",
    description: "Key 2 will take priority over key 1.",
  },
  {
    behavior: DeviceNullBindBehavior.NEUTRAL,
    name: "Neutral",
    description: "Neither key will be activated.",
  },
  {
    behavior: DeviceNullBindBehavior.DISTANCE,
    name: "Distance (Rappy Snappy)",
    description: "Activate whichever key is pressed down further.",
  },
]
