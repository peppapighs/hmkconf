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

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ConfigFile } from "@/api/use-export-config"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useEffect, useState } from "react"
import { AlertCircle, AlertTriangle, Check, FileWarning, Loader2, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export interface CompatibilityIssue {
  type: "device" | "firmware" | "settings"
  severity: "warning" | "error"
  message: string
}

export interface CompatibilityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  configFile: ConfigFile
  issues: CompatibilityIssue[]
  onContinue: (selectedSettings: string[]) => void
  onCancel: () => void
  currentDeviceName: string
  currentFirmwareVersion: string
  isApplying?: boolean
}

export function CompatibilityDialog({
  open,
  onOpenChange,
  configFile,
  issues,
  onContinue,
  onCancel,
  currentDeviceName,
  currentFirmwareVersion,
  isApplying = false,
}: CompatibilityDialogProps) {
  // State for selective import
  const [selectedSettings, setSelectedSettings] = useState<string[]>([])
  const [selectAllChecked, setSelectAllChecked] = useState(false)

  // Initialize selected settings when dialog opens
  useEffect(() => {
    if (open) {
      // Check if this is the new format (with profiles support)
      if (configFile.profiles) {
        // If profile data exists, select "profiles"
        const availableSettings = ["profiles"]
        
        // Add calibration data if it exists
        if (configFile.settings && configFile.settings.calibration) {
          availableSettings.push("calibration")
        }
        
        setSelectedSettings(availableSettings)
        setSelectAllChecked(true)
      } else {
        // Legacy format processing
        const availableSettings = [
          "keymap",
          "actuationMap",
          "advancedKeys",
          "tickRate",
          "calibration",
        ].filter(setting => configFile.settings[setting as keyof typeof configFile.settings] !== undefined)
        
        setSelectedSettings(availableSettings)
        setSelectAllChecked(true)
      }
    }
  }, [open, configFile])

  // Toggle setting selection
  const toggleSetting = (setting: string) => {
    setSelectedSettings(prev => {
      const newSettings = prev.includes(setting)
        ? prev.filter(s => s !== setting)
        : [...prev, setting]
      
      // Update select all state
      const availableSettings = Object.keys(configFile.settings)
        .filter(key => configFile.settings[key as keyof typeof configFile.settings] !== undefined)
      
      setSelectAllChecked(newSettings.length === availableSettings.length)
      
      return newSettings
    })
  }

  // Toggle all settings
  const toggleAllSettings = () => {
    // Check if this is the new format (with profiles support)
    if (configFile.profiles) {
      // If profile data exists
      const availableSettings = ["profiles"]
      
      // Add calibration data if it exists
      if (configFile.settings && configFile.settings.calibration) {
        availableSettings.push("calibration")
      }
      
      if (selectAllChecked) {
        setSelectedSettings([])
        setSelectAllChecked(false)
      } else {
        setSelectedSettings(availableSettings)
        setSelectAllChecked(true)
      }
    } else {
      // Legacy format processing
      const availableSettings = Object.keys(configFile.settings)
        .filter(key => configFile.settings[key as keyof typeof configFile.settings] !== undefined)
      
      if (selectAllChecked) {
        setSelectedSettings([])
        setSelectAllChecked(false)
      } else {
        setSelectedSettings(availableSettings)
        setSelectAllChecked(true)
      }
    }
  }

  // Check if there are any critical errors
  const hasErrors = issues.some(issue => issue.severity === "error")
  
  // Count warnings and errors
  const errorCount = issues.filter(issue => issue.severity === "error").length
  const warningCount = issues.filter(issue => issue.severity === "warning").length

  // Get setting display name
  const getSettingDisplayName = (key: string): string => {
    switch (key) {
      case "keymap": return "Keymap";
      case "actuationMap": return "Actuation Settings";
      case "advancedKeys": return "Advanced Key Settings";
      case "tickRate": return "Tick Rate";
      case "calibration": return "Calibration";
      case "profiles": return "All Profiles (0-4)";
      default: return key;
    }
  }

  // Handle keyboard accessibility
  const handleKeyDown = (e: React.KeyboardEvent, setting: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      toggleSetting(setting)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileWarning className="h-5 w-5 text-amber-500" />
            Compatibility Check
            {(errorCount > 0 || warningCount > 0) && (
              <div className="flex items-center gap-1 ml-2">
                {errorCount > 0 && (
                  <Badge variant="destructive" className="h-6">
                    {errorCount} {errorCount === 1 ? "Error" : "Errors"}
                  </Badge>
                )}
                {warningCount > 0 && (
                  <Badge variant="outline" className="h-6 border-amber-500 text-amber-500">
                    {warningCount} {warningCount === 1 ? "Warning" : "Warnings"}
                  </Badge>
                )}
              </div>
            )}
          </DialogTitle>
          <DialogDescription>
            Review compatibility issues and select which settings to import.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <div className="mb-4 rounded-md border p-3 bg-muted/30">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <div className="font-medium col-span-2 mb-1">Configuration Comparison:</div>
              
              <div className="text-muted-foreground">Config File Device:</div>
              <div className="font-medium">{configFile.deviceInfo.name}</div>
              
              <div className="text-muted-foreground">Current Device:</div>
              <div className="font-medium">{currentDeviceName}</div>
              
              <div className="text-muted-foreground">Config File Firmware:</div>
              <div className="font-medium">v{configFile.deviceInfo.firmwareVersion}</div>
              
              <div className="text-muted-foreground">Current Firmware:</div>
              <div className="font-medium">v{currentFirmwareVersion}</div>
            </div>
          </div>

          {issues.length > 0 && (
            <div className="mb-4">
              <h4 className="mb-2 font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Compatibility Issues:
              </h4>
              <ScrollArea className="h-[120px] rounded-md border p-2">
                <ul className="space-y-2">
                  {issues.map((issue, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      {issue.severity === "error" ? (
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-destructive" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-500" />
                      )}
                      <span className={issue.severity === "error" ? "text-destructive" : "text-amber-500"}>
                        <span className="font-medium">
                          {issue.type === "device" && "Device Mismatch: "}
                          {issue.type === "firmware" && "Firmware Issue: "}
                          {issue.type === "settings" && "Settings Problem: "}
                        </span>
                        {issue.message}
                      </span>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </div>
          )}

          {!hasErrors && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Select settings to import:</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={toggleAllSettings}
                  className="h-8 text-xs"
                >
                  {selectAllChecked ? "Deselect All" : "Select All"}
                </Button>
              </div>
              
              <div className="space-y-2 rounded-md border p-2">
                {/* Check if this is the new format (with profiles support) */}
                {configFile.profiles ? (
                  // If profile data exists
                  <>
                    {/* Profile settings */}
                    <div 
                      className={`flex items-center gap-2 rounded-md ${selectedSettings.includes("profiles") ? 'bg-primary/10' : ''}`}
                    >
                      <Button
                        type="button"
                        variant={selectedSettings.includes("profiles") ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleSetting("profiles")}
                        onKeyDown={(e) => handleKeyDown(e, "profiles")}
                        className="w-full justify-start"
                        aria-pressed={selectedSettings.includes("profiles")}
                        role="checkbox"
                      >
                        {selectedSettings.includes("profiles") ? (
                          <Check className="mr-2 h-4 w-4" />
                        ) : (
                          <div className="mr-2 h-4 w-4 rounded-sm border" />
                        )}
                        All Profiles (0-4)
                      </Button>
                    </div>
                    
                    {/* Calibration settings (if they exist) */}
                    {configFile.settings && configFile.settings.calibration && (
                      <div 
                        className={`flex items-center gap-2 rounded-md ${selectedSettings.includes("calibration") ? 'bg-primary/10' : ''}`}
                      >
                        <Button
                          type="button"
                          variant={selectedSettings.includes("calibration") ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleSetting("calibration")}
                          onKeyDown={(e) => handleKeyDown(e, "calibration")}
                          className="w-full justify-start"
                          aria-pressed={selectedSettings.includes("calibration")}
                          role="checkbox"
                        >
                          {selectedSettings.includes("calibration") ? (
                            <Check className="mr-2 h-4 w-4" />
                          ) : (
                            <div className="mr-2 h-4 w-4 rounded-sm border" />
                          )}
                          Calibration
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  // Legacy format processing
                  Object.entries(configFile.settings).map(([key, value]) => {
                    if (value === undefined) return null
                    const isSelected = selectedSettings.includes(key)
                    
                    return (
                      <div 
                        key={key} 
                        className={`flex items-center gap-2 rounded-md ${isSelected ? 'bg-primary/10' : ''}`}
                      >
                        <Button
                          type="button"
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleSetting(key)}
                          onKeyDown={(e) => handleKeyDown(e, key)}
                          className="w-full justify-start"
                          aria-pressed={isSelected}
                          role="checkbox"
                        >
                          {isSelected ? (
                            <Check className="mr-2 h-4 w-4" />
                          ) : (
                            <div className="mr-2 h-4 w-4 rounded-sm border" />
                          )}
                          {getSettingDisplayName(key)}
                        </Button>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button 
            variant="outline" 
            onClick={onCancel} 
            disabled={isApplying}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button 
            onClick={() => onContinue(selectedSettings)} 
            disabled={hasErrors || selectedSettings.length === 0 || isApplying}
            className="w-full sm:w-auto"
          >
            {hasErrors ? (
              <span className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Cannot Import
              </span>
            ) : isApplying ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Applying...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4" />
                Import Selected
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}