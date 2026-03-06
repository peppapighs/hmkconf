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

import { DataViewReader } from "$lib/data-view-reader"
import { uint16ToUInt8s } from "$lib/integer"
import type { SetCalibrationParams } from "$lib/keyboard"
import type { Commander } from "$lib/keyboard/commander"
import { HMK_Command } from "."
import type { HMK_Calibration } from ".."

export async function recalibrate(commander: Commander) {
  await commander.sendCommand({ command: HMK_Command.RECALIBRATE })
}

export async function getCalibration(
  commander: Commander,
): Promise<HMK_Calibration> {
  const reader = new DataViewReader(
    await commander.sendCommand({ command: HMK_Command.GET_CALIBRATION }),
  )

  return {
    initialRestValue: reader.uint16(),
    initialBottomOutThreshold: reader.uint16(),
  }
}

export async function setCalibration(
  commander: Commander,
  {
    data: { initialRestValue, initialBottomOutThreshold },
  }: SetCalibrationParams,
) {
  await commander.sendCommand({
    command: HMK_Command.SET_CALIBRATION,
    payload: [
      ...uint16ToUInt8s(initialRestValue),
      ...uint16ToUInt8s(initialBottomOutThreshold),
    ],
  })
}

export async function saveCalibrationThreshold(commander: Commander) {
  await commander.sendCommand({
    command: HMK_Command.SAVE_CALIBRATION_THRESHOLD,
    payload: [],
  })
}
