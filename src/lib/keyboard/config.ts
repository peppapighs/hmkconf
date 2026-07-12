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
import { hmkActuationSchema } from "$lib/libhmk/actuation"
import { hmkAdvancedKeySchema } from "$lib/libhmk/advanced-keys"
import { hmkGamepadOptionsSchema } from "$lib/libhmk/gamepad"
import { hmkMacroNodeSchema } from "$lib/libhmk/macro"
import z from "zod"

const ignoreOnError = <T>(schema: z.ZodType<T>) =>
  z.any().transform((val) => {
    const { success, data } = schema.safeParse(val)
    return success ? data : undefined
  })

const keyboardConfigMetadataSchema = z.object({
  version: uint16Schema,
  vendorId: uint16Schema,
  productId: uint16Schema,
})

export const keyboardConfigSchema = z.object({
  timestamp: z.iso.datetime(),
  metadata: keyboardConfigMetadataSchema,
  profile: z.object({
    keymap: ignoreOnError(z.array(z.array(uint8Schema))),
    actuationMap: ignoreOnError(z.array(hmkActuationSchema)),
    advancedKeys: ignoreOnError(z.array(hmkAdvancedKeySchema)),
    macros: ignoreOnError(z.array(hmkMacroNodeSchema)),
    gamepadButtons: ignoreOnError(z.array(uint8Schema)),
    gamepadOptions: ignoreOnError(hmkGamepadOptionsSchema),
    tickRate: ignoreOnError(uint8Schema),
  }),
})
