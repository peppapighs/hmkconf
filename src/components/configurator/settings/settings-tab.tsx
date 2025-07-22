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

import { useBootloader } from "@/api/use-bootloader"
import { useFactoryReset } from "@/api/use-factory-reset"
import { useReboot } from "@/api/use-reboot"
import { useDevice } from "@/components/providers/device-provider"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ExportButton } from "./export-button"
import { ImportButton } from "./import-button"

export function SettingsTab() {
  const { isDemo } = useDevice()

  const { mutate: reboot } = useReboot()
  const { mutate: bootloader } = useBootloader()
  const { mutate: factoryReset } = useFactoryReset()

  return (
    <ScrollArea className="flex-1">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 p-4">
        <div className="flex flex-col">
          <h3 className="text-lg font-semibold leading-none tracking-tight">
            Export/Import Settings
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Export your current keyboard configuration as a JSON file or import previously saved settings.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <ExportButton />
            <ImportButton />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            <span className="font-medium">Tip:</span> Exported configuration files can be shared with other users or used as backups.
          </p>
        </div>
        
        <div className="flex flex-col">
          <p className="font-semibold leading-none tracking-tight">
            Restart Device
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Restart the device. No changes are made to the device configuration.
          </p>
          <div className="mt-3">
            <Button
              disabled={isDemo}
              variant="outline"
              onClick={() => reboot()}
            >
              Restart Device
            </Button>
          </div>
        </div>
        <div className="flex flex-col">
          <p className="font-semibold leading-none tracking-tight">
            Enter Bootloader
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Restart the device and enter the bootloader. If the bootloader is
            not configured in the device firmware, nothing will happen.
          </p>
          <div className="mt-3">
            <Button
              disabled={isDemo}
              variant="outline"
              onClick={() => bootloader()}
            >
              Enter Bootloader
            </Button>
          </div>
        </div>
        <div className="flex flex-col">
          <p className="font-semibold leading-none tracking-tight">
            Factory Reset
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Revert the device configuration to the default settings defined in
            the firmware.
          </p>
          <div className="mt-3">
            <Dialog>
              <DialogTrigger disabled={isDemo} asChild>
                <Button variant="destructive">Factory Reset</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Factory Reset?</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to reset the device to its default
                    settings? All changes will be lost and cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose
                    className={buttonVariants({
                      variant: "outline",
                      size: "sm",
                    })}
                  >
                    Cancel
                  </DialogClose>
                  <DialogClose
                    className={buttonVariants({
                      variant: "destructive",
                      size: "sm",
                    })}
                    onClick={() => factoryReset()}
                  >
                    Factory Reset
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </ScrollArea>
  )
}
