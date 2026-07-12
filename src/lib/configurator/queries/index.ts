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

import type { ResourceReturn } from "runed"
import { ActuationQuery, actuationQueryContext } from "./actuation-query.svelte"
import {
  AdvancedKeysQuery,
  advancedKeysQueryContext,
} from "./advanced-keys-query.svelte"
import {
  AnalogInfoQuery,
  analogInfoQueryContext,
} from "./analog-info-query.svelte"
import {
  CalibrationQuery,
  calibrationQueryContext,
} from "./calibration.query.svelte"
import { GamepadQuery, gamepadQueryContext } from "./gamepad-query.svelte"
import { KeymapQuery, keymapQueryContext } from "./keymap-query.svelte"
import { MacrosQuery, macrosQueryContext } from "./macros-query.svelte"
import { OptionsQuery, optionsQueryContext } from "./options-query.svelte"
import { ProfileQuery, profileQueryContext } from "./profile-query.svelte"
import { TickRateQuery, tickRateQueryContext } from "./tick-rate-query.svelte"

export async function optimisticUpdate<T>(options: {
  resource: ResourceReturn<T>
  optimisticFn: (current: T) => T
  updateFn: () => Promise<void>
}) {
  const { resource, optimisticFn, updateFn } = options

  const current = resource.current
  if (current) resource.mutate(optimisticFn(current))

  try {
    await updateFn()
  } catch (err) {
    if (current !== undefined) resource.mutate(current)
    console.error(err)
  } finally {
    resource.refetch()
  }
}

export function setConfiguratorQueryContext() {
  analogInfoQueryContext.set(new AnalogInfoQuery())
  calibrationQueryContext.set(new CalibrationQuery())
  optionsQueryContext.set(new OptionsQuery())
  keymapQueryContext.set(new KeymapQuery())
  actuationQueryContext.set(new ActuationQuery())
  advancedKeysQueryContext.set(new AdvancedKeysQuery())
  macrosQueryContext.set(new MacrosQuery())
  gamepadQueryContext.set(new GamepadQuery())
  tickRateQueryContext.set(new TickRateQuery())
  // Profile query depends on all other queries.
  profileQueryContext.set(new ProfileQuery())
}
