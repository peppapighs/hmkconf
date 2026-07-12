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

import {
  CrosshairIcon,
  Gamepad2Icon,
  GaugeIcon,
  Grid2x2Icon,
  PencilIcon,
  SettingsIcon,
  SquareChevronUpIcon,
} from "@lucide/svelte"
import type { Component } from "svelte"
import type { ConfiguratorTabs } from "../context.svelte"

export const MIN_WINDOW_WIDTH = 1024
export const MIN_WINDOW_HEIGHT = 768

export type SidebarTabGroup = {
  group: string
  tabs: {
    label: string
    value: ConfiguratorTabs
    icon: Component
  }[]
}

export const sidebarTabGroups: SidebarTabGroup[] = [
  {
    group: "Profiles",
    tabs: [{ label: "Profiles", value: "profiles", icon: Grid2x2Icon }],
  },
  {
    group: "Keyboard Configuration",
    tabs: [
      { label: "Remap", value: "remap", icon: PencilIcon },
      { label: "Performance", value: "performance", icon: GaugeIcon },
      {
        label: "Advanced Keys",
        value: "advanced-keys",
        icon: SquareChevronUpIcon,
      },
      { label: "Gamepad", value: "gamepad", icon: Gamepad2Icon },
      { label: "Calibration", value: "calibration", icon: CrosshairIcon },
    ],
  },
  {
    group: "Settings",
    tabs: [{ label: "Settings", value: "settings", icon: SettingsIcon }],
  },
]
