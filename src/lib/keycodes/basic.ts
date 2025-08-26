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

import { Keycode } from "$lib/libhmk/keycodes"
import type { KeycodeMetadata } from "."

export const basicKeycodeMetadata: KeycodeMetadata[] = [
  {
    name: "A",
    keycode: Keycode.KC_A,
    webCodes: ["KeyA"],
    category: "Basic",
  },
  {
    name: "B",
    keycode: Keycode.KC_B,
    webCodes: ["KeyB"],
    category: "Basic",
  },
  {
    name: "C",
    keycode: Keycode.KC_C,
    webCodes: ["KeyC"],
    category: "Basic",
  },
  {
    name: "D",
    keycode: Keycode.KC_D,
    webCodes: ["KeyD"],
    category: "Basic",
  },
  {
    name: "E",
    keycode: Keycode.KC_E,
    webCodes: ["KeyE"],
    category: "Basic",
  },
  {
    name: "F",
    keycode: Keycode.KC_F,
    webCodes: ["KeyF"],
    category: "Basic",
  },
  {
    name: "G",
    keycode: Keycode.KC_G,
    webCodes: ["KeyG"],
    category: "Basic",
  },
  {
    name: "H",
    keycode: Keycode.KC_H,
    webCodes: ["KeyH"],
    category: "Basic",
  },
  {
    name: "I",
    keycode: Keycode.KC_I,
    webCodes: ["KeyI"],
    category: "Basic",
  },
  {
    name: "J",
    keycode: Keycode.KC_J,
    webCodes: ["KeyJ"],
    category: "Basic",
  },
  {
    name: "K",
    keycode: Keycode.KC_K,
    webCodes: ["KeyK"],
    category: "Basic",
  },
  {
    name: "L",
    keycode: Keycode.KC_L,
    webCodes: ["KeyL"],
    category: "Basic",
  },
  {
    name: "M",
    keycode: Keycode.KC_M,
    webCodes: ["KeyM"],
    category: "Basic",
  },
  {
    name: "N",
    keycode: Keycode.KC_N,
    webCodes: ["KeyN"],
    category: "Basic",
  },
  {
    name: "O",
    keycode: Keycode.KC_O,
    webCodes: ["KeyO"],
    category: "Basic",
  },
  {
    name: "P",
    keycode: Keycode.KC_P,
    webCodes: ["KeyP"],
    category: "Basic",
  },
  {
    name: "Q",
    keycode: Keycode.KC_Q,
    webCodes: ["KeyQ"],
    category: "Basic",
  },
  {
    name: "R",
    keycode: Keycode.KC_R,
    webCodes: ["KeyR"],
    category: "Basic",
  },
  {
    name: "S",
    keycode: Keycode.KC_S,
    webCodes: ["KeyS"],
    category: "Basic",
  },
  {
    name: "T",
    keycode: Keycode.KC_T,
    webCodes: ["KeyT"],
    category: "Basic",
  },
  {
    name: "U",
    keycode: Keycode.KC_U,
    webCodes: ["KeyU"],
    category: "Basic",
  },
  {
    name: "V",
    keycode: Keycode.KC_V,
    webCodes: ["KeyV"],
    category: "Basic",
  },
  {
    name: "W",
    keycode: Keycode.KC_W,
    webCodes: ["KeyW"],
    category: "Basic",
  },
  {
    name: "X",
    keycode: Keycode.KC_X,
    webCodes: ["KeyX"],
    category: "Basic",
  },
  {
    name: "Y",
    keycode: Keycode.KC_Y,
    webCodes: ["KeyY"],
    category: "Basic",
  },
  {
    name: "Z",
    keycode: Keycode.KC_Z,
    webCodes: ["KeyZ"],
    category: "Basic",
  },
  {
    name: "!\n1",
    keycode: Keycode.KC_1,
    webCodes: ["Digit1"],
    category: "Basic",
  },
  {
    name: "@\n2",
    keycode: Keycode.KC_2,
    webCodes: ["Digit2"],
    category: "Basic",
  },
  {
    name: "#\n3",
    keycode: Keycode.KC_3,
    webCodes: ["Digit3"],
    category: "Basic",
  },
  {
    name: "$\n4",
    keycode: Keycode.KC_4,
    webCodes: ["Digit4"],
    category: "Basic",
  },
  {
    name: "%\n5",
    keycode: Keycode.KC_5,
    webCodes: ["Digit5"],
    category: "Basic",
  },
  {
    name: "^\n6",
    keycode: Keycode.KC_6,
    webCodes: ["Digit6"],
    category: "Basic",
  },
  {
    name: "&\n7",
    keycode: Keycode.KC_7,
    webCodes: ["Digit7"],
    category: "Basic",
  },
  {
    name: "*\n8",
    keycode: Keycode.KC_8,
    webCodes: ["Digit8"],
    category: "Basic",
  },
  {
    name: "(\n9",
    keycode: Keycode.KC_9,
    webCodes: ["Digit9"],
    category: "Basic",
  },
  {
    name: ")\n0",
    keycode: Keycode.KC_0,
    webCodes: ["Digit0"],
    category: "Basic",
  },
  {
    name: "_\n-",
    keycode: Keycode.KC_MINUS,
    webCodes: ["Minus"],
    category: "Basic",
  },
  {
    name: "+\n=",
    keycode: Keycode.KC_EQUAL,
    webCodes: ["Equal"],
    category: "Basic",
  },
  {
    name: "{\n[",
    keycode: Keycode.KC_LEFT_BRACKET,
    webCodes: ["BracketLeft"],
    category: "Basic",
  },
  {
    name: "}\n]",
    keycode: Keycode.KC_RIGHT_BRACKET,
    webCodes: ["BracketRight"],
    category: "Basic",
  },
  {
    name: "|\n\\",
    keycode: Keycode.KC_BACKSLASH,
    webCodes: ["Backslash"],
    category: "Basic",
  },
  {
    name: "ISO\n#",
    keycode: Keycode.KC_NONUS_HASH,
    webCodes: [
      /* Backslash */
    ],
    category: "Basic",
  },
  {
    name: ":\n;",
    keycode: Keycode.KC_SEMICOLON,
    webCodes: ["Semicolon"],
    category: "Basic",
  },
  {
    name: "\"\n'",
    keycode: Keycode.KC_QUOTE,
    webCodes: ["Quote"],
    category: "Basic",
  },
  {
    name: "~\n`",
    keycode: Keycode.KC_GRAVE,
    webCodes: ["Backquote"],
    category: "Basic",
  },
  {
    name: "<\n,",
    keycode: Keycode.KC_COMMA,
    webCodes: ["Comma"],
    category: "Basic",
  },
  {
    name: ">\n.",
    keycode: Keycode.KC_DOT,
    webCodes: ["Period"],
    category: "Basic",
  },
  {
    name: "?\n/",
    keycode: Keycode.KC_SLASH,
    webCodes: ["Slash"],
    category: "Basic",
  },
  {
    name: "ISO\n\\",
    keycode: Keycode.KC_NONUS_BACKSLASH,
    webCodes: ["IntlBackslash"],
    category: "Basic",
  },
]

