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
  import { Button } from "$lib/components/ui/button"
  import { advancedKeysStateContext } from "$lib/configurator/context.svelte"
  import { getAdvancedKeyMetadata } from "$lib/configurator/lib/advanced-keys"
  import { advancedKeysQueryContext } from "$lib/configurator/queries/advanced-keys-query.svelte"
  import AdvancedKeysDeleteDialog from "../advanced-keys-delete-dialog.svelte"
  import ConfigMenuContent from "./config-menu-content.svelte"

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
  <div class="flex size-full flex-col">
    <div class="flex items-center justify-between gap-4 p-4">
      <div class="font-semibold">
        {getAdvancedKeyMetadata(advancedKey.action.type).title}
      </div>
      <div class="flex items-center gap-2">
        <AdvancedKeysDeleteDialog index={index!} {advancedKey}>
          {#snippet child({ props })}
            <Button size="sm" variant="destructive" {...props}>Delete</Button>
          {/snippet}
        </AdvancedKeysDeleteDialog>
        <Button onclick={() => advancedKeysState.setIndex(null)} size="sm">
          Done
        </Button>
      </div>
    </div>
    <ConfigMenuContent index={index!} {advancedKey} />
  </div>
{/if}
