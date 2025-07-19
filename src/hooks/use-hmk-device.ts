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

import { DEVICE_METADATA } from "@/constants/device-metadata"
import { HE60 } from "@/constants/devices/HE60"
import { TaskQueue } from "@/lib/task-queue"
import { displayUInt16, isWebHIDSupported } from "@/lib/utils"
import {
  DeviceAction,
  DeviceAdvancedKey,
  DeviceAKType,
  DeviceCommand,
  DeviceState,
} from "@/types/devices"
import { create } from "zustand"
import { immer } from "zustand/middleware/immer"

const RAW_HID_EP_SIZE = 64

const ANALOG_INFO_SIZE = 3
const KEYMAP_SIZE = 1
const ACTUATION_MAP_SIZE = 4
const ADVANCED_KEYS_SIZE = 12

const COMMAND_PARTIAL_SIZE = (size: number) =>
  Math.floor((RAW_HID_EP_SIZE - 1) / size)

const HMK_DEVICE_TIMEOUT = 4000

const HMK_DEVICE_FILTERS: HIDDeviceFilter[] = DEVICE_METADATA.map(
  ({ vendorId, productId }) => ({
    vendorId,
    productId,
    usagePage: 0xffab,
    usage: 0xab,
  }),
)

type HMKDeviceState = DeviceState &
  (
    | {
        status: "disconnected"
        hidDevice?: undefined
      }
    | {
        status: "connected"
        hidDevice: HIDDevice
      }
  )

type HMKDevice = HMKDeviceState & DeviceAction

const initialState: HMKDeviceState = {
  id: "HMK_DEVICE",
  metadata: HE60,
  isDemo: false,
  status: "disconnected",
}

const taskQueue = new TaskQueue()
const responseQueue: DataView[] = []

const sendReport = (
  device: HMKDevice,
  commandId: number,
  payload?: number[],
) => {
  if (device.status !== "connected") {
    throw new Error("Device not connected")
  }

  const buffer = [commandId]
  if (payload) {
    if (payload.length > RAW_HID_EP_SIZE - 1) {
      throw new Error(
        `Payload exceeds maximum length of ${RAW_HID_EP_SIZE - 1} bytes`,
      )
    }
    buffer.push(...payload)
  }
  buffer.push(...Array(RAW_HID_EP_SIZE - buffer.length).fill(0))

  return taskQueue.enqueue(
    (abortController) =>
      new Promise<DataView>(async (resolve, reject) => {
        if (device.status !== "connected") {
          throw new Error("Device not connected")
        }

        const { hidDevice } = device
        await hidDevice.sendReport(0, new Uint8Array(buffer))

        const interval = setInterval(() => {
          while (responseQueue.length > 0) {
            const response = responseQueue.shift()
            if (response && response.getUint8(0) === commandId) {
              clearInterval(interval)
              resolve(response)
            }
          }
        }, 10)

        abortController.signal.addEventListener("abort", () => {
          clearInterval(interval)
          reject(new Error("Operation was aborted"))
        })

        setTimeout(() => {
          clearInterval(interval)
          reject(new Error("Operation timed out"))
        }, HMK_DEVICE_TIMEOUT)
      }),
  )
}

