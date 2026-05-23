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
  keyboardContext,
  type DuplicateProfileParams,
  type ResetProfileParams,
} from "$lib/keyboard"
import { Context, resource, type ResourceReturn } from "runed"
import { globalStateContext } from "../context.svelte"
import { actuationQueryContext } from "./actuation-query.svelte"
import { advancedKeysQueryContext } from "./advanced-keys-query.svelte"
import { calibrationQueryContext } from "./calibration.query.svelte"
import { gamepadQueryContext } from "./gamepad-query.svelte"
import { keymapQueryContext } from "./keymap-query.svelte"
import { optionsQueryContext } from "./options-query.svelte"
import { macrosQueryContext } from "./macros-query.svelte"
import { tickRateQueryContext } from "./tick-rate-query.svelte"

const PROFILE_REFETCH_INTERVAL = 1000

export class ProfileQuery {
  profile: ResourceReturn<number>

  #keyboard = keyboardContext.get()
  #profile = $derived(globalStateContext.get().profile)

  #calibrationQuery = calibrationQueryContext.get()
  #optionsQuery = optionsQueryContext.get()
  #keymapQuery = keymapQueryContext.get()
  #actuationQuery = actuationQueryContext.get()
  #advancedKeysQuery = advancedKeysQueryContext.get()
  #macrosQuery = macrosQueryContext.get()
  #gamepadQuery = gamepadQueryContext.get()
  #tickRateQuery = tickRateQueryContext.get()

  constructor() {
    this.profile = resource(
      () => {},
      async () => {
        const ret = await this.#keyboard.getProfile()
        setTimeout(() => this.profile.refetch(), PROFILE_REFETCH_INTERVAL)
        return ret
      },
    )
  }

  #refetchProfile() {
    this.#keymapQuery.keymap.refetch()
    this.#actuationQuery.actuationMap.refetch()
    this.#advancedKeysQuery.advancedKeys.refetch()
    this.#macrosQuery.macros.refetch()
    this.#gamepadQuery.gamepadButtons.refetch()
    this.#gamepadQuery.gamepadOptions.refetch()
    this.#tickRateQuery.tickRate.refetch()
  }

  factoryReset() {
    this.#keyboard.factoryReset()
    this.#refetchProfile()
    this.#calibrationQuery.calibration.refetch()
    this.#optionsQuery.options.refetch()
  }
  resetProfile({ profile }: ResetProfileParams) {
    this.#keyboard.resetProfile({ profile })
    if (this.#profile === profile) {
      this.#refetchProfile()
    }
  }
  duplicateProfile({ profile, srcProfile }: DuplicateProfileParams) {
    this.#keyboard.duplicateProfile({ profile, srcProfile })
    if (this.#profile === profile) {
      this.#refetchProfile()
    }
  }
}

export const profileQueryContext = new Context<ProfileQuery>(
  "hmk-profile-query",
)
