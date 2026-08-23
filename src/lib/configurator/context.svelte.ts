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

import { keyboardContext } from "$lib/keyboard"
import type { KeyboardLayout } from "$lib/keyboard/metadata"
import { HMK_AKType } from "$lib/libhmk/advanced-keys"
import { Context, PersistedState } from "runed"
import { SvelteSet } from "svelte/reactivity"
import z from "zod"
import { getAdvancedKeyMetadata } from "./lib/advanced-keys"

export class ConfiguratorRemapState {
  layer = $state(0)
  key: number | null = $state(null)

  reset() {
    this.layer = 0
    this.key = null
  }
  setLayer(layer: number) {
    this.layer = layer
    this.key = null
  }
}

export const remapStateContext = new Context<ConfiguratorRemapState>(
  "hmk-remap-state",
)

export class ConfiguratorPerformanceState {
  keys = new SvelteSet<number>()
  showKeymap = $state(false)

  reset() {
    this.keys.clear()
    this.showKeymap = false
  }
}

export const performanceStateContext =
  new Context<ConfiguratorPerformanceState>("hmk-performance-state")

export class ConfiguratorAdvancedKeysState {
  layer = $state(0)
  index: number | null = $state(null)
  create: {
    type: HMK_AKType
    keyIndex: number | null
    keys: (number | null)[]
  } | null = $state(null)

  reset() {
    this.layer = 0
    this.index = null
    this.create = null
  }
  setLayer(layer: number) {
    this.layer = layer
    this.index = null
    this.create = null
  }
  setIndex(index: number | null) {
    this.index = index
    this.create = null
  }
  createOpen(type: HMK_AKType) {
    if (type === HMK_AKType.NONE) return
    const { numKeys } = getAdvancedKeyMetadata(type)
    this.create = { type, keyIndex: 0, keys: Array(numKeys).fill(null) }
    this.index = null
  }
  createClose() {
    this.create = null
    this.index = null
  }
  createSetKeyIndex(index: number) {
    if (!this.create) return
    this.create.keyIndex = index
    if (this.create.keys[index] !== null) {
      this.create.keys[index] = null
    }
  }
  createSetKey(key: number) {
    if (!this.create) return
    let index = this.create.keys.indexOf(key)
    if (index !== -1) {
      this.create.keys[index] = null
      this.create.keyIndex = index
    } else if (this.create.keyIndex !== null) {
      this.create.keys[this.create.keyIndex] = key
      index = this.create.keys.indexOf(null)
      this.create.keyIndex = index === -1 ? null : index
    }
  }
}

export const advancedKeysStateContext =
  new Context<ConfiguratorAdvancedKeysState>("hmk-advanced-keys-state")

export type ConfiguratorGamepadTabs = "setup" | "analog"

export class ConfiguratorGamepadState {
  key: number | null = $state(null)
  tab: ConfiguratorGamepadTabs = $state("setup")

  reset() {
    this.key = null
    this.tab = "setup"
  }
  setTab(tab: ConfiguratorGamepadTabs) {
    this.tab = tab
    this.key = null
  }
}

export const gamepadStateContext = new Context<ConfiguratorGamepadState>(
  "hmk-gamepad-state",
)

export type ConfiguratorTabs =
  | "profiles"
  | "remap"
  | "performance"
  | "advanced-keys"
  | "gamepad"
  | "lighting"
  | "calibration"
  | "settings"

export class ConfiguratorGlobalState {
  tab: ConfiguratorTabs = $state("remap")
  profile = $state(0)

  #remapState: ConfiguratorRemapState
  #performanceState: ConfiguratorPerformanceState
  #advancedKeysState: ConfiguratorAdvancedKeysState
  #gamepadState: ConfiguratorGamepadState

  constructor() {
    this.#remapState = remapStateContext.get()
    this.#performanceState = performanceStateContext.get()
    this.#advancedKeysState = advancedKeysStateContext.get()
    this.#gamepadState = gamepadStateContext.get()
  }

  setProfile(profile: number) {
    this.profile = profile
    this.#remapState.reset()
    this.#performanceState.reset()
    this.#advancedKeysState.reset()
    this.#gamepadState.reset()
  }
}

export const globalStateContext = new Context<ConfiguratorGlobalState>(
  "hmk-configurator-state",
)

