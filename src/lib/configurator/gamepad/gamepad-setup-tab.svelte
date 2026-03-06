<!--
This program is free software: you can redistribute it and/or modify it under
the terms of the GNU General Public License as published by the Free Software
Foundation, either version 3 of the License, or (at your option) any later
version.

This program is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
FOR A PARTICULAR PURPOSE. See the GNU General Public License for more
details.

You should have received a copy of the GNU General Public License along with
this program. If not, see <https://www.gnu.org/licenses/>.
-->

<script lang="ts">
  import FixedScrollArea from "$lib/components/fixed-scroll-area.svelte"
  import { KeycodeButton } from "$lib/components/keycode-button"
  import Switch from "$lib/components/switch.svelte"
  import { gamepadButtonToKeycode } from "$lib/keycodes/gamepad"
  import { unitToStyle } from "$lib/ui"
  import { cn, type WithoutChildren } from "$lib/utils"
  import type { HTMLAttributes } from "svelte/elements"
  import { gamepadStateContext } from "../context.svelte"
  import { gamepadButtons } from "../lib/gamepad"
  import { gamepadQueryContext } from "../queries/gamepad-query.svelte"

  const {
    class: className,
    ...props
  }: WithoutChildren<HTMLAttributes<HTMLDivElement>> = $props()

  const gamepadState = gamepadStateContext.get()
  const { key } = $derived(gamepadState)

  const gamepadQuery = gamepadQueryContext.get()
  const { current: options } = $derived(gamepadQuery.gamepadOptions)
</script>

<div class={cn("grid grid-cols-[minmax(0,1fr)_28rem]", className)} {...props}>
  <FixedScrollArea class="flex flex-col gap-4 p-6 pt-2 pr-4">
    <div class="grid text-sm">
      <span class="font-medium">Configure Controller Bindings</span>
      <span class="text-muted-foreground">
        Assign gamepad buttons to your keyboard.
      </span>
    </div>
    <div class="flex flex-wrap text-sm">
      {#each gamepadButtons as button (button)}
        <div class="p-0.5" style={unitToStyle()}>
          <KeycodeButton
            keycode={gamepadButtonToKeycode(button)}
            onclick={() => {
              if (key === null) return
              gamepadQuery.setButtons({ offset: key, data: [button] })
              gamepadState.key = null
            }}
            showTooltip
          />
        </div>
      {/each}
    </div>
  </FixedScrollArea>
  <FixedScrollArea class="flex flex-col gap-4 p-6 pt-2 pl-4">
    <Switch
      bind:checked={
        () => options?.keyboardEnabled ?? false,
        (v) =>
          options &&
          gamepadQuery.setOptions({
            data: { ...options, keyboardEnabled: v, gamepadOverride: false },
          })
      }
      description="Allow keyboard inputs to be sent along with gamepad inputs."
      disabled={!options}
      id="keyboard-enabled"
      title="Enable Keyboard Inputs"
    />
    <Switch
      bind:checked={
        () => options?.gamepadOverride ?? false,
        (v) =>
          options &&
          gamepadQuery.setOptions({
            data: { ...options, gamepadOverride: v },
          })
      }
      description="Disable keyboard inputs on keys bound to gamepad buttons."
      disabled={!options || !options.keyboardEnabled}
      id="gamepad-override"
      title="Gamepad Override"
    />
  </FixedScrollArea>
</div>
