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

import type { Commander } from "$lib/keyboard/commander"
import {
  hasRgbCapability,
  HMK_RGB_MAX_CHUNK_BYTES,
  HMK_RGB_PROTOCOL_MAJOR,
  HMK_RGBCapability,
  HMK_RGBEffect,
  type HMK_RGBCapabilities,
  type HMK_RGBColor,
  type HMK_RGBState,
} from "$lib/libhmk/rgb"
import { HMK_Command } from "."

type RGBCommander = Pick<Commander, "sendCommand">

export const HMK_RGBStatus = {
  OK: 0,
  ERROR: 1,
  INVALID_COMMAND: 2,
  INVALID_PARAMETER: 3,
} as const

export class HMK_RGBProtocolError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "HMK_RGBProtocolError"
  }
}

export class HMK_RGBCommandError extends HMK_RGBProtocolError {
  readonly command: HMK_Command
  readonly status: number

  constructor(command: HMK_Command, status: number) {
    super(
      `RGB command 0x${command.toString(16).padStart(2, "0")} was rejected with status ${status}.`,
    )
    this.name = "HMK_RGBCommandError"
    this.command = command
    this.status = status
  }
}

export class HMK_RGBRollbackError extends HMK_RGBProtocolError {
  readonly operationError: unknown
  readonly rollbackError: unknown