export const persistedStateSchema = z.object({
  layoutOptions: z.array(z.int().min(0)),
})

export type ConfiguratorPersistedState = z.infer<typeof persistedStateSchema>

export const persistedStateContext = new Context<
  PersistedState<ConfiguratorPersistedState>
>("hmk-persisted-state")

function setConfiguratorPersistedState() {
  const { id, metadata } = keyboardContext.get()
  const defaultPersistedState: ConfiguratorPersistedState = {
    layoutOptions: Array(metadata.layout.labels.length).fill(0),
  }
  persistedStateContext.set(
    new PersistedState(id, defaultPersistedState, {
      serializer: {
        serialize: JSON.stringify,
        deserialize: (val) => {
          try {
            return persistedStateSchema
              .refine(({ layoutOptions }) => {
                const { layout } = metadata
                const optionMaxValues = layout.labels.map((l) =>
                  typeof l === "string" ? 2 : l.length - 1,
                )
                return (
                  layoutOptions.length === layout.labels.length &&
                  layoutOptions.every((o, i) => o < optionMaxValues[i])
                )
              })
              .parse(JSON.parse(val))
          } catch (err) {
            console.error(err)
            return defaultPersistedState
          }
        },
      },
    }),
  )
}

export type DisplayLayoutKey = {
  key: number
  w: number
  h: number
  x: number
  y: number
}

function getKeyCoordinates({ keymap }: KeyboardLayout) {
  const coordinates: [number, number][] = []
  const position = [0, 0]

  for (const row of keymap) {
    for (const { w, x, y } of row) {
      position[0] += x
      position[1] += y
      coordinates.push([position[0], position[1]])
      position[0] += w
    }
    position[0] = 0
    position[1]++
  }

  return coordinates
}

export class DisplayLayout {
  width: number
  height: number
  displayKeys: DisplayLayoutKey[]

  #layout = keyboardContext.get().metadata.layout
  #layoutOptions = $derived(persistedStateContext.get().current.layoutOptions)

  constructor() {
    const keys = this.#layout.keymap.flat()
    const coordinates = getKeyCoordinates(this.#layout)
    const [width, height] = keys.reduce(
      (acc, { w, h, option }, i) => {
        if (option !== undefined && option[1] !== 0) return acc
        acc[0] = Math.max(acc[0], coordinates[i][0] + w)
        acc[1] = Math.max(acc[1], coordinates[i][1] + h)
        return acc
      },
      [0, 0],
    )
    const optionAnchors = keys.reduce(
      (acc, { option }, i) => {
        if (option === undefined) return acc
        const [k, v] = option
        acc[k][v][0] = Math.min(acc[k][v][0], coordinates[i][0])
        acc[k][v][1] = Math.min(acc[k][v][1], coordinates[i][1])
        return acc
      },
      this.#layout.labels.map((l) =>
        [...Array(typeof l === "string" ? 2 : l.length - 1)].map(() => [
          Number.MAX_SAFE_INTEGER,
          Number.MAX_SAFE_INTEGER,
        ]),
      ),
    )

    this.width = width
    this.height = height
    this.displayKeys = $derived.by(() =>
      keys.reduce((acc, { key, w, h, option }, i) => {
        let [x, y] = coordinates[i]
        if (option !== undefined) {
          const [k, v] = option
          if (v !== this.#layoutOptions[k]) {
            return acc
          } else {
            x += optionAnchors[k][0][0] - optionAnchors[k][v][0]
            y += optionAnchors[k][0][1] - optionAnchors[k][v][1]
          }
        }
        acc.push({ key, w, h, x, y })
        return acc
      }, [] as DisplayLayoutKey[]),
    )
  }
}

export const displayLayoutContext = new Context<DisplayLayout>(
  "hmk-display-layout",
)

export function setConfiguratorStateContext() {
  remapStateContext.set(new ConfiguratorRemapState())
  performanceStateContext.set(new ConfiguratorPerformanceState())
  advancedKeysStateContext.set(new ConfiguratorAdvancedKeysState())
  gamepadStateContext.set(new ConfiguratorGamepadState())
  // Global state depends on all other states.
  globalStateContext.set(new ConfiguratorGlobalState())
  setConfiguratorPersistedState()
  displayLayoutContext.set(new DisplayLayout())
}
