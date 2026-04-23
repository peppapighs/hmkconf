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
  import { DKS_BIT_COLUMN_WIDTH } from "$lib/configurator/lib/advanced-keys"
  import { keyboardContext } from "$lib/keyboard"
  import { numberNullable, stringNullable } from "$lib/utils"
  import { ToggleGroup } from "bits-ui"
  import { dksConfigMenuStateContext } from "../context.svelte"
  import ActionsHeaders from "./actions-headers.svelte"
  import ActionsKeycodes from "./actions-keycodes.svelte"
  import ActionsRow from "./actions-row.svelte"

  const { numDynamicKeystrokeMaxBindings } = keyboardContext.get().metadata
  const dksConfigMenuState = dksConfigMenuStateContext.get()
  const { bindingIndex } = $derived(dksConfigMenuState)
</script>

<ToggleGroup.Root
  bind:value={
    () => stringNullable(bindingIndex),
    (v) => (dksConfigMenuState.bindingIndex = numberNullable(v))
  }
  type="single"
>
  {#snippet child({ props })}
    <div
      class="grid gap-y-2 select-none"
      style:grid-template-rows="2rem repeat({numDynamicKeystrokeMaxBindings},
      minmax(0, 1fr))"
      style:grid-template-columns="5rem repeat(4, {DKS_BIT_COLUMN_WIDTH}px)"
      style:grid-template-areas={[
        "'bindings icon0 icon1 icon2 icon3'",
        ...[...Array(numDynamicKeystrokeMaxBindings)].map(
          (_, i) => `'key${i} action${i} action${i} action${i} action${i}'`,
        ),
      ].join("\n")}
      {...props}
    >
      <ActionsHeaders />
      <ActionsKeycodes />
      {#each { length: numDynamicKeystrokeMaxBindings }, row (row)}
        <ActionsRow {row} />
      {/each}
    </div>
  {/snippet}
</ToggleGroup.Root>
