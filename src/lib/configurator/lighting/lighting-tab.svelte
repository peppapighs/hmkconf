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
  import { keyboardContext } from "$lib/keyboard"
  import type { WithoutChildren } from "$lib/utils"
  import type { ComponentProps } from "svelte"
  import { globalStateContext } from "../context.svelte"
  import LightingKeyboard from "./lighting-keyboard.svelte"
  import LightingMenu from "./lighting-menu.svelte"
  import { LightingState } from "./lighting-state.svelte"

  const {
    ...props
  }: WithoutChildren<ComponentProps<typeof KeyboardEditor.Root>> = $props()

  const globalState = globalStateContext.get()
  const state = new LightingState(keyboardContext.get())

  $effect(() => {
    if (globalState.tab !== "lighting" || state.negotiated) return
    // RGB failures stay local to this tab and cannot block other configurator
    // resources. Runtime capabilities remain authoritative over metadata.
    state.negotiated = true
    void state.negotiate()
  })
</script>

<KeyboardEditor.Root {...props}>
  <KeyboardEditor.Pane>
    <LightingKeyboard {state} />
  </KeyboardEditor.Pane>
  <KeyboardEditor.Handle />
  <KeyboardEditor.Pane>
    <KeyboardEditor.Container>
      <LightingMenu {state} />
    </KeyboardEditor.Container>
  </KeyboardEditor.Pane>
</KeyboardEditor.Root>
