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

import { HE60_METADATA } from "@/constants/dummy-metadata"
import { useSavedKeyboardMetadata } from "@/hooks/use-saved-keyboard-metadata"

import { useMetadataEditor } from "."
import { KeyboardEditorKeyboard } from "../common/keyboard-editor"
import { KeyButton } from "../configurator/common/key-button"

const { layout: DEFAULT_LAYOUT } = HE60_METADATA

export function MetadataEditorKeyboard() {
  const { savedMetadata } = useSavedKeyboardMetadata()
  const { index } = useMetadataEditor()

  return (
    <KeyboardEditorKeyboard
      layout={index === null ? DEFAULT_LAYOUT : savedMetadata[index].layout}
      keyGenerator={(key) => (
        <KeyButton disabled={index === null}>
          <span>{key}</span>
        </KeyButton>
      )}
    />
  )
}
