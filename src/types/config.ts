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

import { z } from "zod"

/**
 * Zod schema for profile data
 * Includes keymap, actuation map, advanced key settings, and tick rate
 */
export const profileDataSchema = z.object({
  keymap: z.array(z.array(z.number())).optional(),
  actuationMap: z.any().optional(),
  advancedKeys: z.any().optional(),
  tickRate: z.number().optional(),
})

/**
 * Zod schema for device information
 * Includes device name, firmware version, and device ID
 */
export const deviceInfoSchema = z.object({
  name: z.string(),
  firmwareVersion: z
    .union([z.string(), z.number()])
    .transform((val) => String(val)),
  deviceId: z.string(),
})

/**
 * Zod schema for settings
 * Includes keymap, actuation map, advanced key settings, tick rate, and calibration
 * For compatibility with legacy configuration file format
 */
export const settingsSchema = z.object({
  keymap: z.array(z.array(z.number())).optional(),
  actuationMap: z.any().optional(),
  advancedKeys: z.any().optional(),
  tickRate: z.number().optional(),
  calibration: z.any().optional(),
})

/**
 * Zod schema for the entire configuration file
 * Includes version, timestamp, device information, profiles, and settings
 */
export const configFileSchema = z
  .object({
    version: z.string(),
    timestamp: z.string(),
    deviceInfo: deviceInfoSchema,
    profiles: z.record(z.string(), profileDataSchema).optional(),
    settings: settingsSchema.optional(),
  })
  .refine(
    (data) => {
      // Verify that either new format or legacy format exists
      const hasProfiles = data.profiles && Object.keys(data.profiles).length > 0
      const hasSettings =
        data.settings &&
        Object.keys(data.settings).some(
          (key) =>
            data.settings![key as keyof typeof data.settings] !== undefined,
        )
      return hasProfiles || hasSettings
    },
    {
      message:
        "Configuration file must contain either profile data or legacy format settings data",
    },
  )

/**
 * Type definition for configuration file
 */
export type ConfigFile = z.infer<typeof configFileSchema>

/**
 * Type definition for profile data
 */
export type ProfileData = z.infer<typeof profileDataSchema>

/**
 * Type definition for device information
 */
export type DeviceInfo = z.infer<typeof deviceInfoSchema>

/**
 * Type definition for settings
 */
export type Settings = z.infer<typeof settingsSchema>

/**
 * Function to validate configuration file
 * @param data Data to validate
 * @returns Validated configuration file
 * @throws Error with error message
 */
export const validateConfigFile = (data: unknown): ConfigFile => {
  try {
    return configFileSchema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Invalid configuration file: ${error.errors.map((e) => e.message).join(", ")}`,
      )
    }
    throw error
  }
}
