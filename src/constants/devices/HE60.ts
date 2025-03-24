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

import { DeviceMetadata, deviceMetadataSchema } from "@/types/device-metadata"
import { Keycode, MO, PF } from "@/types/keycodes"

export const HE60: DeviceMetadata = deviceMetadataSchema.parse({
  name: "HE60",
  vendorId: 0xab50,
  productId: 0xab60,
  numProfiles: 4,
  numLayers: 4,
  numKeys: 67,
  numAdvancedKeys: 32,
  layout: [
    [
      { key: 0 },
      { key: 1 },
      { key: 2 },
      { key: 3 },
      { key: 4 },
      { key: 5 },
      { key: 6 },
      { key: 7 },
      { key: 8 },
      { key: 9 },
      { key: 10 },
      { key: 11 },
      { key: 12 },
      { key: 14, w: 2 },
      { key: 13 },
      { key: 15 },
    ],
    [
      { key: 16, w: 1.5 },
      { key: 17 },
      { key: 18 },
      { key: 19 },
      { key: 20 },
      { key: 21 },
      { key: 22 },
      { key: 23 },
      { key: 24 },
      { key: 25 },
      { key: 26 },
      { key: 27 },
      { key: 28 },
      { key: 29, w: 1.5 },
    ],
    [
      { key: 30, w: 1.75 },
      { key: 31 },
      { key: 32 },
      { key: 33 },
      { key: 34 },
      { key: 35 },
      { key: 36 },
      { key: 37 },
      { key: 38 },
      { key: 39 },
      { key: 40 },
      { key: 41 },
      { key: 42, w: 2.25 },
    ],
    [
      { key: 43, w: 2.25 },
      { key: 44 },
      { key: 45 },
      { key: 46 },
      { key: 47 },
      { key: 48 },
      { key: 49 },
      { key: 50 },
      { key: 51 },
      { key: 52 },
      { key: 53 },
      { key: 54, w: 1.75 },
      { key: 55 },
    ],
    [
      { key: 56, w: 1.5 },
      { key: 57 },
      { key: 58, w: 1.5 },
      { key: 61, w: 7 },
      { key: 64, w: 1.5 },
      { key: 65 },
      { key: 66, w: 1.5 },
    ],
    [
      { key: 59, x: 4 },
      { key: 60, w: 2.25 },
      { key: 62, w: 2.75 },
      { key: 63 },
    ],
  ],
  defaultKeymap: [
    [
      Keycode.KC_ESC,
      Keycode.KC_1,
      Keycode.KC_2,
      Keycode.KC_3,
      Keycode.KC_4,
      Keycode.KC_5,
      Keycode.KC_6,
      Keycode.KC_7,
      Keycode.KC_8,
      Keycode.KC_9,
      Keycode.KC_0,
      Keycode.KC_EQL,
      Keycode.KC_MINS,
      Keycode.KC_BSLS,
      Keycode._______,
      Keycode.KC_DEL, // Row 1
      Keycode.KC_TAB,
      Keycode.KC_Q,
      Keycode.KC_W,
      Keycode.KC_E,
      Keycode.KC_R,
      Keycode.KC_T,
      Keycode.KC_Y,
      Keycode.KC_U,
      Keycode.KC_I,
      Keycode.KC_O,
      Keycode.KC_P,
      Keycode.KC_LBRC,
      Keycode.KC_RBRC,
      Keycode.KC_BSPC, // Row 2
      Keycode.KC_CAPS,
      Keycode.KC_A,
      Keycode.KC_S,
      Keycode.KC_D,
      Keycode.KC_F,
      Keycode.KC_G,
      Keycode.KC_H,
      Keycode.KC_J,
      Keycode.KC_K,
      Keycode.KC_L,
      Keycode.KC_SCLN,
      Keycode.KC_QUOT,
      Keycode.KC_ENT, // Row 3
      Keycode.KC_LSFT,
      Keycode.KC_Z,
      Keycode.KC_X,
      Keycode.KC_C,
      Keycode.KC_V,
      Keycode.KC_B,
      Keycode.KC_N,
      Keycode.KC_M,
      Keycode.KC_COMM,
      Keycode.KC_DOT,
      Keycode.KC_SLSH,
      Keycode.KC_RSFT,
      MO(1), // Row 4
      Keycode.KC_LCTL,
      Keycode.KC_LGUI,
      Keycode.KC_LALT,
      Keycode._______,
      Keycode._______,
      Keycode.KC_SPC,
      Keycode._______,
      Keycode._______,
      Keycode.KC_RALT,
      Keycode.KC_RGUI,
      Keycode.KC_RCTL, // Row 5
    ],
    [
      Keycode.KC_GRV,
      Keycode.KC_F1,
      Keycode.KC_F2,
      Keycode.KC_F3,
      Keycode.KC_F4,
      Keycode.KC_F5,
      Keycode.KC_F6,
      Keycode.KC_F7,
      Keycode.KC_F8,
      Keycode.KC_F9,
      Keycode.KC_F10,
      Keycode.KC_F11,
      Keycode.KC_F12,
      Keycode._______,
      Keycode._______,
      Keycode.KC_INS, // Row 1
      Keycode.KC_PSCR,
      Keycode._______,
      Keycode.KC_PGUP,
      Keycode._______,
      Keycode._______,
      Keycode._______,
      Keycode._______,
      Keycode._______,
      Keycode._______,
      PF(0),
      PF(1),
      PF(2),
      PF(3),
      Keycode._______, // Row 2
      Keycode._______,
      Keycode.KC_HOME,
      Keycode.KC_PGDN,
      Keycode.KC_END,
      Keycode._______,
      Keycode._______,
      Keycode._______,
      Keycode.KC_MPRV,
      Keycode.KC_MPLY,
      Keycode.KC_MNXT,
      Keycode._______,
      Keycode._______,
      Keycode.PF_SWAP, // Row 3
      Keycode._______,
      Keycode._______,
      Keycode._______,
      Keycode._______,
      Keycode._______,
      Keycode._______,
      Keycode._______,
      Keycode._______,
      Keycode.KC_MUTE,
      Keycode.KC_VOLD,
      Keycode.KC_VOLU,
      Keycode.KC_UP,
      Keycode._______, // Row 4
      Keycode._______,
      Keycode._______,
      Keycode._______,
      Keycode._______,
      Keycode._______,
      Keycode._______,
      Keycode._______,
      Keycode._______,
      Keycode.KC_LEFT,
      Keycode.KC_DOWN,
      Keycode.KC_RGHT, // Row 5
    ],
    Array(67).fill(Keycode._______),
    Array(67).fill(Keycode._______),
  ],
})
