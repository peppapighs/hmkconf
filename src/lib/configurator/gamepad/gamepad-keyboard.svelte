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
  import { KeyboardEditorKeyboard } from "$lib/components/keyboard-editor"
  import * as KeycodeButton from "$lib/components/keycode-button"
  import { gamepadButtonToKeycode } from "$lib/keycodes/gamepad"
  import { HMK_GamepadButton } from "$lib/libhmk/gamepad"
  import { numberNullable, stringNullable } from "$lib/utils"
  import { ToggleGroup } from "bits-ui"
  import { gamepadStateContext } from "../context.svelte"
  import { gamepadQueryContext } from "../queries/gamepad-query.svelte"
  import { keymapQueryContext } from "../queries/keymap-query.svelte"

  const gamepadState = gamepadStateContext.get()
  const { key } = $derived(gamepadState)

  const gamepadQuery = gamepadQueryContext.get()
  const { current: gamepadButtons } = $derived(gamepadQuery.gamepadButtons)
  const { current: keymap } = $derived(keymapQueryContext.get().keymap)
</script>

<ToggleGroup.Root
  bind:value={
    () => stringNullable(key), (v) => (gamepadState.key = numberNullable(v))
  }
  type="single"
>
  {#snippet child({ props })}
    <KeyboardEditorKeyboard {...props}>
      {#snippet keyGenerator(key)}
        {#if !gamepadButtons || !keymap}
          <KeycodeButton.Skeleton />
        {:else}
          <ToggleGroup.Item
            oncontextmenu={(e) => {
              if (gamepadButtons[key] === HMK_GamepadButton.NONE) return
              e.preventDefault()
              gamepadQuery.setButtons({
                offset: key,
                data: [HMK_GamepadButton.NONE],
              })
            }}
            value={String(key)}
          >
            {#snippet child({ props })}
              <KeycodeButton.Root
                keycode={gamepadButtons[key] === HMK_GamepadButton.NONE
                  ? keymap[0][key]
                  : gamepadButtonToKeycode(gamepadButtons[key])}
                showTooltip={gamepadButtons[key] !== HMK_GamepadButton.NONE}
                {...props}
              />
            {/snippet}
          </ToggleGroup.Item>
        {/if}
      {/snippet}
    </KeyboardEditorKeyboard>
  {/snippet}
</ToggleGroup.Root>
