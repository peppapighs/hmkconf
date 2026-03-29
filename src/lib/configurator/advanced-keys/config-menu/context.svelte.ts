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

import { advancedKeysQueryContext } from "$lib/configurator/queries/advanced-keys-query.svelte"
import type { HMK_AdvancedKey } from "$lib/libhmk/advanced-keys"
import { Context } from "runed"

function cloneAdvancedKey(advancedKey: HMK_AdvancedKey): HMK_AdvancedKey {
  return JSON.parse(JSON.stringify(advancedKey)) as HMK_AdvancedKey
}

export type ConfigMenuStateProps = {
  index: number
  advancedKey: HMK_AdvancedKey
}

export class ConfigMenuState {
  advancedKey: HMK_AdvancedKey
  dirty = $state(false)
  saving = $state(false)

  #index: number
  #advancedKeysQuery = advancedKeysQueryContext.get()
  #initialAdvancedKey: HMK_AdvancedKey

  constructor(props: () => ConfigMenuStateProps) {
    const { index, advancedKey } = $derived(props())
    this.#index = $derived(index)
    this.#initialAdvancedKey = $derived(advancedKey)
    this.advancedKey = $state({} as HMK_AdvancedKey)

    $effect(() => {
      if (!this.dirty && !this.saving) {
        this.advancedKey = cloneAdvancedKey(this.#initialAdvancedKey)
      }
    })
  }

  updateAction(action: HMK_AdvancedKey["action"]) {
    this.advancedKey = { ...this.advancedKey, action }
    this.dirty = true
  }

  async save() {
    if (!this.dirty) return

    this.saving = true
    try {
      await this.#advancedKeysQuery.set({
        offset: this.#index,
        data: [this.advancedKey],
      })
      this.dirty = false
    } finally {
      this.saving = false
    }
  }
}

export const configMenuStateContext = new Context<ConfigMenuState>(
  "hmk-config-menu-state",
)
