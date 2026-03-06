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
  import KeycodeAccordion from "$lib/components/keycode-accordion.svelte"
  import type { HMK_AKDynamicKeystroke } from "$lib/libhmk/advanced-keys"
  import type { ComponentProps } from "svelte"
  import { configMenuStateContext } from "../context.svelte"
  import { dksConfigMenuStateContext } from "./context.svelte"

  const props: ComponentProps<typeof KeycodeAccordion> = $props()

  const configMenuState = configMenuStateContext.get()
  const action = $derived(
    configMenuState.advancedKey.action as HMK_AKDynamicKeystroke,
  )

  const dksConfigMenuState = dksConfigMenuStateContext.get()
  const { bindingIndex } = $derived(dksConfigMenuState)
</script>

<KeycodeAccordion
  onKeycodeSelected={(keycode) => {
    if (bindingIndex === null) return
    const keycodes = [...action.keycodes]
    keycodes[bindingIndex] = keycode
    configMenuState.updateAction({ ...action, keycodes })
    dksConfigMenuState.bindingIndex = null
  }}
  {...props}
/>
