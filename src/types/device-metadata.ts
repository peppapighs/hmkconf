import { NUM_LAYERS } from "@/constants/devices"
import { z } from "zod"

const keyboardLayoutSchema = z.array(
  z.array(
    z.object({
      key: z.number().int().min(0).max(255),
      w: z.number().min(1).default(1),
      h: z.number().min(1).default(1),
      x: z.number().default(0),
      y: z.number().default(0),
    }),
  ),
)

export type KeyboardLayout = z.infer<typeof keyboardLayoutSchema>

export const deviceMetadataSchema = z
  .object({
    name: z.string(),
    vendorId: z.number().int().min(0x0000).max(0xffff),
    productId: z.number().int().min(0x0000).max(0xffff),
    numKeys: z.number().int().min(1).max(256),
    numAKC: z.number().int().min(1).max(256),
    layout: keyboardLayoutSchema,
    defaultKeymap: z.array(z.array(z.number().int().min(0).max(255))),
  })
  .refine(
    (data) =>
      data.defaultKeymap.length === NUM_LAYERS &&
      data.defaultKeymap.every((layer) => layer.length === data.numKeys),
  )

export type DeviceMetadata = z.infer<typeof deviceMetadataSchema>
