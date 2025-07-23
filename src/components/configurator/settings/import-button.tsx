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

import { useImportConfig } from "@/api/use-import-config"
import { useDevice } from "@/components/providers/device-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Loader2, Upload, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { CompatibilityDialog } from "./compatibility-dialog"

export function ImportButton() {
  const device = useDevice()
  const {
    importConfig,
    isImporting,
    showCompatibilityDialog,
    currentConfigFile,
    compatibilityIssues,
    handleCompatibilityContinue,
    handleCompatibilityCancel,
    getCurrentFirmwareVersion,
    cancelImport,
    isCancelling,
  } = useImportConfig()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [currentFirmwareVersion, setCurrentFirmwareVersion] =
    useState<string>("Unknown")
  const [isHovered, setIsHovered] = useState(false)
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)
  const [currentToastId, setCurrentToastId] = useState<string | null>(null)

  // Get current firmware version
  useEffect(() => {
    const fetchFirmwareVersion = async () => {
      if (device) {
        const version = await getCurrentFirmwareVersion()
        setCurrentFirmwareVersion(version)
      }
    }

    fetchFirmwareVersion()
  }, [device, getCurrentFirmwareVersion])

  const handleImportClick = () => {
    // Trigger file selection dialog
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    setSelectedFileName(file.name)

    // Generate a unique toast ID
    const toastId = `import-${file.name.replace(/\s+/g, '-')}-${Date.now()}`
    setCurrentToastId(toastId)

    try {
      // Display initial toast
      toast.loading(`Reading file: ${file.name}`, {
        id: toastId,
        description: "Importing Configuration",
      })

      // Execute import process using TanStack Query mutation (passing the toast ID)
      await importConfig(file, toastId)

      // Reset file input to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error) {
      console.error("Import error:", error)

      // Display error toast (using the same ID)
      toast.error(
        "An unexpected error occurred during import. Please try again.",
        {
          id: toastId,
          description: "Import Failed",
        },
      )

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      
      // Reset toast ID
      setCurrentToastId(null)
    }
  }

  const handleCancelImport = () => {
    if (isImporting) {
      // Execute cancellation process
      cancelImport()

      // Display cancellation toast (using the same ID)
      if (currentToastId) {
        toast.info("Cancelling import process...", {
          id: currentToastId,
        })
      }

      // Reset file selection
      setSelectedFileName(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
        aria-label="Select configuration file to import"
      />

      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                disabled={device.isDemo || isImporting}
                variant="outline"
                onClick={handleImportClick}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="relative transition-all hover:bg-primary/10"
                aria-label={
                  isImporting
                    ? "Importing configuration..."
                    : "Import configuration"
                }
              >
                {isImporting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    Import
                    <Upload
                      className={`ml-2 size-4 transition-transform ${isHovered ? "translate-y-[-2px]" : ""}`}
                    />
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Load keyboard configuration from a file</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Cancel button - only shown during import */}
        {isImporting && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCancelImport}
                  className="size-9 rounded-full"
                  aria-label="Cancel import"
                  disabled={isCancelling}
                >
                  <X className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Cancel import</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Selected file name badge */}
        {selectedFileName && !isImporting && (
          <Badge variant="outline" className="ml-2 max-w-[150px] truncate">
            {selectedFileName}
          </Badge>
        )}
      </div>

      {/* Compatibility check dialog */}
      {currentConfigFile && (
        <CompatibilityDialog
          open={showCompatibilityDialog}
          onOpenChange={(open) => {
            if (!open) handleCompatibilityCancel()
          }}
          configFile={currentConfigFile}
          issues={compatibilityIssues}
          onContinue={handleCompatibilityContinue}
          onCancel={handleCompatibilityCancel}
          currentDeviceName={device.metadata?.name || "Unknown"}
          currentFirmwareVersion={currentFirmwareVersion}
          isApplying={isImporting}
        />
      )}
    </>
  )
}
