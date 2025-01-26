"use client"

import { useGetAKC } from "@/api/use-get-akc"
import { useConfigurator } from "@/components/providers/configurator-provider"
import { Button } from "@/components/ui/button"
import { AKC_TYPE_TO_METADATA } from "@/constants/devices"
import { DeviceAKCType } from "@/types/devices"
import { useLayoutEffect } from "react"
import { KeyboardEditorLayout } from "../common/keyboard-editor"
import { AKCDeleteDialog } from "./akc-delete-dialog"
import { Loader } from "./loader"

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
          {akcMetadata.type === DeviceAKCType.AKC_NULL_BIND ? (
            <></>
          ) : akcMetadata.type === DeviceAKCType.AKC_DKS ? (
            <></>
          ) : akcMetadata.type === DeviceAKCType.AKC_TAP_HOLD ? (
            <></>
          ) : akcMetadata.type === DeviceAKCType.AKC_TOGGLE ? (
            <></>
          ) : (
            <></>
          )}
        </div>
      </div>
    </KeyboardEditorLayout>
  )
}
