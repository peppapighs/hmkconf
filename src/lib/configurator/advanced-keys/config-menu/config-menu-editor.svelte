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
  import { advancedKeysStateContext } from "../../context.svelte"
  import { getAdvancedKeyMetadata } from "$lib/configurator/lib/advanced-keys"
  import type { HMK_AdvancedKey } from "$lib/libhmk/advanced-keys"
  import AdvancedKeysDeleteDialog from "../advanced-keys-delete-dialog.svelte"
  import ConfigMenuContent from "./config-menu-content.svelte"
  import { ConfigMenuState, configMenuStateContext } from "./context.svelte"

  const { index, advancedKey } = $props<{
    index: number
    advancedKey: HMK_AdvancedKey
  }>()

  const advancedKeysState = advancedKeysStateContext.get()
  const configMenuState = configMenuStateContext.set(
    new ConfigMenuState(() => ({ index, advancedKey })),
  )
  const currentAdvancedKey = $derived(configMenuState.advancedKey)
</script>

<div class="flex size-full flex-col">
  <div class="flex items-center justify-between gap-4 p-4">
    <div class="font-semibold">
      {getAdvancedKeyMetadata(currentAdvancedKey.action.type).title}
    </div>
    <div class="flex items-center gap-2">
      <AdvancedKeysDeleteDialog index={index} advancedKey={advancedKey}>
        {#snippet child({ props })}
          <Button size="sm" variant="destructive" {...props}>Delete</Button>
        {/snippet}
      </AdvancedKeysDeleteDialog>
      <Button
        onclick={() => advancedKeysState.setIndex(null)}
        size="sm"
        variant="outline"
      >
        Cancel
      </Button>
      <Button
        disabled={configMenuState.saving}
        onclick={async () => {
          await configMenuState.save()
          advancedKeysState.setIndex(null)
        }}
        size="sm"
      >
        {configMenuState.saving ? "Saving..." : "Save"}
      </Button>
    </div>
  </div>
  <ConfigMenuContent {index} advancedKey={currentAdvancedKey} />
</div>
