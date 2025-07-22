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

import { renderHook, act } from '@testing-library/react'
import { useExportConfig, ConfigFile } from '../use-export-config'
import { useImportConfig } from '../use-import-config'
import { useDevice } from '@/components/providers/device-provider'
import { useToast } from '@/components/ui/use-toast'

// Mock dependencies
jest.mock('@/components/providers/device-provider', () => ({
  useDevice: jest.fn(),
}))

jest.mock('@/components/ui/use-toast', () => ({
  useToast: jest.fn(),
}))

jest.mock('../use-get-keymap', () => ({
  useGetKeymap: jest.fn().mockReturnValue({
    data: [[1, 2, 3], [4, 5, 6]],
    refetch: jest.fn().mockResolvedValue({ data: [[1, 2, 3], [4, 5, 6]] }),
  }),
}))

jest.mock('../use-get-actuation-map', () => ({
  useGetActuationMap: jest.fn().mockReturnValue({
    data: [10, 20, 30],
    refetch: jest.fn().mockResolvedValue({ data: [10, 20, 30] }),
  }),
}))

jest.mock('../use-get-advanced-keys', () => ({
  useGetAdvancedKeys: jest.fn().mockReturnValue({
    data: { key1: 'value1', key2: 'value2' },
    refetch: jest.fn().mockResolvedValue({ data: { key1: 'value1', key2: 'value2' } }),
  }),
}))

jest.mock('../use-get-tick-rate', () => ({
  useGetTickRate: jest.fn().mockReturnValue({
    data: 1000,
    refetch: jest.fn().mockResolvedValue({ data: 1000 }),
  }),
}))

jest.mock('../use-get-calibration', () => ({
  useGetCalibration: jest.fn().mockReturnValue({
    data: { cal1: 100, cal2: 200 },
    refetch: jest.fn().mockResolvedValue({ data: { cal1: 100, cal2: 200 } }),
  }),
}))

// Mock URL and document APIs
global.URL.createObjectURL = jest.fn()
global.URL.revokeObjectURL = jest.fn()

