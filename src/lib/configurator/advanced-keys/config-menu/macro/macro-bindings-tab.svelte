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
  import { macrosQueryContext } from "$lib/configurator/queries/macros-query.svelte"
  import { HMK_MACRO_NODE_NONE } from "$lib/libhmk/macro"
  import type { ComponentProps } from "svelte"
  import { macroConfigMenuStateContext } from "./context.svelte"

  const props: ComponentProps<typeof KeycodeAccordion> = $props()

  const macroQuery = macrosQueryContext.get()
  const { current: macros } = $derived(macroQuery.macros)

  const macroConfigMenuState = macroConfigMenuStateContext.get()
  const { macroNodeId } = $derived(macroConfigMenuState)
</script>

<KeycodeAccordion
  onKeycodeSelected={(keycode) => {
    if (macroNodeId === null || !macros?.[macroNodeId]) return
    macroQuery.set({
      offset: macroNodeId,
      data: [{ ...macros[macroNodeId], keycode }],
    })
    macroConfigMenuState.macroNodeId =
      macros[macroNodeId].next === HMK_MACRO_NODE_NONE
        ? null
        : macros[macroNodeId].next
  }}
  {...props}
/>
