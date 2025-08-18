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

import { create } from "zustand"
import { immer } from "zustand/middleware/immer"

import { HE60_METADATA } from "@/constants/dummy-metadata"
import { DEFAULT_TICK_RATE, HMK_VERSION } from "@/constants/libhmk"
import { DEFAULT_ACTUATION } from "@/constants/libhmk/actuation"
import { DEFAULT_ADVANCED_KEY } from "@/constants/libhmk/advanced-keys"
import { DEFAULT_GAMEPAD_OPTIONS } from "@/constants/libhmk/gamepad"
import { KeyboardAction, KeyboardState } from "@/types/keyboard"
import {
  HMKActuation,
  HMKAdvancedKey,
  HMKGamepadButton,
  HMKGamepadOptions,
  HMKOptions,
} from "@/types/libhmk"

const DEMO_KEYBOARD_METADATA = HE60_METADATA

type DemoKeyboardState = KeyboardState & {
  options: HMKOptions
  profile: {
    keymap: number[][]
    actuationMap: HMKActuation[]
    advancedKeys: HMKAdvancedKey[]
    gamepadButtons: number[]
    gamepadOptions: HMKGamepadOptions
    tickRate: number
  }[]
}

type DemoKeyboard = DemoKeyboardState & KeyboardAction

const initialState: DemoKeyboardState = {
  id: "demo-keyboard",
  metadata: DEMO_KEYBOARD_METADATA,
  isDemo: true,

  options: {
    xInputEnabled: true,
  },
  profile: Array(DEMO_KEYBOARD_METADATA.numProfiles).fill({
    keymap: DEMO_KEYBOARD_METADATA.defaultKeymap,
    actuationMap: Array(DEMO_KEYBOARD_METADATA.numKeys).fill(DEFAULT_ACTUATION),
    advancedKeys: Array(DEMO_KEYBOARD_METADATA.numAdvancedKeys).fill(
      DEFAULT_ADVANCED_KEY,
    ),
    gamepadButtons: Array(DEMO_KEYBOARD_METADATA.numKeys).fill(
      HMKGamepadButton.NONE,
    ),
    gamepadOptions: DEFAULT_GAMEPAD_OPTIONS,
    tickRate: DEFAULT_TICK_RATE,
  }),
}

export const useDemoKeyboard = create<DemoKeyboard>()(
  immer((set, get, store) => ({
    ...initialState,

    disconnect: async () => set(store.getInitialState()),
    forget: async () => set(store.getInitialState()),

    firmwareVersion: async () => HMK_VERSION,
    reboot: async () => {},
    bootloader: async () => {},
    factoryReset: async () => set(store.getInitialState()),
    recalibrate: async () => {},
    analogInfo: async () =>
      Array(DEMO_KEYBOARD_METADATA.numKeys).fill({ adcValue: 0, distance: 0 }),
    getCalibration: async () => ({
      initialRestValue: 0,
      initialBottomOutThreshold: 0,
    }),
    setCalibration: async () => {},
    getProfile: async () => 0,
    getOptions: async () => get().options,
    setOptions: async ({ options }) =>
      set((state) => {
        state.options = options
      }),
    resetProfile: async ({ profile }) =>
      set((state) => {
        state.profile[profile] = store.getInitialState().profile[profile]
      }),
    duplicateProfile: async ({ profile, srcProfile }) =>
      set((state) => {
        state.profile[profile] = state.profile[srcProfile]
      }),

    getKeymap: async ({ profile, layer }) =>
      get().profile[profile].keymap[layer],
    setKeymap: async ({ profile, layer, offset, keymap }) =>
      set((state) => {
        for (let i = 0; i < keymap.length; i++) {
          state.profile[profile].keymap[layer][offset + i] = keymap[i]
        }
      }),
    getActuationMap: async ({ profile }) => get().profile[profile].actuationMap,
    setActuationMap: async ({ profile, offset, actuation }) =>
      set((state) => {
        for (let i = 0; i < actuation.length; i++) {
          state.profile[profile].actuationMap[offset + i] = actuation[i]
        }
      }),
    getAdvancedKeys: async ({ profile }) => get().profile[profile].advancedKeys,
    setAdvancedKeys: async ({ profile, offset, advancedKeys }) =>
      set((state) => {
        for (let i = 0; i < advancedKeys.length; i++) {
          state.profile[profile].advancedKeys[offset + i] = advancedKeys[i]
        }
      }),
    getTickRate: async ({ profile }) => get().profile[profile].tickRate,
    setTickRate: async ({ profile, tickRate }) =>
      set((state) => {
        state.profile[profile].tickRate = tickRate
      }),
    getGamepadButtons: async ({ profile }) =>
      get().profile[profile].gamepadButtons,
    setGamepadButtons: async ({ profile, offset, buttons }) =>
      set((state) => {
        for (let i = 0; i < buttons.length; i++) {
          state.profile[profile].gamepadButtons[offset + i] = buttons[i]
        }
      }),
    getGamepadOptions: async ({ profile }) =>
      get().profile[profile].gamepadOptions,
    setGamepadOptions: async ({ profile, options }) =>
      set((state) => {
        state.profile[profile].gamepadOptions = options
      }),
  })),
)
