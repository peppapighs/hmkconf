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

"use client"

import { useGetAKC } from "@/api/use-get-akc"
import { useConfigurator } from "@/components/providers/configurator-provider"
import { Button } from "@/components/ui/button"
import { AKC_TYPE_TO_METADATA } from "@/constants/devices"
import { DeviceAKC, DeviceAKCMetadata, DeviceAKCType } from "@/types/devices"
import { createContext, useContext, useLayoutEffect } from "react"
import { KeyboardEditorLayout } from "../common/keyboard-editor"
import { AKCDeleteDialog } from "./akc-delete-dialog"
import { DynamicKeystrokeEditor } from "./dynamic-keystroke-editor"
import { Loader } from "./loader"
import { NullBindEditor } from "./null-bind-editor"
import { TapHoldEditor } from "./tap-hold-editor"
import { ToggleEditor } from "./toggle-editor"

type AdvancedKeysEditorState = {
  akc: DeviceAKC[]
  akcMetadata: DeviceAKCMetadata
  akcIndex: number
}

const AdvancedKeysEditorContext = createContext<AdvancedKeysEditorState>(
  {} as AdvancedKeysEditorState,
)

export const useAdvancedKeysEditor = () => useContext(AdvancedKeysEditorContext)

export function AdvancedKeysEditor() {
  const {
    profileNum,
    advancedKeys: { akcIndex, setAKCIndex },
  } = useConfigurator()

  const { isSuccess, data: akc } = useGetAKC(profileNum)

  const disabled =
    !isSuccess ||
    akcIndex === null ||
    akcIndex >= akc.length ||
    akc[akcIndex].akc.type === DeviceAKCType.AKC_NONE

  useLayoutEffect(() => {
    if (disabled) {
      setAKCIndex(null)
    }
  }, [disabled, setAKCIndex])

  if (disabled) {
    return <Loader />
  }

  const currentAKC = akc[akcIndex]
  const akcMetadata = AKC_TYPE_TO_METADATA[currentAKC.akc.type]

  return (
    <KeyboardEditorLayout>
      <div className="mx-auto flex w-full max-w-5xl flex-col p-4">
        <div className="flex items-center justify-between gap-4">
          <p className="font-semibold leading-none tracking-tight">
            {akcMetadata.name}
          </p>
          <div className="flex items-center gap-2">
            <AKCDeleteDialog akcIndex={akcIndex}>
              <Button variant="destructive" size="sm">
                Delete
              </Button>
            </AKCDeleteDialog>
            <Button size="sm" onClick={() => setAKCIndex(null)}>
              Done
            </Button>
          </div>
        </div>
        <div className="mt-4 flex w-full flex-col">
          <AdvancedKeysEditorContext.Provider
            value={{
              akc,
              akcMetadata,
              akcIndex,
            }}
          >
            {akcMetadata.type === DeviceAKCType.AKC_NULL_BIND ? (
              <NullBindEditor />
            ) : akcMetadata.type === DeviceAKCType.AKC_DKS ? (
              <DynamicKeystrokeEditor />
            ) : akcMetadata.type === DeviceAKCType.AKC_TAP_HOLD ? (
              <TapHoldEditor />
            ) : akcMetadata.type === DeviceAKCType.AKC_TOGGLE ? (
              <ToggleEditor />
            ) : (
              <></>
            )}
          </AdvancedKeysEditorContext.Provider>
        </div>
      </div>
    </KeyboardEditorLayout>
  )
}
