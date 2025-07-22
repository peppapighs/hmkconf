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

import { useDevice } from "@/components/providers/device-provider"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { ConfigFile } from "./use-export-config"
import { CompatibilityIssue } from "@/components/configurator/settings/compatibility-dialog"

export function useImportConfig() {
  const { toast } = useToast()
  const device = useDevice()
  const [isImporting, setIsImporting] = useState(false)
  const [showCompatibilityDialog, setShowCompatibilityDialog] = useState(false)
  const [currentConfigFile, setCurrentConfigFile] = useState<ConfigFile | null>(null)
  const [compatibilityIssues, setCompatibilityIssues] = useState<CompatibilityIssue[]>([])

  // Function to validate configuration file
  const validateConfigFile = (config: any): config is ConfigFile => {
    try {
      // Check if the file has the required structure
      if (!config || typeof config !== "object") {
        console.error("Config is not an object")
        toast({
          title: "Invalid Configuration File",
          description: "The file does not contain a valid configuration object.",
          variant: "destructive",
        })
        return false
      }

      if (typeof config.version !== "string") {
        console.error("Missing or invalid version")
        toast({
          title: "Invalid Configuration File",
          description: "The file is missing a valid version identifier.",
          variant: "destructive",
        })
        return false
      }

      if (typeof config.timestamp !== "string") {
        console.error("Missing or invalid timestamp")
        toast({
          title: "Invalid Configuration File",
          description: "The file is missing a valid timestamp.",
          variant: "destructive",
        })
        return false
      }

      // Check device info
      if (!config.deviceInfo || typeof config.deviceInfo !== "object") {
        console.error("Missing or invalid deviceInfo")
        toast({
          title: "Invalid Configuration File",
          description: "The file is missing device information.",
          variant: "destructive",
        })
        return false
      }

      if (typeof config.deviceInfo.name !== "string") {
        console.error("Missing or invalid device name")
        toast({
          title: "Invalid Configuration File",
          description: "The file is missing a valid device name.",
          variant: "destructive",
        })
        return false
      }

      if (typeof config.deviceInfo.firmwareVersion !== "string" &&
        typeof config.deviceInfo.firmwareVersion !== "number") {
        console.error("Missing or invalid firmware version")
        toast({
          title: "Invalid Configuration File",
          description: "The file is missing a valid firmware version.",
          variant: "destructive",
        })
        return false
      }

      if (typeof config.deviceInfo.deviceId !== "string") {
        console.error("Missing or invalid device ID")
        toast({
          title: "Invalid Configuration File",
          description: "The file is missing a valid device ID.",
          variant: "destructive",
        })
        return false
      }

      // Check for new format (with profiles support)
      if (config.profiles) {
        if (typeof config.profiles !== "object") {
          console.error("Invalid profiles format")
          toast({
            title: "Invalid Configuration File",
            description: "The profiles data is not in the correct format.",
            variant: "destructive",
          })
          return false
        }

        // Check if there is at least one profile
        const profileIds = Object.keys(config.profiles)
        if (profileIds.length === 0) {
          console.error("No profiles found")
          toast({
            title: "Invalid Configuration File",
            description: "The file does not contain any profile data.",
            variant: "destructive",
          })
          return false
        }

        // Check the contents of each profile
        for (const profileId of profileIds) {
          const profile = config.profiles[profileId]

          // Verify that the profile is not empty
          if (!profile || typeof profile !== "object" || Object.keys(profile).length === 0) {
            console.error(`Empty profile ${profileId}`)
            toast({
              title: "Invalid Configuration File",
              description: `Profile ${profileId} is empty or invalid.`,
              variant: "destructive",
            })
            return false
          }

          // Check keymap (if it exists)
          if (profile.keymap !== undefined) {
            if (!Array.isArray(profile.keymap)) {
              console.error(`Invalid keymap format in profile ${profileId}`)
              toast({
                title: "Invalid Configuration File",
                description: `Keymap data in profile ${profileId} is not in the correct format.`,
                variant: "destructive",
              })
              return false
            }

            // Verify that the keymap is not empty
            if (profile.keymap.length === 0) {
              console.error(`Empty keymap in profile ${profileId}`)
              toast({
                title: "Invalid Configuration File",
                description: `Keymap data in profile ${profileId} is empty.`,
                variant: "destructive",
              })
              return false
            }

            // Check keys in each layer
            for (let i = 0; i < profile.keymap.length; i++) {
              if (!Array.isArray(profile.keymap[i]) || profile.keymap[i].length === 0) {
                console.error(`Invalid or empty keymap layer ${i} in profile ${profileId}`)
                toast({
                  title: "Invalid Configuration File",
                  description: `Keymap layer ${i + 1} in profile ${profileId} is invalid or empty.`,
                  variant: "destructive",
                })
                return false
              }
            }
          }
        }

        // Check global settings
        if (config.settings && typeof config.settings !== "object") {
          console.error("Invalid global settings format")
          toast({
            title: "Invalid Configuration File",
            description: "The global settings data is not in the correct format.",
            variant: "destructive",
          })
          return false
        }

        return true
      }

      // Check legacy format (for backward compatibility)
      if (!config.settings || typeof config.settings !== "object") {
        console.error("Missing or invalid settings")
        toast({
          title: "Invalid Configuration File",
          description: "The file is missing valid keyboard settings.",
          variant: "destructive",
        })
        return false
      }

      // Check if any settings are present
      const hasAnySettings = [
        "keymap",
        "actuationMap",
        "advancedKeys",
        "tickRate",
        "calibration"
      ].some(key => config.settings[key] !== undefined)

      if (!hasAnySettings) {
        console.error("No valid settings found")
        toast({
          title: "Invalid Configuration File",
          description: "The file does not contain any valid keyboard settings.",
          variant: "destructive",
        })
        return false
      }

      // Optional settings validation
      if (config.settings.keymap !== undefined) {
        if (!Array.isArray(config.settings.keymap)) {
          console.error("Invalid keymap format")
          toast({
            title: "Invalid Configuration File",
            description: "The keymap data is not in the correct format.",
            variant: "destructive",
          })
          return false
        }

        // Check if keymap is empty
        if (config.settings.keymap.length === 0) {
          console.error("Empty keymap")
          toast({
            title: "Invalid Configuration File",
            description: "The keymap data is empty.",
            variant: "destructive",
          })
          return false
        }

        // Check if all layers have keys
        for (let i = 0; i < config.settings.keymap.length; i++) {
          if (!Array.isArray(config.settings.keymap[i]) || config.settings.keymap[i].length === 0) {
            console.error(`Invalid or empty keymap layer ${i}`)
            toast({
              title: "Invalid Configuration File",
              description: `Keymap layer ${i + 1} is invalid or empty.`,
              variant: "destructive",
            })
            return false
          }
        }
      }

      // All checks passed
      return true
    } catch (error) {
      console.error("Validation error:", error)
      toast({
        title: "Configuration File Error",
        description: "An error occurred while validating the configuration file.",
        variant: "destructive",
      })
      return false
    }
  }

  // Function to check compatibility between config file and current device
  const checkCompatibility = async (configFile: ConfigFile): Promise<CompatibilityIssue[]> => {
    const issues: CompatibilityIssue[] = []

    if (!device) {
      issues.push({
        type: "device",
        severity: "error",
        message: "No device connected."
      })
      return issues
    }

    // Device type compatibility check
    if (configFile.deviceInfo.name !== device.metadata.name) {
      issues.push({
        type: "device",
        severity: "warning",
        message: `Config file is for ${configFile.deviceInfo.name}, but current device is ${device.metadata.name}.`
      })

      // Additional check for device-specific features
      if (device.metadata.numKeys !== undefined) {
        // Check if this is the new format (with profiles support)
        if (configFile.profiles) {
          // Check keymap for each profile
          for (const profileId in configFile.profiles) {
            const profile = configFile.profiles[profileId]
            if (profile.keymap && profile.keymap[0] &&
              profile.keymap[0].length > device.metadata.numKeys) {
              issues.push({
                type: "device",
                severity: "error",
                message: `Profile ${profileId}: Source device has more keys (${profile.keymap[0].length}) than current device (${device.metadata.numKeys}).`
              })
              break // Exit after showing warning if any issue is found
            }
          }
        } else if (configFile.settings.keymap &&
          configFile.settings.keymap[0] &&
          configFile.settings.keymap[0].length > device.metadata.numKeys) {
          // For legacy format
          issues.push({
            type: "device",
            severity: "error",
            message: `Source device has more keys (${configFile.settings.keymap[0].length}) than current device (${device.metadata.numKeys}).`
          })
        }
      }
    }

    // Firmware version compatibility check
    try {
      const currentFirmwareVersion = await device.firmwareVersion()
      let configFirmwareVersion: number

      // Handle different version formats (string vs number)
      const firmwareVersionStr = String(configFile.deviceInfo.firmwareVersion)
      if (firmwareVersionStr.includes('.')) {
        // Handle semantic versioning (e.g., "1.2.3")
        const versionParts = firmwareVersionStr.split('.')
        configFirmwareVersion = parseInt(versionParts[0], 10)
      } else {
        // Handle numeric versioning
        configFirmwareVersion = parseInt(firmwareVersionStr, 10)
      }

      if (isNaN(configFirmwareVersion)) {
        issues.push({
          type: "firmware",
          severity: "warning",
          message: `Invalid firmware version format in config file: "${configFile.deviceInfo.firmwareVersion}".`
        })
      } else if (currentFirmwareVersion < configFirmwareVersion) {
        issues.push({
          type: "firmware",
          severity: "warning",
          message: `Config file is for firmware v${configFile.deviceInfo.firmwareVersion}, but current device has v${currentFirmwareVersion}. Some features may not be available.`
        })
      }
    } catch (error) {
      console.error("Failed to get firmware version:", error)
      issues.push({
        type: "firmware",
        severity: "warning",
        message: "Failed to get firmware version from device."
      })
    }

    // Settings compatibility check
    // Check if this is the new format (with profiles support)
    if (configFile.profiles) {
      // Check settings for each profile
      for (const profileId in configFile.profiles) {
        const profile = configFile.profiles[profileId]

        // Check keymap layer count
        if (profile.keymap && device.metadata.numLayers) {
          const configRows = profile.keymap.length
          const deviceLayers = device.metadata.numLayers

          if (configRows !== deviceLayers) {
            issues.push({
              type: "settings",
              severity: "error",
              message: `Profile ${profileId}: Keymap layer count mismatch (config file: ${configRows} layers, device: ${deviceLayers} layers).`
            })
          } else {
            // Check key count for each layer
            for (let i = 0; i < configRows; i++) {
              const configKeys = profile.keymap[i].length
              const deviceKeys = device.metadata.numKeys

              if (configKeys !== deviceKeys) {
                issues.push({
                  type: "settings",
                  severity: "error",
                  message: `Profile ${profileId}: Key count mismatch in layer ${i + 1} (config file: ${configKeys} keys, device: ${deviceKeys} keys).`
                })
                break
              }
            }
          }
        }

        // Check advanced key settings
        if (profile.advancedKeys && device.metadata.numAdvancedKeys) {
          const configAdvancedKeys = Array.isArray(profile.advancedKeys)
            ? profile.advancedKeys.length
            : Object.keys(profile.advancedKeys).length

          if (configAdvancedKeys > device.metadata.numAdvancedKeys) {
            issues.push({
              type: "settings",
              severity: "warning",
              message: `Profile ${profileId}: Advanced keys count exceeds device capacity (config file: ${configAdvancedKeys}, device: ${device.metadata.numAdvancedKeys}).`
            })
          }
        }
      }

      // Check profile count
      const configProfileCount = Object.keys(configFile.profiles).length
      if (configProfileCount > 5) { // There are 5 profiles (0-4)
        issues.push({
          type: "settings",
          severity: "warning",
          message: `Config file contains ${configProfileCount} profiles, but device supports only 5 profiles (0-4).`
        })
      }

      // Check if settings exist
      let hasAnySettings = false
      for (const profileId in configFile.profiles) {
        if (Object.keys(configFile.profiles[profileId]).length > 0) {
          hasAnySettings = true
          break
        }
      }

      if (!hasAnySettings && (!configFile.settings || !configFile.settings.calibration)) {
        issues.push({
          type: "settings",
          severity: "error",
          message: "Config file contains no valid settings to import."
        })
      }
    } else {
      // Compatibility check for legacy format
      // Keymap layers/keys check
      if (configFile.settings.keymap && device.metadata.numLayers) {
        const configRows = configFile.settings.keymap.length
        const deviceLayers = device.metadata.numLayers

        if (configRows !== deviceLayers) {
          issues.push({
            type: "settings",
            severity: "error",
            message: `Keymap layer count mismatch (config file: ${configRows} layers, device: ${deviceLayers} layers).`
          })
        } else {
          // Check key count for each layer
          for (let i = 0; i < configRows; i++) {
            const configKeys = configFile.settings.keymap[i].length
            const deviceKeys = device.metadata.numKeys

            if (configKeys !== deviceKeys) {
              issues.push({
                type: "settings",
                severity: "error",
                message: `Key count mismatch in layer ${i + 1} (config file: ${configKeys} keys, device: ${deviceKeys} keys).`
              })
              break
            }
          }
        }
      }

      // Advanced keys compatibility check
      if (configFile.settings.advancedKeys && device.metadata.numAdvancedKeys) {
        const configAdvancedKeys = Array.isArray(configFile.settings.advancedKeys)
          ? configFile.settings.advancedKeys.length
          : Object.keys(configFile.settings.advancedKeys).length

        if (configAdvancedKeys > device.metadata.numAdvancedKeys) {
          issues.push({
            type: "settings",
            severity: "warning",
            message: `Advanced keys count exceeds device capacity (config file: ${configAdvancedKeys}, device: ${device.metadata.numAdvancedKeys}).`
          })
        }
      }
    }

    // Check for missing settings in the config file
    let availableSettings: string[]

    if (configFile.profiles) {
      // For the new format
      availableSettings = ["profiles"]
      if (configFile.settings && configFile.settings.calibration) {
        availableSettings.push("calibration")
      }
    } else {
      // For legacy format
      availableSettings = Object.keys(configFile.settings).filter(
        key => configFile.settings[key as keyof typeof configFile.settings] !== undefined
      )
    }

    if (availableSettings.length === 0) {
      issues.push({
        type: "settings",
        severity: "error",
        message: "Config file contains no valid settings to import."
      })
    }

    return issues
  }

  // Flag to track if import should be cancelled
  const [cancelImport, setCancelImport] = useState(false)

  // Function to apply selected settings to device
  const applySettings = async (configFile: ConfigFile, selectedSettings: string[]): Promise<boolean> => {
    if (!device) {
      toast({
        title: "Import Error",
        description: "No device connected",
        variant: "destructive",
      })
      return false
    }

    // Reset cancel flag
    setCancelImport(false)

    try {
      setIsImporting(true)

      // Variables to track progress
      let totalSteps = selectedSettings.length
      let completedSteps = 0

      // Create a unique ID for the progress toast
      const progressToastId = `import-progress-${Date.now()}`

      // Initial progress toast
      toast({
        id: progressToastId,
        title: "Applying settings...",
        description: `Progress: ${completedSteps}/${totalSteps}`,
      })

      // Get current profile number with error handling
      let currentProfile
      try {
        currentProfile = await device.getProfile()
      } catch (profileError) {
        console.error("Failed to get current profile:", profileError)
        toast({
          title: "Import Warning",
          description: "Could not determine current profile. Using default profile 0.",
          variant: "warning",
        })
        currentProfile = 0
      }

      // Setting name mapping
      const settingNameMap: Record<string, string> = {
        keymap: "Keymap",
        actuationMap: "Actuation Settings",
        advancedKeys: "Advanced Key Settings",
        tickRate: "Tick Rate",
        calibration: "Calibration",
        profiles: "All Profiles"
      }

      // Check if this is the new format (with profiles support)
      const isNewFormat = configFile.profiles !== undefined

      // Apply selected settings in order
      for (const setting of selectedSettings) {
        // Check if import was cancelled
        if (cancelImport) {
          toast({
            title: "Import Cancelled",
            description: "Import process was cancelled by user",
          })
          return false
        }

        try {
          // Update progress toast
          toast({
            id: progressToastId,
            title: `Applying ${settingNameMap[setting] || setting}...`,
            description: `Progress: ${completedSteps}/${totalSteps}`,
          })

          // For the new format, apply settings for each profile
          if (isNewFormat && setting === "profiles") {
            // Apply settings for each profile
            for (const profileId in configFile.profiles) {
              const profileNum = parseInt(profileId, 10)
              const profileData = configFile.profiles[profileNum]

              // Display progress for each profile
              toast({
                id: progressToastId,
                title: `Applying Profile ${profileNum} Settings`,
                description: `Progress: ${completedSteps}/${totalSteps}`,
              })

              // Apply keymap
              if (profileData.keymap) {
                for (let layer = 0; layer < profileData.keymap.length; layer++) {
                  // Check for cancellation between layers
                  if (cancelImport) break

                  try {
                    await device.setKeymap(
                      profileNum,
                      layer,
                      0,
                      profileData.keymap[layer]
                    )
                  } catch (layerError) {
                    console.error(`Failed to apply keymap layer ${layer} for profile ${profileNum}:`, layerError)
                    toast({
                      title: "Import Warning",
                      description: `Failed to apply keymap layer ${layer} for profile ${profileNum}. Continuing with other settings.`,
                      variant: "warning",
                    })
                  }
                }
              }

              // Apply actuation settings
              if (profileData.actuationMap) {
                try {
                  await device.setActuationMap(
                    profileNum,
                    0,
                    profileData.actuationMap
                  )
                } catch (error) {
                  console.error(`Failed to apply actuation map for profile ${profileNum}:`, error)
                  toast({
                    title: "Import Warning",
                    description: `Failed to apply actuation settings for profile ${profileNum}. Continuing with other settings.`,
                    variant: "warning",
                  })
                }
              }

              // Apply advanced key settings
              if (profileData.advancedKeys) {
                try {
                  await device.setAdvancedKeys(
                    profileNum,
                    0,
                    profileData.advancedKeys
                  )
                } catch (error) {
                  console.error(`Failed to apply advanced keys for profile ${profileNum}:`, error)
                  toast({
                    title: "Import Warning",
                    description: `Failed to apply advanced key settings for profile ${profileNum}. Continuing with other settings.`,
                    variant: "warning",
                  })
                }
              }

              // Apply tick rate settings
              if (profileData.tickRate !== undefined) {
                try {
                  await device.setTickRate(
                    profileNum,
                    profileData.tickRate
                  )
                } catch (error) {
                  console.error(`Failed to apply tick rate for profile ${profileNum}:`, error)
                  toast({
                    title: "Import Warning",
                    description: `Failed to apply tick rate setting for profile ${profileNum}. Continuing with other settings.`,
                    variant: "warning",
                  })
                }
              }
            }

            // Apply global settings (calibration)
            if (configFile.settings && configFile.settings.calibration) {
              try {
                await device.setCalibration(configFile.settings.calibration)
              } catch (error) {
                console.error("Failed to apply calibration:", error)
                toast({
                  title: "Import Warning",
                  description: "Failed to apply calibration settings. Continuing with other settings.",
                  variant: "warning",
                })
              }
            }
          } else {
            // Legacy format processing
            switch (setting) {
              case "keymap":
                if (configFile.settings.keymap) {
                  // Apply each layer of keymap
                  for (let layer = 0; layer < configFile.settings.keymap.length; layer++) {
                    // Check for cancellation between layers
                    if (cancelImport) break

                    try {
                      await device.setKeymap(
                        currentProfile,
                        layer,
                        0,
                        configFile.settings.keymap[layer]
                      )
                    } catch (layerError) {
                      console.error(`Failed to apply keymap layer ${layer}:`, layerError)
                      toast({
                        title: "Import Warning",
                        description: `Failed to apply keymap layer ${layer}. Continuing with other settings.`,
                        variant: "warning",
                      })
                    }
                  }
                }
                break

              case "actuationMap":
                if (configFile.settings.actuationMap) {
                  try {
                    await device.setActuationMap(
                      currentProfile,
                      0,
                      configFile.settings.actuationMap
                    )
                  } catch (error) {
                    console.error("Failed to apply actuation map:", error)
                    toast({
                      title: "Import Warning",
                      description: "Failed to apply actuation settings. Continuing with other settings.",
                      variant: "warning",
                    })
                  }
                }
                break

              case "advancedKeys":
                if (configFile.settings.advancedKeys) {
                  try {
                    await device.setAdvancedKeys(
                      currentProfile,
                      0,
                      configFile.settings.advancedKeys
                    )
                  } catch (error) {
                    console.error("Failed to apply advanced keys:", error)
                    toast({
                      title: "Import Warning",
                      description: "Failed to apply advanced key settings. Continuing with other settings.",
                      variant: "warning",
                    })
                  }
                }
                break

              case "tickRate":
                if (configFile.settings.tickRate !== undefined) {
                  try {
                    await device.setTickRate(
                      currentProfile,
                      configFile.settings.tickRate
                    )
                  } catch (error) {
                    console.error("Failed to apply tick rate:", error)
                    toast({
                      title: "Import Warning",
                      description: "Failed to apply tick rate setting. Continuing with other settings.",
                      variant: "warning",
                    })
                  }
                }
                break

              case "calibration":
                if (configFile.settings.calibration) {
                  try {
                    await device.setCalibration(configFile.settings.calibration)
                  } catch (error) {
                    console.error("Failed to apply calibration:", error)
                    toast({
                      title: "Import Warning",
                      description: "Failed to apply calibration settings. Continuing with other settings.",
                      variant: "warning",
                    })
                  }
                }
                break
            }
          }

          // Count completed steps
          completedSteps++

          // Update progress toast
          toast({
            id: progressToastId,
            title: `Applied ${settingNameMap[setting] || setting}`,
            description: `Progress: ${completedSteps}/${totalSteps}`,
          })

          // Small delay to show progress
          await new Promise(resolve => setTimeout(resolve, 300))

        } catch (settingError) {
          console.error(`Failed to apply ${setting}:`, settingError)

          // Display error message but continue with other settings
          toast({
            title: "Settings Application Warning",
            description: `Error occurred while applying ${settingNameMap[setting] || setting}. Continuing with other settings.`,
            variant: "warning",
          })
        }
      }

      // Check if import was cancelled
      if (cancelImport) {
        toast({
          title: "Import Cancelled",
          description: "Import process was cancelled by user",
        })
        return false
      }

      // Display success message
      toast({
        title: "Import Successful",
        description: `Successfully applied ${completedSteps} of ${totalSteps} settings`,
      })

      return completedSteps > 0
    } catch (error) {
      console.error("Failed to apply settings:", error)

      // Display detailed error message
      let errorMessage = "An unexpected error occurred while applying settings"

      if (error instanceof Error) {
        errorMessage = `Import error: ${error.message}`
      }

      toast({
        title: "Import Error",
        description: errorMessage,
        variant: "destructive",
      })

      return false
    } finally {
      setIsImporting(false)
      setCancelImport(false)
    }
  }
  // Function to handle compatibility dialog continue
  const handleCompatibilityContinue = async (selectedSettings: string[]) => {
    // Create a unique ID for the progress toast
    const progressToastId = `import-progress-${Date.now()}`

    try {
      setIsImporting(true)

      // Show progress toast
      toast({
        id: progressToastId,
        title: "Applying Configuration",
        description: `Applying selected settings to your device...`,
      })

      if (currentConfigFile) {
        await applySettings(currentConfigFile, selectedSettings)
      }
    } finally {
      setShowCompatibilityDialog(false)
      setIsImporting(false)
    }
  }

  // Function to handle compatibility dialog cancel
  const handleCompatibilityCancel = () => {
    // Set cancel flag if import is in progress
    if (isImporting) {
      setCancelImport(true)

      toast({
        title: "Cancelling Import",
        description: "Cancelling import process...",
      })
    }

    // Reset dialog state
    setShowCompatibilityDialog(false)
    setCurrentConfigFile(null)
    setCompatibilityIssues([])

    // Only show cancel message if not already importing
    if (!isImporting) {
      toast({
        title: "Import Cancelled",
        description: "Configuration import was cancelled",
      })
    }
  }

  // Function to import configuration
  const importConfig = async (file: File): Promise<boolean> => {
    // Create a unique ID for the progress toast
    const progressToastId = `import-progress-${Date.now()}`

    try {
      setIsImporting(true)

      // File size check (reject if larger than 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Import Error",
          description: "File size too large (max 5MB)",
          variant: "destructive",
        })
        return false
      }

      // File extension check
      if (!file.name.toLowerCase().endsWith('.json')) {
        toast({
          title: "Import Error",
          description: "Only JSON files (.json) are supported",
          variant: "destructive",
        })
        return false
      }

      // Update progress toast
      toast({
        id: progressToastId,
        title: "Validating File",
        description: `Checking file format: ${file.name}`,
      })

      // Read file content
      let fileContent: string
      try {
        fileContent = await file.text()
      } catch (error) {
        console.error("Failed to read file:", error)
        toast({
          title: "Import Error",
          description: "Failed to read file",
          variant: "destructive",
        })
        return false
      }

      // Update progress toast
      toast({
        id: progressToastId,
        title: "Processing File",
        description: "Parsing configuration data...",
      })

      // Parse JSON
      let configFile: any
      try {
        configFile = JSON.parse(fileContent)
      } catch (error) {
        console.error("Failed to parse JSON:", error)
        toast({
          title: "Import Error",
          description: "Invalid JSON format",
          variant: "destructive",
        })
        return false
      }

      // Validate config file
      if (!validateConfigFile(configFile)) {
        toast({
          title: "Import Error",
          description: "Invalid configuration file format",
          variant: "destructive",
        })
        return false
      }

      // Update progress toast
      toast({
        id: progressToastId,
        title: "Checking Compatibility",
        description: "Verifying configuration compatibility with your device...",
      })

      // Compatibility check
      const issues = await checkCompatibility(configFile)

      // Show dialog if there are compatibility issues
      if (issues.length > 0) {
        // Update progress toast
        toast({
          id: progressToastId,
          title: "Compatibility Check",
          description: `Found ${issues.length} compatibility ${issues.length === 1 ? 'issue' : 'issues'}. Please review.`,
          variant: "warning",
        })

        setCurrentConfigFile(configFile)
        setCompatibilityIssues(issues)
        setShowCompatibilityDialog(true)
        return true // Pause processing while dialog is shown
      }

      // Update progress toast for successful compatibility check
      toast({
        id: progressToastId,
        title: "Compatibility Check Passed",
        description: "Applying configuration to your device...",
      })

      // Apply directly if no compatibility issues
      let allSettings: string[]

      // Check if this is the new format (with profiles support)
      if (configFile.profiles) {
        // Select "profiles" if profile data exists
        allSettings = ["profiles"]

        // Add calibration data if it exists
        if (configFile.settings && configFile.settings.calibration) {
          allSettings.push("calibration")
        }
      } else {
        // Legacy format processing
        allSettings = ["keymap", "actuationMap", "advancedKeys", "tickRate", "calibration"]
          .filter(setting => configFile.settings[setting as keyof typeof configFile.settings] !== undefined)
      }

      return await applySettings(configFile, allSettings)
    } catch (error) {
      console.error("Failed to import config:", error)

      // Display error message
      toast({
        title: "Import Error",
        description: "An error occurred while importing configuration",
        variant: "destructive",
      })

      return false
    } finally {
      setIsImporting(false)
    }
  }

  // Get current firmware version
  const getCurrentFirmwareVersion = async (): Promise<string> => {
    if (!device) return "Unknown"

    try {
      const version = await device.firmwareVersion()
      return version.toString()
    } catch (error) {
      console.error("Failed to get firmware version:", error)
      return "Unknown"
    }
  }

  return {
    importConfig,
    isImporting,
    showCompatibilityDialog,
    currentConfigFile,
    compatibilityIssues,
    handleCompatibilityContinue,
    handleCompatibilityCancel,
    getCurrentFirmwareVersion,
    cancelImport: () => setCancelImport(true),
    isCancelling: cancelImport
  }
}