  constructor(operationError: unknown, rollbackError: unknown) {
    super(
      `RGB operation failed (${errorMessage(operationError)}); effect rollback also failed (${errorMessage(rollbackError)}).`,
    )
    this.name = "HMK_RGBRollbackError"
    this.operationError = operationError
    this.rollbackError = rollbackError
  }
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

function byte(value: number, label: string) {
  if (!Number.isInteger(value) || value < 0 || value > 0xff) {
    throw new RangeError(`${label} must be an integer between 0 and 255.`)
  }
  return value
}

function requireLength(
  response: DataView,
  length: number,
  command: HMK_Command,
) {
  if (response.byteLength < length) {
    throw new HMK_RGBProtocolError(
      `RGB command 0x${command.toString(16).padStart(2, "0")} returned ${response.byteLength} bytes; expected at least ${length}.`,
    )
  }
}

function responseBytes(response: DataView, offset: number, length: number) {
  requireLength(response, offset + length, HMK_Command.UNKNOWN)
  return new Uint8Array(response.buffer, response.byteOffset + offset, length)
}

async function exchangeRgb(
  commander: RGBCommander,
  command: HMK_Command,
  payload: readonly number[] = [],
  echoedPayloadLength = 0,
) {
  if (payload.length > 62) {
    throw new RangeError(
      "RGB payload exceeds the 62-byte command payload limit.",
    )
  }
  payload.forEach((value, index) => byte(value, `RGB payload byte ${index}`))

  // RGB bridge requests reserve raw byte 1. Commander owns raw byte 0, hence
  // the explicit leading zero in its payload.
  const response = await commander.sendCommand({
    command,
    payload: [0, ...payload],
  })
  requireLength(response, 1, command)
  const status = response.getUint8(0)
  if (status !== HMK_RGBStatus.OK) {
    throw new HMK_RGBCommandError(command, status)
  }

  if (echoedPayloadLength > 0) {
    requireLength(response, 1 + echoedPayloadLength, command)
    const expected = payload.slice(0, echoedPayloadLength)
    const echoed = [...responseBytes(response, 1, echoedPayloadLength)]
    if (!expected.every((value, index) => echoed[index] === value)) {
      throw new HMK_RGBProtocolError(
        `RGB command 0x${command.toString(16).padStart(2, "0")} returned a stale or mismatched acknowledgement.`,
      )
    }
  }
  return response
}

export function requireRgbCapability(
  capabilities: HMK_RGBCapabilities,
  capability: HMK_RGBCapability,
  label: string,
) {
  if (!hasRgbCapability(capabilities, capability)) {
    throw new HMK_RGBProtocolError(
      `The keyboard does not advertise RGB ${label}.`,
    )
  }
}

export async function getRgbCapabilities(
  commander: RGBCommander,
): Promise<HMK_RGBCapabilities> {
  const response = await exchangeRgb(
    commander,
    HMK_Command.GET_RGB_CAPABILITIES,
  )
  requireLength(response, 10, HMK_Command.GET_RGB_CAPABILITIES)
  const capabilities: HMK_RGBCapabilities = {
    protocolMajor: response.getUint8(1),
    protocolMinor: response.getUint8(2),
    ledCount: response.getUint8(3),
    bytesPerPixel: response.getUint8(4),
    chunkBytes: response.getUint8(5),
    liveEffectId: response.getUint8(6),
    capabilities: response.getUint16(7, true),
    colorOrder: response.getUint8(9),
  }

  if (capabilities.protocolMajor !== HMK_RGB_PROTOCOL_MAJOR) {
    throw new HMK_RGBProtocolError(
      `Unsupported RGB bridge protocol ${capabilities.protocolMajor}.${capabilities.protocolMinor}.`,
    )
  }
  if (
    capabilities.ledCount === 0 ||
    capabilities.bytesPerPixel !== 3 ||
    capabilities.chunkBytes === 0 ||
    capabilities.chunkBytes > HMK_RGB_MAX_CHUNK_BYTES ||
    capabilities.liveEffectId !== HMK_RGBEffect.LIVE ||
    capabilities.colorOrder !== 0
  ) {
    throw new HMK_RGBProtocolError(
      "The RGB bridge returned invalid geometry or color order.",
    )
  }
  const frameBytes = capabilities.ledCount * capabilities.bytesPerPixel
  if (Math.ceil(frameBytes / capabilities.chunkBytes) > 256) {
    throw new HMK_RGBProtocolError(
      "The RGB bridge frame requires more than 256 chunks.",
    )
  }
  return capabilities
}

export async function getRgbEnabled(
  commander: RGBCommander,
  capabilities: HMK_RGBCapabilities,
) {
  requireRgbCapability(
    capabilities,
    HMK_RGBCapability.ENABLED,
    "enabled control",
  )
  const response = await exchangeRgb(commander, HMK_Command.GET_LED_ENABLED)
  requireLength(response, 2, HMK_Command.GET_LED_ENABLED)
  const enabled = response.getUint8(1)
  if (enabled > 1) {
    throw new HMK_RGBProtocolError(
      "The RGB bridge returned an invalid enabled state.",
    )
  }
  return enabled !== 0
}

export async function setRgbEnabled(
  commander: RGBCommander,
  capabilities: HMK_RGBCapabilities,
  enabled: boolean,
) {
  requireRgbCapability(
    capabilities,
    HMK_RGBCapability.ENABLED,
    "enabled control",
  )
  await exchangeRgb(
    commander,
    HMK_Command.SET_LED_ENABLED,
    [enabled ? 1 : 0],
    1,
  )
}

export async function getRgbBrightness(
  commander: RGBCommander,
  capabilities: HMK_RGBCapabilities,
) {
  requireRgbCapability(
    capabilities,
    HMK_RGBCapability.BRIGHTNESS,
    "brightness control",
  )
  const response = await exchangeRgb(commander, HMK_Command.GET_LED_BRIGHTNESS)
  requireLength(response, 2, HMK_Command.GET_LED_BRIGHTNESS)
  return response.getUint8(1)
}

export async function setRgbBrightness(
  commander: RGBCommander,
  capabilities: HMK_RGBCapabilities,
  brightness: number,
) {
  requireRgbCapability(
    capabilities,
    HMK_RGBCapability.BRIGHTNESS,
    "brightness control",
  )
  await exchangeRgb(
    commander,
    HMK_Command.SET_LED_BRIGHTNESS,
    [byte(brightness, "Brightness")],
    1,
  )
}

export async function getRgbEffect(commander: RGBCommander) {
  const response = await exchangeRgb(commander, HMK_Command.GET_LED_EFFECT)
  requireLength(response, 2, HMK_Command.GET_LED_EFFECT)
  return response.getUint8(1)
}

export async function setRgbEffect(commander: RGBCommander, effect: number) {
  await exchangeRgb(
    commander,
    HMK_Command.SET_LED_EFFECT,
    [byte(effect, "RGB effect")],
    1,
  )
}

export async function restoreRgbEffect(commander: RGBCommander) {
  const response = await exchangeRgb(commander, HMK_Command.RESTORE_LED_EFFECT)
  requireLength(response, 2, HMK_Command.RESTORE_LED_EFFECT)
  return response.getUint8(1)
}

export async function getRgbPixel(
  commander: RGBCommander,
  capabilities: HMK_RGBCapabilities,
  index: number,
): Promise<HMK_RGBColor> {
  requireRgbCapability(capabilities, HMK_RGBCapability.PIXEL, "pixel control")
  if (!Number.isInteger(index) || index < 0 || index >= capabilities.ledCount) {
    throw new RangeError(
      `LED index must be an integer between 0 and ${capabilities.ledCount - 1}.`,
    )
  }
  const response = await exchangeRgb(
    commander,
    HMK_Command.GET_LED_PIXEL,
    [index],
    1,
  )
  requireLength(response, 5, HMK_Command.GET_LED_PIXEL)
  return [response.getUint8(2), response.getUint8(3), response.getUint8(4)]
}

function validateColor(color: HMK_RGBColor) {
  return color.map((value, index) =>
    byte(value, ["Red", "Green", "Blue"][index] ?? "Color"),
  ) as [number, number, number]
}

async function runInLiveMode<T>(
  commander: RGBCommander,
  capabilities: HMK_RGBCapabilities,
  operation: () => Promise<T>,
) {
  requireRgbCapability(capabilities, HMK_RGBCapability.LIVE_MODE, "live mode")
  const previousEffect = await getRgbEffect(commander)
  const transitioned = previousEffect !== capabilities.liveEffectId
  if (transitioned) {
    requireRgbCapability(
      capabilities,
      HMK_RGBCapability.RESTORE_MODE,
      "effect restore for rollback",
    )
    await setRgbEffect(commander, capabilities.liveEffectId)
  }

  try {
    return await operation()
  } catch (operationError) {
    if (transitioned) {
      try {
        await restoreRgbEffect(commander)
      } catch (rollbackError) {
        throw new HMK_RGBRollbackError(operationError, rollbackError)
      }
    }
    throw operationError
  }
}

export async function setRgbPixel(
  commander: RGBCommander,
  capabilities: HMK_RGBCapabilities,
  index: number,
  color: HMK_RGBColor,
) {
  requireRgbCapability(capabilities, HMK_RGBCapability.PIXEL, "pixel control")
  if (!Number.isInteger(index) || index < 0 || index >= capabilities.ledCount) {
    throw new RangeError(
      `LED index must be an integer between 0 and ${capabilities.ledCount - 1}.`,
    )
  }
  const rgb = validateColor(color)
  return runInLiveMode(commander, capabilities, async () => {
    await exchangeRgb(commander, HMK_Command.SET_LED_PIXEL, [index, ...rgb], 4)
  })
}

export async function fillRgb(
  commander: RGBCommander,
  capabilities: HMK_RGBCapabilities,
  color: HMK_RGBColor,
) {
  requireRgbCapability(capabilities, HMK_RGBCapability.FILL, "fill control")
  await exchangeRgb(commander, HMK_Command.LED_FILL, validateColor(color), 3)
}

export async function clearRgb(
  commander: RGBCommander,
  capabilities: HMK_RGBCapabilities,
) {
  requireRgbCapability(capabilities, HMK_RGBCapability.FILL, "fill control")
  await exchangeRgb(commander, HMK_Command.LED_CLEAR)
}

/** Compose STATIC + FILL and restore the original mode if persistence fails. */
export async function setRgbStaticColor(
  commander: RGBCommander,
  capabilities: HMK_RGBCapabilities,
  color: HMK_RGBColor,
) {
  requireRgbCapability(capabilities, HMK_RGBCapability.FILL, "fill control")
  const originalEffect = await getRgbEffect(commander)
  let persistentEffect = originalEffect
  if (originalEffect === capabilities.liveEffectId) {
    requireRgbCapability(
      capabilities,
      HMK_RGBCapability.RESTORE_MODE,
      "effect restore for static color",
    )
    persistentEffect = await restoreRgbEffect(commander)
  }

  try {
    await setRgbEffect(commander, HMK_RGBEffect.STATIC)
    await fillRgb(commander, capabilities, color)
  } catch (operationError) {
    try {
      await setRgbEffect(commander, persistentEffect)
      if (originalEffect === capabilities.liveEffectId) {
        await setRgbEffect(commander, capabilities.liveEffectId)
      }
    } catch (rollbackError) {
      throw new HMK_RGBRollbackError(operationError, rollbackError)
    }
    throw operationError
  }
}

export async function getRgbFrame(
  commander: RGBCommander,
  capabilities: HMK_RGBCapabilities,
) {
  requireRgbCapability(
    capabilities,
    HMK_RGBCapability.FRAME_CHUNKS,
    "frame chunks",
  )
  const frameBytes = capabilities.ledCount * capabilities.bytesPerPixel
  const frame = new Uint8Array(frameBytes)
  let offset = 0
  let chunk = 0
  while (offset < frameBytes) {
    const response = await exchangeRgb(
      commander,
      HMK_Command.GET_LED_ALL,
      [chunk],
      1,
    )
    requireLength(response, 3, HMK_Command.GET_LED_ALL)
    const length = response.getUint8(2)
    const expected = Math.min(capabilities.chunkBytes, frameBytes - offset)
    if (length !== expected) {
      throw new HMK_RGBProtocolError(
        `RGB frame chunk ${chunk} has length ${length}; expected ${expected}.`,
      )
    }
    requireLength(response, 3 + length, HMK_Command.GET_LED_ALL)
    frame.set(responseBytes(response, 3, length), offset)
    offset += length
    chunk += 1
  }
  return frame
}

function validateFrame(
  capabilities: HMK_RGBCapabilities,
  frame: ArrayLike<number>,
) {
  const expectedLength = capabilities.ledCount * capabilities.bytesPerPixel
  if (frame.length !== expectedLength) {
    throw new RangeError(
      `RGB frame has ${frame.length} bytes; expected ${expectedLength}.`,
    )
  }
  return Uint8Array.from(
    Array.from(frame, (value, index) => byte(value, `Frame byte ${index}`)),
  )
}

export async function writeRgbFrame(
  commander: RGBCommander,
  capabilities: HMK_RGBCapabilities,
  frame: ArrayLike<number>,
) {
  requireRgbCapability(
    capabilities,
    HMK_RGBCapability.FRAME_CHUNKS,
    "frame chunks",
  )
  const bytes = validateFrame(capabilities, frame)
  return runInLiveMode(commander, capabilities, async () => {
    for (
      let offset = 0, chunk = 0;
      offset < bytes.length;
      offset += capabilities.chunkBytes, chunk += 1
    ) {
      const data = bytes.slice(offset, offset + capabilities.chunkBytes)
      await exchangeRgb(
        commander,
        HMK_Command.SET_LED_ALL_CHUNK,
        [chunk, data.length, ...data],
        2,
      )
    }
  })
}

export async function getRgbState(
  commander: RGBCommander,
  capabilities: HMK_RGBCapabilities,
): Promise<HMK_RGBState> {
  const enabled = hasRgbCapability(capabilities, HMK_RGBCapability.ENABLED)
    ? await getRgbEnabled(commander, capabilities)
    : null
  const brightness = hasRgbCapability(
    capabilities,
    HMK_RGBCapability.BRIGHTNESS,
  )
    ? await getRgbBrightness(commander, capabilities)
    : null
  return {
    capabilities,
    enabled,
    brightness,
    effect: await getRgbEffect(commander),
  }
}
