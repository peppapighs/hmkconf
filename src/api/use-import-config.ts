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

import { CompatibilityIssue } from "@/components/configurator/settings/compatibility-dialog"
import { useDevice } from "@/components/providers/device-provider"
import { ConfigFile, validateConfigFile } from "@/types/config"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"
import { z } from "zod"

// Type definition for compatibility check
type CompatibilityCheckResult = {
  configFile: ConfigFile
  issues: CompatibilityIssue[]
}

// Parameter type for config file validation
type ValidateConfigParams = {
  file: File
  toastId: string
}

// Parameter type for applying settings
type ApplySettingsParams = {
  configFile: ConfigFile
  selectedSettings: string[]
  toastId: string // ID for managing toast notifications
}

export function useImportConfig() {
  const device = useDevice()
  const queryClient = useQueryClient()
  const [showCompatibilityDialog, setShowCompatibilityDialog] = useState(false)
  const [currentConfigFile, setCurrentConfigFile] = useState<ConfigFile | null>(
    null,
  )
  const [compatibilityIssues, setCompatibilityIssues] = useState<
    CompatibilityIssue[]
  >([])
  const [cancelImport, setCancelImport] = useState(false)
  const [currentToastId, setCurrentToastId] = useState<string | null>(null)

  // Function to validate configuration file
  const validateImportedConfig = (config: unknown): ConfigFile | null => {
    try {
      // Validate using common schema
      return validateConfigFile(config)
    } catch (error) {
      console.error("Failed to validate configuration file:", error)

      // Improved error messages
      if (error instanceof z.ZodError) {
        // Display error details
        const errorDetails = error.errors
          .map((e) => {
            const path = e.path.join(".")
            return `${path ? `${path}: ` : ""}${e.message}`
          })
          .join("\n")

        toast.error("Invalid configuration file format", {
          description: errorDetails,
        })
      } else if (error instanceof Error) {
        toast.error("Failed to validate configuration file", {
          description: error.message,
        })
      } else {
        toast.error("Unknown error occurred while validating configuration file")
      }

      return null
    }
  }

  // Function to check compatibility between config file and current device
  const checkCompatibility = async (
    configFile: ConfigFile,
  ): Promise<CompatibilityIssue[]> => {
    const issues: CompatibilityIssue[] = []

    if (!device) {
      issues.push({
        type: "device",
        severity: "error",
        message: "No device connected.",
      })
      return issues
    }

    // Device type compatibility check
    if (configFile.deviceInfo.name !== device.metadata.name) {
      issues.push({
        type: "device",
        severity: "warning",
        message: `Config file is for ${configFile.deviceInfo.name}, but current device is ${device.metadata.name}.`,
      })

      // Additional check for device-specific features
      if (device.metadata.numKeys !== undefined) {
        // Check if this is the new format (with profiles support)
        if (configFile.profiles) {
          // Check keymap for each profile
          for (const profileId in configFile.profiles) {
            const profile = configFile.profiles[profileId]
            if (
              profile.keymap &&
              profile.keymap[0] &&
              profile.keymap[0].length > device.metadata.numKeys
            ) {
              issues.push({
                type: "device",
                severity: "error",
                message: `Profile ${profileId}: Source device has more keys (${profile.keymap[0].length}) than current device (${device.metadata.numKeys}).`,
              })
              break // Exit after showing warning if any issue is found
            }
          }
        } else if (
          configFile.settings?.keymap &&
          configFile.settings.keymap[0] &&
          configFile.settings.keymap[0].length > device.metadata.numKeys
        ) {
          // For legacy format
          issues.push({
            type: "device",
            severity: "error",
            message: `Source device has more keys (${configFile.settings.keymap[0].length}) than current device (${device.metadata.numKeys}).`,
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
      if (firmwareVersionStr.includes(".")) {
        // Handle semantic versioning (e.g., "1.2.3")
        const versionParts = firmwareVersionStr.split(".")
        configFirmwareVersion = parseInt(versionParts[0], 10)
      } else {
        // Handle numeric versioning
        configFirmwareVersion = parseInt(firmwareVersionStr, 10)
      }

      if (isNaN(configFirmwareVersion)) {
        issues.push({
          type: "firmware",
          severity: "warning",
          message: `Invalid firmware version format in config file: "${configFile.deviceInfo.firmwareVersion}".`,
        })
      } else if (currentFirmwareVersion < configFirmwareVersion) {
        issues.push({
          type: "firmware",
          severity: "warning",
          message: `Config file is for firmware v${configFile.deviceInfo.firmwareVersion}, but current device has v${currentFirmwareVersion}. Some features may not be available.`,
        })
      }
    } catch (error) {
      console.error("Failed to get firmware version:", error)
      issues.push({
        type: "firmware",
        severity: "warning",
        message: "Failed to get firmware version from device.",
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
              message: `Profile ${profileId}: Keymap layer count mismatch (config file: ${configRows} layers, device: ${deviceLayers} layers).`,
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
                  message: `Profile ${profileId}: Key count mismatch in layer ${i + 1} (config file: ${configKeys} keys, device: ${deviceKeys} keys).`,
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
              message: `Profile ${profileId}: Advanced keys count exceeds device capacity (config file: ${configAdvancedKeys}, device: ${device.metadata.numAdvancedKeys}).`,
            })
          }
        }
      }

      // Check profile count
      const configProfileCount = Object.keys(configFile.profiles).length
      if (configProfileCount > 5) {
        // There are 5 profiles (0-4)
        issues.push({
          type: "settings",
          severity: "warning",
          message: `Config file contains ${configProfileCount} profiles, but device supports only 5 profiles (0-4).`,
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

      if (
        !hasAnySettings &&
        (!configFile.settings || !configFile.settings.calibration)
      ) {
        issues.push({
          type: "settings",
          severity: "error",
          message: "Config file contains no valid settings to import.",
        })
      }
    } else {
      // Compatibility check for legacy format
      // Keymap layers/keys check
      if (configFile.settings?.keymap && device.metadata.numLayers) {
        const configRows = configFile.settings.keymap.length
        const deviceLayers = device.metadata.numLayers

        if (configRows !== deviceLayers) {
          issues.push({
            type: "settings",
            severity: "error",
            message: `Keymap layer count mismatch (config file: ${configRows} layers, device: ${deviceLayers} layers).`,
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
                message: `Key count mismatch in layer ${i + 1} (config file: ${configKeys} keys, device: ${deviceKeys} keys).`,
              })
              break
            }
          }
        }
      }

      // Advanced keys compatibility check
      if (
        configFile.settings?.advancedKeys &&
        device.metadata.numAdvancedKeys
      ) {
        const configAdvancedKeys = Array.isArray(
          configFile.settings.advancedKeys,
        )
          ? configFile.settings.advancedKeys.length
          : Object.keys(configFile.settings.advancedKeys).length

        if (configAdvancedKeys > device.metadata.numAdvancedKeys) {
          issues.push({
            type: "settings",
            severity: "warning",
            message: `Advanced keys count exceeds device capacity (config file: ${configAdvancedKeys}, device: ${device.metadata.numAdvancedKeys}).`,
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
      availableSettings = Object.keys(configFile.settings || {}).filter(
        (key) =>
          configFile.settings?.[key as keyof typeof configFile.settings] !==
          undefined,
      )
    }

    if (availableSettings.length === 0) {
      issues.push({
        type: "settings",
        severity: "error",
        message: "Config file contains no valid settings to import.",
      })
    }

    return issues
  }

  // Cache management settings are not currently used

  // Mutation for file loading and validation
  const validateConfigMutation = useMutation({
    mutationFn: async (
      params: ValidateConfigParams
    ): Promise<CompatibilityCheckResult | null> => {
      const { file, toastId } = params

      // Save toast ID
      setCurrentToastId(toastId)

      // File size check (reject if larger than 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("File size too large (max 5MB)")
      }

      // File extension check
      if (!file.name.toLowerCase().endsWith(".json")) {
        throw new Error("Only JSON files (.json) are supported")
      }

      // Read file content
      const fileContent = await file.text()

      // Update toast to indicate validation in progress
      toast.loading("Validating configuration file...", {
        id: toastId,
        description: "Checking file format",
      })

      // Parse JSON
      let configData
      try {
        configData = JSON.parse(fileContent)
      } catch {
        // No need for detailed parse error
        throw new Error("Invalid JSON format")
      }

      // Validate config file using Zod schema
      const validatedConfig = validateImportedConfig(configData)
      if (!validatedConfig) {
        throw new Error("Configuration validation failed")
      }

      // Update toast to indicate compatibility check in progress
      toast.loading("Checking device compatibility...", {
        id: toastId,
        description: "Verifying configuration",
      })

      // Compatibility check
      const issues = await checkCompatibility(validatedConfig)

      return {
        configFile: validatedConfig,
        issues,
      }
    },
    onSuccess: (result, { toastId }) => {
      if (!result) return

      const { configFile, issues } = result

      // Show dialog if there are compatibility issues
      if (issues.length > 0) {
        // Update toast to indicate compatibility issues
        toast.loading("Configuration requires review", {
          id: toastId,
          description: "Please check compatibility issues",
        })

        setCurrentConfigFile(configFile)
        setCompatibilityIssues(issues)
        setShowCompatibilityDialog(true)
      } else {
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
          allSettings = [
            "keymap",
            "actuationMap",
            "advancedKeys",
            "tickRate",
            "calibration",
          ].filter(
            (setting) =>
              configFile.settings?.[
              setting as keyof typeof configFile.settings
              ] !== undefined,
          )
        }

        // Update toast to indicate configuration is being applied
        toast.loading("Applying configuration...", {
          id: toastId,
          description: "No compatibility issues found",
        })

        // Apply directly if there are no compatibility issues
        applySettingsMutation.mutate({
          configFile,
          selectedSettings: allSettings,
          toastId,
        })
      }
    },
    onError: (error, { toastId }) => {
      console.error("Failed to validate config:", error)

      // Display error toast (using the same ID)
      toast.error("Failed to validate configuration file", {
        id: toastId,
        description: error instanceof Error ? error.message : "Unknown error",
      })
    },
  })

  // Mutation for applying settings
  const applySettingsMutation = useMutation({
    mutationFn: async ({
      configFile,
      selectedSettings,
      toastId,
    }: ApplySettingsParams): Promise<boolean> => {
      if (!device) {
        throw new Error("No device connected")
      }

      // Reset cancel flag
      setCancelImport(false)

      // Variables to track progress
      const totalSteps = selectedSettings.length
      let completedSteps = 0

      // Use the provided toast ID
      const progressToastId = toastId

      // Initial progress toast
      toast.loading("Applying settings...", {
        id: progressToastId,
        description: `Progress: ${completedSteps}/${totalSteps}`,
      })

      // Get current profile number with error handling
      let currentProfile
      try {
        currentProfile = await device.getProfile()
      } catch (profileError) {
        console.error("Failed to get current profile:", profileError)
        toast.warning(
          "Could not determine current profile. Using default profile 0.",
          {
            id: progressToastId,
          }
        )
        currentProfile = 0
      }

      // Setting name mapping
      const settingNameMap: Record<string, string> = {
        keymap: "Keymap",
        actuationMap: "Actuation Settings",
        advancedKeys: "Advanced Key Settings",
        tickRate: "Tick Rate",
        calibration: "Calibration",
        profiles: "All Profiles",
      }

      // Check if this is the new format (with profiles support)
      const isNewFormat = configFile.profiles !== undefined

      // Apply selected settings in order
      for (const setting of selectedSettings) {
        // Check if import was cancelled
        if (cancelImport) {
          throw new Error("Import process was cancelled by user")
        }

        try {
          // Update progress toast
          toast.loading(`Applying ${settingNameMap[setting] || setting}...`, {
            id: progressToastId,
            description: `Progress: ${completedSteps}/${totalSteps}`,
          })

          // For the new format, apply settings for each profile
          if (isNewFormat && setting === "profiles") {
            // Apply settings for each profile
            for (const profileId in configFile.profiles) {
              const profileNum = parseInt(profileId, 10)
              const profileData = configFile.profiles[profileNum]

              // Display progress for each profile
              toast.loading(`Applying Profile ${profileNum} Settings`, {
                id: progressToastId,
                description: `Progress: ${completedSteps}/${totalSteps}`,
              })

              // Apply keymap
              if (profileData.keymap) {
                for (
                  let layer = 0;
                  layer < profileData.keymap.length;
                  layer++
                ) {
                  // Check for cancellation between layers
                  if (cancelImport) break

                  try {
                    await device.setKeymap(
                      profileNum,
                      layer,
                      0,
                      profileData.keymap[layer],
                    )
                  } catch (layerError) {
                    console.error(
                      `Failed to apply keymap layer ${layer} for profile ${profileNum}:`,
                      layerError,
                    )
                    toast.warning(
                      `Failed to apply keymap layer ${layer} for profile ${profileNum}. Continuing with other settings.`,
                      {
                        id: progressToastId,
                      }
                    )
                  }
                }
              }

              // Apply actuation settings
              if (profileData.actuationMap) {
                try {
                  await device.setActuationMap(
                    profileNum,
                    0,
                    profileData.actuationMap,
                  )
                } catch (error) {
                  console.error(
                    `Failed to apply actuation map for profile ${profileNum}:`,
                    error,
                  )
                  toast.warning(
                    `Failed to apply actuation settings for profile ${profileNum}. Continuing with other settings.`,
                    {
                      id: progressToastId,
                    }
                  )
                }
              }

              // Apply advanced key settings
              if (profileData.advancedKeys) {
                try {
                  await device.setAdvancedKeys(
                    profileNum,
                    0,
                    profileData.advancedKeys,
                  )
                } catch (error) {
                  console.error(
                    `Failed to apply advanced keys for profile ${profileNum}:`,
                    error,
                  )
                  toast.warning(
                    `Failed to apply advanced key settings for profile ${profileNum}. Continuing with other settings.`,
                    {
                      id: progressToastId,
                    }
                  )
                }
              }

              // Apply tick rate settings
              if (profileData.tickRate !== undefined) {
                try {
                  await device.setTickRate(profileNum, profileData.tickRate)
                } catch (error) {
                  console.error(
                    `Failed to apply tick rate for profile ${profileNum}:`,
                    error,
                  )
                  toast.warning(
                    `Failed to apply tick rate setting for profile ${profileNum}. Continuing with other settings.`,
                    {
                      id: progressToastId,
                    }
                  )
                }
              }
            }

            // Apply global settings (calibration)
            if (configFile.settings && configFile.settings.calibration) {
              try {
                await device.setCalibration(configFile.settings.calibration)
              } catch (error) {
                console.error("Failed to apply calibration:", error)
                toast.warning(
                  "Failed to apply calibration settings. Continuing with other settings.",
                  {
                    id: progressToastId,
                  }
                )
              }
            }
          } else {
            // Legacy format processing
            switch (setting) {
              case "keymap":
                if (configFile.settings?.keymap) {
                  // Apply each layer of keymap
                  for (
                    let layer = 0;
                    layer < configFile.settings.keymap.length;
                    layer++
                  ) {
                    // Check for cancellation between layers
                    if (cancelImport) break

                    try {
                      await device.setKeymap(
                        currentProfile,
                        layer,
                        0,
                        configFile.settings.keymap[layer],
                      )
                    } catch (layerError) {
                      console.error(
                        `Failed to apply keymap layer ${layer}:`,
                        layerError,
                      )
                      toast.warning(
                        `Failed to apply keymap layer ${layer}. Continuing with other settings.`,
                        {
                          id: progressToastId,
                        }
                      )
                    }
                  }
                }
                break

              case "actuationMap":
                if (configFile.settings?.actuationMap) {
                  try {
                    await device.setActuationMap(
                      currentProfile,
                      0,
                      configFile.settings.actuationMap,
                    )
                  } catch (error) {
                    console.error("Failed to apply actuation map:", error)
                    toast.warning(
                      "Failed to apply actuation settings. Continuing with other settings.",
                      {
                        id: progressToastId,
                      }
                    )
                  }
                }
                break

              case "advancedKeys":
                if (configFile.settings?.advancedKeys) {
                  try {
                    await device.setAdvancedKeys(
                      currentProfile,
                      0,
                      configFile.settings.advancedKeys,
                    )
                  } catch (error) {
                    console.error("Failed to apply advanced keys:", error)
                    toast.warning(
                      "Failed to apply advanced key settings. Continuing with other settings.",
                      {
                        id: progressToastId,
                      }
                    )
                  }
                }
                break

              case "tickRate":
                if (configFile.settings?.tickRate !== undefined) {
                  try {
                    await device.setTickRate(
                      currentProfile,
                      configFile.settings.tickRate,
                    )
                  } catch (error) {
                    console.error("Failed to apply tick rate:", error)
                    toast.warning(
                      "Failed to apply tick rate setting. Continuing with other settings.",
                      {
                        id: progressToastId,
                      }
                    )
                  }
                }
                break

              case "calibration":
                if (configFile.settings?.calibration) {
                  try {
                    await device.setCalibration(configFile.settings.calibration)
                  } catch (error) {
                    console.error("Failed to apply calibration:", error)
                    toast.warning(
                      "Failed to apply calibration settings. Continuing with other settings.",
                      {
                        id: progressToastId,
                      }
                    )
                  }
                }
                break
            }
          }

          // Count completed steps
          completedSteps++

          // Update progress toast
          toast.loading(`Applied ${settingNameMap[setting] || setting}`, {
            id: progressToastId,
            description: `Progress: ${completedSteps}/${totalSteps}`,
          })

          // Small delay to show progress
          await new Promise((resolve) => setTimeout(resolve, 300))
        } catch (settingError) {
          console.error(`Failed to apply ${setting}:`, settingError)

          // Display error message but continue with other settings
          toast.warning(
            `Error occurred while applying ${settingNameMap[setting] || setting}. Continuing with other settings.`,
            {
              id: progressToastId,
            }
          )
        }
      }

      // Check if import was cancelled
      if (cancelImport) {
        throw new Error("Import process was cancelled by user")
      }

      // Display success message
      toast.success(
        `Successfully applied ${completedSteps} of ${totalSteps} settings`,
        {
          id: progressToastId,
        },
      )

      return completedSteps > 0
    },
    onSuccess: (_, { toastId }) => {
      // Get device ID
      const deviceId = device?.id

      // Invalidate related queries (including device ID)
      if (deviceId) {
        // Invalidate queries related to specific device
        // Invalidate data for all profiles
        for (let profileId = 0; profileId <= 4; profileId++) {
          // Invalidate various settings for each profile
          queryClient.invalidateQueries({
            queryKey: [deviceId, profileId, "keymap"],
            refetchType: "active", // Only refetch active queries
          })
          queryClient.invalidateQueries({
            queryKey: [deviceId, profileId, "actuationMap"],
            refetchType: "active",
          })
          queryClient.invalidateQueries({
            queryKey: [deviceId, profileId, "advancedKeys"],
            refetchType: "active",
          })
          queryClient.invalidateQueries({
            queryKey: [deviceId, profileId, "tickRate"],
            refetchType: "active",
          })
        }

        // Also invalidate global settings
        queryClient.invalidateQueries({
          queryKey: [deviceId, "calibration"],
          refetchType: "active",
        })
        queryClient.invalidateQueries({
          queryKey: [deviceId, "profile"],
          refetchType: "active",
        })
      } else {
        // If device ID is unknown, invalidate with general query keys
        queryClient.invalidateQueries({ queryKey: ["keymap"] })
        queryClient.invalidateQueries({ queryKey: ["actuationMap"] })
        queryClient.invalidateQueries({ queryKey: ["advancedKeys"] })
        queryClient.invalidateQueries({ queryKey: ["tickRate"] })
        queryClient.invalidateQueries({ queryKey: ["calibration"] })
        queryClient.invalidateQueries({ queryKey: ["profile"] })
      }

      // Display success toast (using the same ID)
      toast.success("Configuration imported successfully", {
        id: toastId,
      })

      // Close dialog
      setShowCompatibilityDialog(false)
      setCurrentConfigFile(null)
      setCompatibilityIssues([])

      // Reset toast ID
      setCurrentToastId(null)
    },
    onError: (error, { toastId }) => {
      console.error("Failed to apply settings:", error)

      if (error.message === "Import process was cancelled by user") {
        toast.info("Import process was cancelled by user", {
          id: toastId,
        })
      } else {
        toast.error("Failed to apply settings", {
          id: toastId,
          description: error instanceof Error ? error.message : "Unknown error",
        })
      }

      // Close dialog
      setShowCompatibilityDialog(false)
      setCurrentConfigFile(null)
      setCompatibilityIssues([])

      // Reset toast ID
      setCurrentToastId(null)
    },
    onSettled: () => {
      setCancelImport(false)
    },
  })

  // Function to handle compatibility dialog continue
  const handleCompatibilityContinue = async (selectedSettings: string[]) => {
    if (currentConfigFile && currentToastId) {
      applySettingsMutation.mutate({
        configFile: currentConfigFile,
        selectedSettings,
        toastId: currentToastId,
      })
    } else if (currentConfigFile) {
      // Generate new toast ID if none exists
      const newToastId = `import-compatibility-${Date.now()}`
      setCurrentToastId(newToastId)

      // Display initial toast
      toast.loading("Preparing to apply settings...", {
        id: newToastId,
        description: "Processing configuration",
      })

      applySettingsMutation.mutate({
        configFile: currentConfigFile,
        selectedSettings,
        toastId: newToastId,
      })
    }
  }

  // Function to handle compatibility dialog cancel
  const handleCompatibilityCancel = () => {
    // Set cancel flag if import is in progress
    if (applySettingsMutation.isPending) {
      setCancelImport(true)

      // Display cancellation toast (using the same ID)
      if (currentToastId) {
        toast.loading("Cancelling import process...", {
          id: currentToastId,
        })
      } else {
        toast.loading("Cancelling import process...")
      }
    } else {
      // Reset dialog state
      setShowCompatibilityDialog(false)
      setCurrentConfigFile(null)
      setCompatibilityIssues([])

      // Display cancellation confirmation toast
      if (currentToastId) {
        toast.info("Configuration import was cancelled", {
          id: currentToastId,
        })

        // Reset toast ID
        setCurrentToastId(null)
      } else {
        toast.info("Configuration import was cancelled")
      }
    }
  }

  // Function to import configuration
  const importConfig = async (file: File, toastId: string) => {
    return validateConfigMutation.mutateAsync({ file, toastId })
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
    isImporting:
      validateConfigMutation.isPending || applySettingsMutation.isPending,
    showCompatibilityDialog,
    currentConfigFile,
    compatibilityIssues,
    handleCompatibilityContinue,
    handleCompatibilityCancel,
    getCurrentFirmwareVersion,
    cancelImport: () => setCancelImport(true),
    isCancelling: cancelImport,
  }
}