describe('Config Export/Import', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock device
    const mockDevice = {
      metadata: {
        name: 'TestDevice',
        numLayers: 2,
        numKeys: 3,
        numAdvancedKeys: 10,
      },
      id: 'device-123',
      firmwareVersion: jest.fn().mockResolvedValue(5),
      getProfile: jest.fn().mockResolvedValue(0),
      setKeymap: jest.fn().mockResolvedValue(undefined),
      setActuationMap: jest.fn().mockResolvedValue(undefined),
      setAdvancedKeys: jest.fn().mockResolvedValue(undefined),
      setTickRate: jest.fn().mockResolvedValue(undefined),
      setCalibration: jest.fn().mockResolvedValue(undefined),
    }
    
    // Mock toast
    const mockToast = {
      toast: jest.fn().mockReturnValue({ id: 'toast-123', dismiss: jest.fn() }),
      dismiss: jest.fn(),
    }
    
    // Set up mocks
    ;(useDevice as jest.Mock).mockReturnValue({ isDemo: false, ...mockDevice })
    ;(useToast as jest.Mock).mockReturnValue(mockToast)
    
    // Mock document.createElement
    document.createElement = jest.fn().mockImplementation((tag) => {
      if (tag === 'a') {
        return {
          href: '',
          download: '',
          click: jest.fn(),
          style: { display: 'none' },
          appendChild: jest.fn(),
        }
      }
      return {} as any
    })
    
    // Mock document.body.appendChild
    document.body.appendChild = jest.fn()
    document.body.removeChild = jest.fn()
  })

  describe('useExportConfig', () => {
    test('should export configuration successfully', async () => {
      const { result } = renderHook(() => useExportConfig())
      
      // Mock Blob
      global.Blob = jest.fn().mockImplementation((content, options) => ({
        content,
        options,
        size: 1000,
      })) as any
      
      await act(async () => {
        const success = await result.current.exportConfig()
        expect(success).toBe(true)
      })
      
      // Check if toast was called with success message
      const mockToast = useToast()
      expect(mockToast.toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringContaining('Export Successful'),
        })
      )
      
      // Check if URL.createObjectURL was called
      expect(URL.createObjectURL).toHaveBeenCalled()
      
      // Check if download link was created and clicked
      expect(document.createElement).toHaveBeenCalledWith('a')
      const mockAnchor = document.createElement('a')
      expect(mockAnchor.click).toHaveBeenCalled()
    })
    
    test('should handle export error when no device is connected', async () => {
      // Mock no device
      ;(useDevice as jest.Mock).mockReturnValue({ isDemo: false, device: null })
      
      const { result } = renderHook(() => useExportConfig())
      
      await act(async () => {
        const success = await result.current.exportConfig()
        expect(success).toBe(false)
      })
      
      // Check if toast was called with error message
      const mockToast = useToast()
      expect(mockToast.toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Export Error',
          variant: 'destructive',
        })
      )
    })
  })

  describe('useImportConfig', () => {
    // Create a sample valid config file
    const createValidConfigFile = (): ConfigFile => ({
      version: '1.0',
      timestamp: new Date().toISOString(),
      deviceInfo: {
        name: 'TestDevice',
        firmwareVersion: '5',
        deviceId: 'device-123',
      },
      settings: {
        keymap: [[1, 2, 3], [4, 5, 6]],
        actuationMap: [10, 20, 30],
        advancedKeys: { key1: 'value1', key2: 'value2' },
        tickRate: 1000,
        calibration: { cal1: 100, cal2: 200 },
      },
    })
    
    test('should validate config file correctly', async () => {
      const { result } = renderHook(() => useImportConfig())
      
      // Create a valid config file JSON
      const validConfig = createValidConfigFile()
      const validConfigJson = JSON.stringify(validConfig)
      
      // Create a File object with the JSON
      const file = new File([validConfigJson], 'config.json', { type: 'application/json' })
      
      await act(async () => {
        const success = await result.current.importConfig(file)
        expect(success).toBe(true)
      })
      
      // Check if toast was called with success message
      const mockToast = useToast()
      expect(mockToast.toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Import Successful',
        })
      )
    })
    
    test('should detect compatibility issues', async () => {
      const { result } = renderHook(() => useImportConfig())
      
      // Create a config file with compatibility issues
      const configWithIssues = createValidConfigFile()
      configWithIssues.deviceInfo.name = 'DifferentDevice' // Device mismatch
      configWithIssues.deviceInfo.firmwareVersion = '10' // Higher firmware version
      
      const configJson = JSON.stringify(configWithIssues)
      const file = new File([configJson], 'config.json', { type: 'application/json' })
      
      await act(async () => {
        const success = await result.current.importConfig(file)
        expect(success).toBe(true) // Returns true because it shows the compatibility dialog
      })
      
      // Check if compatibility dialog is shown
      expect(result.current.showCompatibilityDialog).toBe(true)
      expect(result.current.compatibilityIssues.length).toBeGreaterThan(0)
    })
    
    test('should reject invalid files', async () => {
      const { result } = renderHook(() => useImportConfig())
      
      // Create an invalid JSON file
      const invalidJson = '{ "invalid": "json",'
      const file = new File([invalidJson], 'invalid.json', { type: 'application/json' })
      
      await act(async () => {
        const success = await result.current.importConfig(file)
        expect(success).toBe(false)
      })
      
      // Check if toast was called with error message
      const mockToast = useToast()
      expect(mockToast.toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Import Error',
          variant: 'destructive',
        })
      )
    })
    
    test('should apply selected settings correctly', async () => {
      const { result } = renderHook(() => useImportConfig())
      
      // Create a valid config
      const validConfig = createValidConfigFile()
      
      // Set the current config file and simulate continuing with selected settings
      act(() => {
        result.current.currentConfigFile = validConfig
        result.current.compatibilityIssues = []
      })
      
      await act(async () => {
        await result.current.handleCompatibilityContinue(['keymap', 'tickRate'])
      })
      
      // Check if device methods were called
      const mockDevice = useDevice()
      expect(mockDevice.setKeymap).toHaveBeenCalled()
      expect(mockDevice.setTickRate).toHaveBeenCalled()
      expect(mockDevice.setActuationMap).not.toHaveBeenCalled() // Not selected
      
      // Check if dialog was closed
      expect(result.current.showCompatibilityDialog).toBe(false)
    })
  })
})