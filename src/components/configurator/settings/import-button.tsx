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
import { Button } from "@/components/ui/button"
import { useDevice } from "@/components/providers/device-provider"
import { Loader2, Upload, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { CompatibilityDialog } from "./compatibility-dialog"
import { useToast } from "@/components/ui/use-toast"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"

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
    getCurrentFirmwareVersion
  } = useImportConfig()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [currentFirmwareVersion, setCurrentFirmwareVersion] = useState<string>("Unknown")
  const [isHovered, setIsHovered] = useState(false)
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)
  const { toast } = useToast()
  const [importCancellable, setImportCancellable] = useState(false)
  const [importToastId, setImportToastId] = useState<string | null>(null)

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

  // Import process state management
  useEffect(() => {
    if (!isImporting) {
      setImportCancellable(false)
      setImportToastId(null)
    }
  }, [isImporting])

  const handleImportClick = () => {
    // Trigger file selection dialog
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    setSelectedFileName(file.name)

    try {
      // Create a unique ID for the progress toast
      const toastId = `import-progress-${Date.now()}`

      // Show initial toast for starting import
      toast({
        id: toastId,
        title: "Importing Configuration",
        description: `Reading file: ${file.name}`,
      })

      setImportToastId(toastId)
      setImportCancellable(true)

      await importConfig(file)

      // Reset file input to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error) {
      console.error("Import error:", error)

      toast({
        title: "Import Failed",
        description: "An unexpected error occurred during import. Please try again.",
        variant: "destructive",
      })

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleCancelImport = () => {
    if (importCancellable && importToastId) {
      // Dismiss the current toast
      toast({
        title: "Import Cancelled",
        description: "Configuration import was cancelled by user",
      })

      // Reset state
      setImportCancellable(false)
      setImportToastId(null)
      setSelectedFileName(null)

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }

      // Call the cancel handler from the hook
      handleCompatibilityCancel()
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
                aria-label={isImporting ? "Importing configuration..." : "Import configuration"}
              >
                {isImporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    Import
                    <Upload className={`ml-2 h-4 w-4 transition-transform ${isHovered ? 'translate-y-[-2px]' : ''}`} />
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
        {importCancellable && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCancelImport}
                  className="h-9 w-9 rounded-full"
                  aria-label="Cancel import"
                >
                  <X className="h-4 w-4" />
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