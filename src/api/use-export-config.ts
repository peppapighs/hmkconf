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
import { useGetActuationMap } from "./use-get-actuation-map"
import { useGetAdvancedKeys } from "./use-get-advanced-keys"
import { useGetCalibration } from "./use-get-calibration"
import { useGetKeymap } from "./use-get-keymap"
import { useGetTickRate } from "./use-get-tick-rate"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"

// Configuration file type definition
export interface ConfigFile {
  // Metadata
  version: string
  timestamp: string
  deviceInfo: {
    name: string
    firmwareVersion: string
    deviceId: string
  }
  
  // Configuration data
  profiles: {
    [profileId: number]: {
      keymap?: number[][]
      actuationMap?: any
      advancedKeys?: any
      tickRate?: number
    }
  }
  // Global settings
  settings: {
    calibration?: any
  }
}

export function useExportConfig() {
  const { toast } = useToast()
  const device = useDevice()
  const [isExporting, setIsExporting] = useState(false)
  
  // Queries to get data for each profile are not needed
  // Data is retrieved directly from the device during export

  // Function to get firmware version
  const getFirmwareVersion = async (): Promise<number> => {
    try {
      return await device.firmwareVersion()
    } catch (error) {
      console.error("Failed to get firmware version:", error)
      return 0
    }
  }

  // Function to fetch settings data for each profile
  const fetchProfileData = async (profileId: number) => {
    try {
      // Get data for the specified profile
      const keymapData = await device.getKeymap(profileId)
      const actuationMapData = await device.getActuationMap(profileId)
      const advancedKeysData = await device.getAdvancedKeys(profileId)
      const tickRateData = await device.getTickRate(profileId)
      
      return {
        keymap: keymapData,
        actuationMap: actuationMapData,
        advancedKeys: advancedKeysData,
        tickRate: tickRateData
      }
    } catch (error) {
      console.error(`Failed to fetch data for profile ${profileId}:`, error)
      return null
    }
  }

  // Function to export configuration
  const exportConfig = async () => {
    try {
      setIsExporting(true)
      
      // Validate device connection
      if (!device) {
        toast({
          title: "Export Error",
          description: "No device connected. Please connect a device and try again.",
          variant: "destructive",
        })
        return false
      }
      
      // Get current profile number with error handling
      let currentProfile = 0
      try {
        currentProfile = await device.getProfile()
      } catch (profileError) {
        console.error("Failed to get current profile:", profileError)
        toast({
          title: "Export Warning",
          description: "Could not determine current profile. Using default profile 0.",
          variant: "warning",
        })
      }
      
      // Get firmware version with error handling
      let firmwareVersion
      try {
        firmwareVersion = await getFirmwareVersion()
      } catch (error) {
        console.error("Failed to get firmware version:", error)
        toast({
          title: "Export Warning",
          description: "Could not retrieve firmware version. Continuing with export.",
          variant: "warning",
        })
        firmwareVersion = "unknown"
      }
      
      // Get current date and time
      const now = new Date()
      const timestamp = now.toISOString()
      const formattedDate = now.toISOString().replace(/:/g, "-").replace(/\..+/, "")
      
      // Create a unique ID for the progress toast
      const progressToastId = `export-progress-${Date.now()}`
      
      // Show progress toast
      toast({
        id: progressToastId,
        title: "Preparing Export",
        description: "Fetching configuration data for all profiles...",
      })
      
      // Get data for all profiles (0-4)
      const profilesData: {
        [profileId: number]: {
          keymap?: number[][]
          actuationMap?: any
          advancedKeys?: any
          tickRate?: number
        }
      } = {}
      
      // Fetch data for each profile
      for (let profileId = 0; profileId <= 4; profileId++) {
        // Update progress
        toast({
          id: progressToastId,
          title: "Fetching Profile Data",
          description: `Retrieving profile ${profileId} settings...`,
        })
        
        try {
          const profileData = await fetchProfileData(profileId)
          if (profileData) {
            profilesData[profileId] = {}
            
            // Include only valid data
            if (profileData.keymap) profilesData[profileId].keymap = profileData.keymap
            if (profileData.actuationMap) profilesData[profileId].actuationMap = profileData.actuationMap
            if (profileData.advancedKeys) profilesData[profileId].advancedKeys = profileData.advancedKeys
            if (profileData.tickRate !== undefined) profilesData[profileId].tickRate = profileData.tickRate
          }
        } catch (error) {
          console.error(`Failed to fetch data for profile ${profileId}:`, error)
          toast({
            title: "Export Warning",
            description: `Could not retrieve data for profile ${profileId}. This profile will be skipped.`,
            variant: "warning",
          })
        }
      }
      
      // Get global settings (calibration)
      let calibrationData
      try {
        calibrationData = await device.getCalibration()
      } catch (error) {
        console.error("Failed to fetch calibration data:", error)
        toast({
          title: "Export Warning",
          description: "Could not retrieve calibration data. This setting will be skipped.",
          variant: "warning",
        })
      }
      
      // Update progress toast
      toast({
        id: progressToastId,
        title: "Data Retrieved",
        description: "Preparing configuration file...",
      })
      
      // Check if profile data is empty
      const hasProfileData = Object.keys(profilesData).length > 0 && 
        Object.values(profilesData).some(profile => Object.keys(profile).length > 0)
      
      // Error if no data could be retrieved
      if (!hasProfileData && !calibrationData) {
        toast({
          title: "Export Error",
          description: "No configuration data available to export. Please try again.",
          variant: "destructive",
        })
        return false
      }
      
      // Create configuration file
      const configFile: ConfigFile = {
        version: "1.0",
        timestamp,
        deviceInfo: {
          name: device.metadata.name || "Unknown Device",
          firmwareVersion: firmwareVersion.toString(),
          deviceId: device.id || "unknown"
        },
        profiles: profilesData,
        settings: {
          ...(calibrationData ? { calibration: calibrationData } : {})
        }
      }
      
      // Generate JSON file
      const jsonContent = JSON.stringify(configFile, null, 2)
      const blob = new Blob([jsonContent], { type: "application/json" })
      
      // Generate filename
      const fileName = `${device.metadata.name}_config_${formattedDate}.json`
      
      try {
        // Create download link and auto-click
        const downloadLink = document.createElement("a")
        downloadLink.href = URL.createObjectURL(blob)
        downloadLink.download = fileName
        document.body.appendChild(downloadLink)
        downloadLink.click()
        
        // Clean up
        setTimeout(() => {
          URL.revokeObjectURL(downloadLink.href)
          document.body.removeChild(downloadLink)
        }, 100)
        
        // Display success message with profile information
        toast({
          id: progressToastId,
          title: "Export Successful",
          description: `All profiles configuration exported to ${fileName}`,
        })
        
        return true
      } catch (downloadError) {
        console.error("Failed to download file:", downloadError)
        
        // Fallback method for browsers that don't support download attribute
        try {
          const url = URL.createObjectURL(blob)
          window.open(url, '_blank')
          setTimeout(() => URL.revokeObjectURL(url), 100)
          
          toast({
            title: "Export Successful",
            description: "Configuration file opened in new tab. Please save it manually.",
          })
          
          return true
        } catch (fallbackError) {
          console.error("Fallback download failed:", fallbackError)
          
          toast({
            title: "Export Error",
            description: "Failed to download configuration file. Please try again.",
            variant: "destructive",
          })
          
          return false
        }
      }
    } catch (error) {
      console.error("Failed to export config:", error)
      
      // Display detailed error message
      let errorMessage = "An error occurred while exporting configuration"
      
      if (error instanceof Error) {
        errorMessage = `Export error: ${error.message}`
      }
      
      toast({
        title: "Export Error",
        description: errorMessage,
        variant: "destructive",
      })
      
      return false
    } finally {
      setIsExporting(false)
    }
  }
  
  return {
    exportConfig,
    isExporting
  }
}