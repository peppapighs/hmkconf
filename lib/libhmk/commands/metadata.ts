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

import z from "zod"

import { HMKKeyboardState } from "@/hooks/use-hmk-keyboard"
import { uInt32ToUInt8s } from "@/lib/utils"
import { keyboardMetadataSchema } from "@/types/keyboard/metadata"
import { HMKCommand } from "@/types/libhmk"

const GET_METADATA_MAX_ENTRIES = 59

export async function getMetadata({ device }: HMKKeyboardState) {
  const response = await device.sendCommand({
    command: HMKCommand.GET_METADATA,
    payload: [...uInt32ToUInt8s(0)],
  })

  const length = response.getUint32(0, true)
  const compressedMetadata = new Uint8Array(length)

  let offset = Math.min(length, GET_METADATA_MAX_ENTRIES)
  compressedMetadata.set(new Uint8Array(response.buffer, 4, offset))

  while (offset < length) {
    const chunkSize = Math.min(length - offset, GET_METADATA_MAX_ENTRIES)
    const chunk = await device.sendCommand({
      command: HMKCommand.GET_METADATA,
      payload: [...uInt32ToUInt8s(offset)],
    })

    compressedMetadata.set(new Uint8Array(chunk.buffer, 4, chunkSize), offset)
    offset += chunkSize
  }

  try {
    const stream = new ReadableStream<ArrayBuffer>({
      pull: (controller) => {
        controller.enqueue(compressedMetadata.buffer)
        controller.close()
      },
    })
    const ds = new DecompressionStream("gzip")
    const uncompressedMetadata = stream.pipeThrough(ds)

    return keyboardMetadataSchema.parse(
      JSON.parse(await new Response(uncompressedMetadata).text()),
    )
  } catch (err) {
    if (err instanceof SyntaxError) {
      throw new Error("Keyboard metadata is not a valid JSON.")
    } else if (err instanceof z.ZodError) {
      console.error(z.treeifyError(err))
      throw new Error(
        "Keyboard metadata is not valid. See console for details.",
      )
    } else {
      throw err
    }
  }
}
