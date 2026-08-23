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

import { keyboardContext, type SetOptionsParams } from "$lib/keyboard"
import type { HMK_Options } from "$lib/libhmk"
import { Context, resource, type ResourceReturn } from "runed"
import { optimisticUpdate } from "."

export class OptionsQuery {
  options: ResourceReturn<HMK_Options>

  #keyboard = keyboardContext.get()

  constructor() {
    this.options = resource(
      () => {},
      () => this.#keyboard.getOptions(),
    )
  }

  async set(params: SetOptionsParams) {
    const { data } = params
    return optimisticUpdate({
      resource: this.options,
      optimisticFn: () => data,
      updateFn: () => this.#keyboard.setOptions(params),
    })
  }
}

export const optionsQueryContext = new Context<OptionsQuery>(
  "hmk-options-query",
)
