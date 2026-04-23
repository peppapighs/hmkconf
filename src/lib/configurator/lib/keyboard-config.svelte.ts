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
import { keyboardConfigSchema } from "$lib/keyboard/config"
import { HMK_FIRMWARE_MAX_VERSION } from "$lib/libhmk"
import { HMK_AKType } from "$lib/libhmk/advanced-keys"
import { SvelteDate } from "svelte/reactivity"
import { globalStateContext } from "../context.svelte"
import { actuationQueryContext } from "../queries/actuation-query.svelte"
import { advancedKeysQueryContext } from "../queries/advanced-keys-query.svelte"
import { gamepadQueryContext } from "../queries/gamepad-query.svelte"
import { keymapQueryContext } from "../queries/keymap-query.svelte"
import { tickRateQueryContext } from "../queries/tick-rate-query.svelte"

export class KeyboardConfig {
  #keyboard = keyboardContext.get()
  #schema = keyboardConfigSchema.superRefine((val, ctx) => {
    const {
      vendorId,
      productId,
      numLayers,
      numKeys,
      numAdvancedKeys,
      numDynamicKeystrokeMaxBindings,
    } = this.#keyboard.metadata
    const {
      metadata,
      profile: { keymap, actuationMap, advancedKeys, gamepadButtons },
    } = val

    if (metadata.version > HMK_FIRMWARE_MAX_VERSION) {
      ctx.addIssue({
        code: "custom",
        message: "Unsupported firmware version",
      })
      return
    }

    if (metadata.vendorId !== vendorId || metadata.productId !== productId) {
      ctx.addIssue({
        code: "custom",
        message: "The keyboard does not match the configuration",
      })
      return
    }

    if (keymap !== undefined) {
      if (keymap.length !== numLayers) {
        ctx.addIssue({
          code: "custom",
          message: `Expected keymap to have exactly ${numLayers} layers.`,
        })
      }
      if (keymap.some((layer) => layer.length !== numKeys)) {
        ctx.addIssue({
          code: "custom",
          message: `Expected ${numKeys} keys for each keymap layer`,
        })
      }
    }

    if (actuationMap !== undefined && actuationMap.length !== numKeys) {
      ctx.addIssue({
        code: "custom",
        message: `Expected actuation map to have exactly ${numKeys} entries.`,
      })
    }

    if (advancedKeys !== undefined) {
      if (advancedKeys.length !== numAdvancedKeys) {
        ctx.addIssue({
          code: "custom",
          message: `Expected advanced keys to have exactly ${numAdvancedKeys} entries.`,
        })
      }
      if (
        advancedKeys.some(
          ({ action }) =>
            action.type === HMK_AKType.DYNAMIC_KEYSTROKE &&
            (action.keycodes.length !== numDynamicKeystrokeMaxBindings ||
              action.bitmap.length !== numDynamicKeystrokeMaxBindings),
        )
      ) {
        ctx.addIssue({
          code: "custom",
          message: `Expected dynamic keystroke to have exactly ${numDynamicKeystrokeMaxBindings} bindings.`,
        })
      }
    }

    if (gamepadButtons !== undefined && gamepadButtons.length !== numKeys) {
      ctx.addIssue({
        code: "custom",
        message: `Expected gamepad buttons to have exactly ${numKeys} entries.`,
      })
    }
  })

  #profile = $derived(globalStateContext.get().profile)
  #keymapQuery = keymapQueryContext.get()
  #actuationQuery = actuationQueryContext.get()
  #advancedKeysQuery = advancedKeysQueryContext.get()
  #gamepadQuery = gamepadQueryContext.get()
  #tickRateQuery = tickRateQueryContext.get()

  async getConfig(profile: number) {
    const version = this.#keyboard.version
    const { vendorId, productId } = this.#keyboard.metadata

    return this.#schema.parse({
      timestamp: new SvelteDate().toISOString(),
      metadata: { version, vendorId, productId },
      profile: {
        keymap: await this.#keyboard.getKeymap({ profile }),
        actuationMap: await this.#keyboard.getActuationMap({ profile }),
        advancedKeys: await this.#keyboard.getAdvancedKeys({ profile }),
        gamepadButtons: await this.#keyboard.getGamepadButtons({ profile }),
        gamepadOptions: await this.#keyboard.getGamepadOptions({ profile }),
        tickRate: await this.#keyboard.getTickRate({ profile }),
      },
    })
  }

  async setConfig(profile: number, config: unknown) {
    const {
      profile: {
        keymap,
        actuationMap,
        advancedKeys,
        gamepadButtons,
        gamepadOptions,
        tickRate,
      },
    } = this.#schema.parse(config)
    const shouldRefetch = this.#profile === profile

    if (keymap !== undefined) {
      await Promise.all(
        keymap.map((layer, i) =>
          this.#keyboard.setKeymap({
            profile,
            layer: i,
            offset: 0,
            data: layer,
          }),
        ),
      )
      if (shouldRefetch) this.#keymapQuery.keymap.refetch()
    }

    if (actuationMap !== undefined) {
      await this.#keyboard.setActuationMap({
        profile,
        offset: 0,
        data: actuationMap,
      })
      if (shouldRefetch) this.#actuationQuery.actuationMap.refetch()
    }

    if (advancedKeys !== undefined) {
      await this.#keyboard.setAdvancedKeys({
        profile,
        offset: 0,
        data: advancedKeys,
      })
      if (shouldRefetch) this.#advancedKeysQuery.advancedKeys.refetch()
    }

    if (gamepadButtons !== undefined) {
      await this.#keyboard.setGamepadButtons({
        profile,
        offset: 0,
        data: gamepadButtons,
      })
      if (shouldRefetch) this.#gamepadQuery.gamepadButtons.refetch()
    }

    if (gamepadOptions !== undefined) {
      await this.#keyboard.setGamepadOptions({ profile, data: gamepadOptions })
      if (shouldRefetch) this.#gamepadQuery.gamepadOptions.refetch()
    }

    if (tickRate !== undefined) {
      await this.#keyboard.setTickRate({ profile, data: tickRate })
      if (shouldRefetch) this.#tickRateQuery.tickRate.refetch()
    }
  }
}
