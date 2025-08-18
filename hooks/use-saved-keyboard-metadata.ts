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

import { useLocalStorage } from "usehooks-ts"
import z from "zod"

import { SAVED_KEYBOARD_METADATA_KEY } from "@/constants/keyboard"
import {
  KeyboardMetadata,
  keyboardMetadataSchema,
} from "@/types/keyboard/metadata"

export function useSavedKeyboardMetadata() {
  const [savedMetadata, setSavedMetadata] = useLocalStorage(
    SAVED_KEYBOARD_METADATA_KEY,
    [],
    {
      initializeWithValue: false,
      serializer: JSON.stringify,
      deserializer: (value: string) => {
        try {
          const json = JSON.parse(value)
          return z.array(keyboardMetadataSchema).parse(json)
        } catch (err) {
          console.error(`Failed to retrieve saved keyboard metadata: ${err}`)
          return []
        }
      },
    },
  )

  const addMetadata = (metadata: KeyboardMetadata) => {
    if (
      savedMetadata.some(
        ({ vendorId, productId }) =>
          vendorId === metadata.vendorId && productId === metadata.productId,
      )
    ) {
      throw new Error(
        "A keyboard with this vendor and product ID already exists",
      )
    }

    setSavedMetadata([...savedMetadata, metadata])
  }

  const removeMetadata = (index: number) => {
    setSavedMetadata(savedMetadata.filter((_, i) => i !== index))
  }

  return { savedMetadata, addMetadata, removeMetadata }
}
