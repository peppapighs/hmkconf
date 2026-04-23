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
  import { KeycodeButton } from "$lib/components/keycode-button"
  import type { HMK_AKDynamicKeystroke } from "$lib/libhmk/advanced-keys"
  import { Keycode } from "$lib/libhmk/keycodes"
  import { unitToStyle } from "$lib/ui"
  import { ToggleGroup } from "bits-ui"
  import { configMenuStateContext } from "../../context.svelte"

  const configMenuState = configMenuStateContext.get()
  const action = $derived(
    configMenuState.advancedKey.action as HMK_AKDynamicKeystroke,
  )
</script>

{#each action.keycodes as keycode, i (i)}
  <div class="grid place-items-center text-sm" style:grid-area="key{i}">
    <div class="p-0.5" style={unitToStyle()}>
      <ToggleGroup.Item value={String(i)}>
        {#snippet child({ props })}
          <KeycodeButton
            {keycode}
            oncontextmenu={(e) => {
              e.preventDefault()
              const keycodes = [...action.keycodes]
              keycodes[i] = Keycode.KC_NO
              configMenuState.updateAction({ ...action, keycodes })
            }}
            {...props}
          />
        {/snippet}
      </ToggleGroup.Item>
    </div>
  </div>
{/each}
