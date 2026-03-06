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
  import * as KeyboardEditor from "$lib/components/keyboard-editor"
  import type { WithoutChildren } from "$lib/utils"
  import type { ComponentProps } from "svelte"
  import { advancedKeysStateContext } from "../context.svelte"
  import AdvancedKeysCreateMenu from "./advanced-keys-create-menu.svelte"
  import AdvancedKeysKeyboard from "./advanced-keys-keyboard.svelte"
  import AdvancedKeysMainMenu from "./advanced-keys-main-menu.svelte"
  import AdvancedKeysMenubar from "./advanced-keys-menubar.svelte"
  import AdvancedKeysConfigMenu from "./config-menu/config-menu.svelte"

  const {
    ...props
  }: WithoutChildren<ComponentProps<typeof KeyboardEditor.Root>> = $props()

  const { index, create } = $derived(advancedKeysStateContext.get())
</script>

<KeyboardEditor.Root {...props}>
  <KeyboardEditor.Pane>
    <AdvancedKeysKeyboard />
    <AdvancedKeysMenubar />
  </KeyboardEditor.Pane>
  <KeyboardEditor.Handle />
  <KeyboardEditor.Pane>
    <KeyboardEditor.Container>
      {#if create !== null}
        <AdvancedKeysCreateMenu />
      {:else if index !== null}
        <AdvancedKeysConfigMenu />
      {:else}
        <AdvancedKeysMainMenu />
      {/if}
    </KeyboardEditor.Container>
  </KeyboardEditor.Pane>
</KeyboardEditor.Root>
