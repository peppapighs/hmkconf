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
  import { analogInfoQueryContext } from "../queries/analog-info-query.svelte"
  import CalibrationKeyboard from "./calibration-keyboard.svelte"
  import CalibrationMenu from "./calibration-menu.svelte"
  import CalibrationMenubar from "./calibration-menubar.svelte"

  const {
    ...props
  }: WithoutChildren<ComponentProps<typeof KeyboardEditor.Root>> = $props()

  const { tab } = $derived(globalStateContext.get())
  const { demo } = keyboardContext.get()

  const analogInfoQuery = analogInfoQueryContext.get()

  $effect(() => {
    if (demo) return
    analogInfoQuery.enabled = tab === "calibration"
  })
</script>

<KeyboardEditor.Root {...props}>
  <KeyboardEditor.Pane>
    <CalibrationKeyboard />
    <CalibrationMenubar />
  </KeyboardEditor.Pane>
  <KeyboardEditor.Handle />
  <KeyboardEditor.Pane>
    <KeyboardEditor.Container>
      <CalibrationMenu />
    </KeyboardEditor.Container>
  </KeyboardEditor.Pane>
</KeyboardEditor.Root>