export const basicKeycodes = [
  Keycode.KC_A,
  Keycode.KC_B,
  Keycode.KC_C,
  Keycode.KC_D,
  Keycode.KC_E,
  Keycode.KC_F,
  Keycode.KC_G,
  Keycode.KC_H,
  Keycode.KC_I,
  Keycode.KC_J,
  Keycode.KC_K,
  Keycode.KC_L,
  Keycode.KC_M,
  Keycode.KC_N,
  Keycode.KC_O,
  Keycode.KC_P,
  Keycode.KC_Q,
  Keycode.KC_R,
  Keycode.KC_S,
  Keycode.KC_T,
  Keycode.KC_U,
  Keycode.KC_V,
  Keycode.KC_W,
  Keycode.KC_X,
  Keycode.KC_Y,
  Keycode.KC_Z,
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
  Keycode.KC_GRAVE,
  Keycode.KC_MINUS,
  Keycode.KC_EQUAL,
  Keycode.KC_LEFT_BRACKET,
  Keycode.KC_RIGHT_BRACKET,
  Keycode.KC_BACKSLASH,
  Keycode.KC_SEMICOLON,
  Keycode.KC_QUOTE,
  Keycode.KC_COMMA,
  Keycode.KC_DOT,
  Keycode.KC_SLASH,
  Keycode.KC_NONUS_HASH,
  Keycode.KC_NONUS_BACKSLASH,
]