export const useHMKDevice = create<HMKDevice>()(
  immer((set, get) => ({
    ...initialState,

    async connect() {
      if (!isWebHIDSupported()) {
        throw new Error("WebHID is not supported")
      }

      const hidDevice = (
        await navigator.hid.requestDevice({
          filters: HMK_DEVICE_FILTERS,
        })
      )[0]
      const metadata = DEVICE_METADATA.find(
        (metadata) =>
          metadata.vendorId === hidDevice.vendorId &&
          metadata.productId === hidDevice.productId,
      )

      if (metadata === undefined) {
        throw new Error("Unsupported device")
      }

      if (hidDevice.opened) {
        throw new Error("Device already opened")
      }

      await hidDevice.open()

      navigator.hid.ondisconnect = get().disconnect
      hidDevice.oninputreport = (e: HIDInputReportEvent) => {
        const device = get()
        if (device.status !== "connected") {
          return
        }

        if (e.data.byteLength !== RAW_HID_EP_SIZE) {
          console.error(
            `Unexpected input report length: ${e.data.byteLength}, expected ${RAW_HID_EP_SIZE} bytes`,
          )
          return
        }

        responseQueue.push(e.data)
      }

      responseQueue.length = 0
      set({
        id: `HMK_DEVICE:${displayUInt16(hidDevice.vendorId)}_${displayUInt16(hidDevice.productId)}`,
        metadata,
        status: "connected",
        hidDevice,
      })
    },

    async disconnect() {
      const device = get()
      if (device.status !== "connected") {
        return
      }

      navigator.hid.ondisconnect = null
      device.hidDevice.oninputreport = null

      set({ ...initialState })
      await taskQueue.clear()
      await device.hidDevice.close()
    },

    async firmwareVersion() {
      const response = await sendReport(get(), DeviceCommand.FIRMWARE_VERSION)

      return response.getUint16(1, true)
    },

    async reboot() {
      await sendReport(get(), DeviceCommand.REBOOT)
    },

    async bootloader() {
      await sendReport(get(), DeviceCommand.BOOTLOADER)
    },

    async factoryReset() {
      await sendReport(get(), DeviceCommand.FACTORY_RESET)
    },

    async recalibrate() {
      await sendReport(get(), DeviceCommand.RECALIBRATE)
    },

    async analogInfo() {
      const partialSize = COMMAND_PARTIAL_SIZE(ANALOG_INFO_SIZE)
      const device = get()

      const ret = []
      for (
        let i = 0;
        i < Math.ceil(device.metadata.numKeys / partialSize);
        i++
      ) {
        const response = await sendReport(device, DeviceCommand.ANALOG_INFO, [
          i,
        ])
        for (let j = 0; j < partialSize; j++) {
          if (i * partialSize + j >= device.metadata.numKeys) {
            break
          }
          const offset = 1 + j * ANALOG_INFO_SIZE
          ret.push({
            adcValue: response.getUint16(offset, true),
            distance: response.getUint8(offset + 2),
          })
        }
      }

      return ret
    },

    async getCalibration() {
      const response = await sendReport(get(), DeviceCommand.GET_CALIBRATION)

      return {
        initialRestValue: response.getUint16(1, true),
        initialBottomOutThreshold: response.getUint16(3, true),
      }
    },

    async setCalibration(calibration) {
      await sendReport(get(), DeviceCommand.SET_CALIBRATION, [
        calibration.initialRestValue & 0xff,
        (calibration.initialRestValue >> 8) & 0xff,
        calibration.initialBottomOutThreshold & 0xff,
        (calibration.initialBottomOutThreshold >> 8) & 0xff,
      ])
    },

    async getProfile() {
      const response = await sendReport(get(), DeviceCommand.GET_PROFILE)

      return response.getUint8(1)
    },

    async getKeymap(profile) {
      const partialSize = COMMAND_PARTIAL_SIZE(KEYMAP_SIZE)
      const device = get()

      const ret = []
      for (let i = 0; i < device.metadata.numLayers; i++) {
        const layerKeymap = []
        for (
          let j = 0;
          j < Math.ceil(device.metadata.numKeys / partialSize);
          j++
        ) {
          const response = await sendReport(device, DeviceCommand.GET_KEYMAP, [
            profile,
            i,
            j,
          ])

          for (let k = 0; k < partialSize; k++) {
            if (j * partialSize + k >= device.metadata.numKeys) {
              break
            }
            const offset = 1 + k * KEYMAP_SIZE
            layerKeymap.push(response.getUint8(offset))
          }
        }
        ret.push(layerKeymap)
      }

      return ret
    },

    async setKeymap(profile, layer, start, keymap) {
      const partialSize = COMMAND_PARTIAL_SIZE(KEYMAP_SIZE)

      for (let i = 0; i < Math.ceil(keymap.length / partialSize); i++) {
        const partialKeymap = keymap.slice(
          i * partialSize,
          Math.min(keymap.length, (i + 1) * partialSize),
        )

        await sendReport(get(), DeviceCommand.SET_KEYMAP, [
          profile,
          layer,
          start + i * partialSize,
          partialKeymap.length,
          ...partialKeymap,
        ])
      }
    },

    async getActuationMap(profile) {
      const partialSize = COMMAND_PARTIAL_SIZE(ACTUATION_MAP_SIZE)
      const device = get()

      const ret = []
      for (
        let i = 0;
        i < Math.ceil(device.metadata.numKeys / partialSize);
        i++
      ) {
        const response = await sendReport(
          device,
          DeviceCommand.GET_ACTUATION_MAP,
          [profile, i],
        )

        for (let j = 0; j < partialSize; j++) {
          if (i * partialSize + j >= device.metadata.numKeys) {
            break
          }
          const offset = 1 + j * ACTUATION_MAP_SIZE
          ret.push({
            actuationPoint: response.getUint8(offset),
            rtDown: response.getUint8(offset + 1),
            rtUp: response.getUint8(offset + 2),
            continuous: response.getUint8(offset + 3) !== 0,
          })
        }
      }

      return ret
    },

    async setActuationMap(profile, start, actuationMap) {
      const partialSize = COMMAND_PARTIAL_SIZE(ACTUATION_MAP_SIZE)

      for (let i = 0; i < Math.ceil(actuationMap.length / partialSize); i++) {
        const partialActuationMap = actuationMap.slice(
          i * partialSize,
          Math.min(actuationMap.length, (i + 1) * partialSize),
        )

        await sendReport(get(), DeviceCommand.SET_ACTUATION_MAP, [
          profile,
          start + i * partialSize,
          partialActuationMap.length,
          ...partialActuationMap.flatMap((actuation) => [
            actuation.actuationPoint,
            actuation.rtDown,
            actuation.rtUp,
            actuation.continuous ? 1 : 0,
          ]),
        ])
      }
    },

    async getAdvancedKeys(profile) {
      const partialSize = COMMAND_PARTIAL_SIZE(ADVANCED_KEYS_SIZE)
      const device = get()

      const ret: DeviceAdvancedKey[] = []
      for (
        let i = 0;
        i < Math.ceil(device.metadata.numAdvancedKeys / partialSize);
        i++
      ) {
        const response = await sendReport(
          device,
          DeviceCommand.GET_ADVANCED_KEYS,
          [profile, i],
        )

        for (let j = 0; j < partialSize; j++) {
          if (i * partialSize + j >= device.metadata.numAdvancedKeys) {
            break
          }
          const offset = 1 + j * ADVANCED_KEYS_SIZE
          const layer = response.getUint8(offset)
          const key = response.getUint8(offset + 1)
          const type = response.getUint8(offset + 2)

          switch (type) {
            case DeviceAKType.NULL_BIND:
              ret.push({
                layer,
                key,
                ak: {
                  type: DeviceAKType.NULL_BIND,
                  secondaryKey: response.getUint8(offset + 3),
                  behavior: response.getUint8(offset + 4),
                  bottomOutPoint: response.getUint8(offset + 5),
                },
              })
              break

            case DeviceAKType.DYNAMIC_KEYSTROKE:
              ret.push({
                layer,
                key,
                ak: {
                  type: DeviceAKType.DYNAMIC_KEYSTROKE,
                  keycodes: Array.from({ length: 4 }, (_, j) =>
                    response.getUint8(offset + 3 + j),
                  ),
                  bitmap: Array.from({ length: 4 }, (_, j) => {
                    const mask = response.getUint8(offset + 7 + j)
                    return Array.from(
                      { length: 4 },
                      (_, k) => (mask >> (k * 2)) & 3,
                    )
                  }),
                  bottomOutPoint: response.getUint8(offset + 11),
                },
              })
              break

            case DeviceAKType.TAP_HOLD:
              ret.push({
                layer,
                key,
                ak: {
                  type: DeviceAKType.TAP_HOLD,
                  tapKeycode: response.getUint8(offset + 3),
                  holdKeycode: response.getUint8(offset + 4),
                  tappingTerm: response.getUint16(offset + 5, true),
                  holdOnOtherKeyPress: response.getUint8(offset + 7) !== 0,
                },
              })
              break

            case DeviceAKType.TOGGLE:
              ret.push({
                layer,
                key,
                ak: {
                  type: DeviceAKType.TOGGLE,
                  keycode: response.getUint8(offset + 3),
                  tappingTerm: response.getUint16(offset + 4, true),
                },
              })
              break

            case DeviceAKType.NONE:
            default:
              ret.push({
                layer,
                key,
                ak: { type: DeviceAKType.NONE },
              })
              break
          }
        }
      }

      return ret
    },

    async setAdvancedKeys(profile, start, advancedKeys) {
      const partialSize = COMMAND_PARTIAL_SIZE(ADVANCED_KEYS_SIZE)

      for (let i = 0; i < Math.ceil(advancedKeys.length / partialSize); i++) {
        const partialAdvancedKeys = advancedKeys.slice(
          i * partialSize,
          Math.min(advancedKeys.length, (i + 1) * partialSize),
        )

        await sendReport(get(), DeviceCommand.SET_ADVANCED_KEYS, [
          profile,
          start + i * partialSize,
          partialAdvancedKeys.length,
          ...partialAdvancedKeys.flatMap(({ layer, key, ak }) => {
            const buffer = [layer, key, ak.type]

            switch (ak.type) {
              case DeviceAKType.NULL_BIND:
                buffer.push(ak.secondaryKey, ak.behavior, ak.bottomOutPoint)
                break

              case DeviceAKType.DYNAMIC_KEYSTROKE:
                buffer.push(
                  ...ak.keycodes,
                  ...ak.bitmap.map((actions) =>
                    actions.reduce((acc, val, i) => acc | (val << (i * 2)), 0),
                  ),
                  ak.bottomOutPoint,
                )
                break

              case DeviceAKType.TAP_HOLD:
                buffer.push(ak.tapKeycode, ak.holdKeycode)
                buffer.push(
                  (ak.tappingTerm >> 0) & 0xff,
                  (ak.tappingTerm >> 8) & 0xff,
                )
                buffer.push(ak.holdOnOtherKeyPress ? 1 : 0)
                break

              case DeviceAKType.TOGGLE:
                buffer.push(ak.keycode)
                buffer.push(
                  (ak.tappingTerm >> 0) & 0xff,
                  (ak.tappingTerm >> 8) & 0xff,
                )
                break

              case DeviceAKType.NONE:
              default:
                break
            }
            buffer.push(...Array(ADVANCED_KEYS_SIZE - buffer.length).fill(0))

            return buffer
          }),
        ])
      }
    },

    async getTickRate(profile) {
      const response = await sendReport(get(), DeviceCommand.GET_TICK_RATE, [
        profile,
      ])

      return response.getUint8(1)
    },

    async setTickRate(profile, tickRate) {
      await sendReport(get(), DeviceCommand.SET_TICK_RATE, [profile, tickRate])
    },
  })),
)
