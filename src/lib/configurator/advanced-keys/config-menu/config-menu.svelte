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
  import { advancedKeysStateContext } from "../../context.svelte"
  import { advancedKeysQueryContext } from "$lib/configurator/queries/advanced-keys-query.svelte"
  import ConfigMenuEditor from "./config-menu-editor.svelte"

  const advancedKeysState = advancedKeysStateContext.get()
  const { index } = $derived(advancedKeysState)

  const { current: advancedKeys } = $derived(
    advancedKeysQueryContext.get().advancedKeys,
  )

  const advancedKey = $derived(advancedKeys?.[index!])
</script>

{#if !advancedKey}
  <div class="grid size-full place-items-center p-6 text-center">
    <p class="animate-pulse text-2xl font-semibold text-muted-foreground">
      Loading...
    </p>
  </div>
{:else}
  <ConfigMenuEditor index={index!} {advancedKey} />
{/if}
