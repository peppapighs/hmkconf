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
  import FixedScrollArea from "$lib/components/fixed-scroll-area.svelte"
  import { Button } from "$lib/components/ui/button"
  import * as Empty from "$lib/components/ui/empty"
  import { keyboardContext } from "$lib/keyboard"
  import { HMK_AKType } from "$lib/libhmk/advanced-keys"
  import { advancedKeysStateContext } from "../context.svelte"
  import { advancedKeyMetadata } from "../lib/advanced-keys"
  import { advancedKeysQueryContext } from "../queries/advanced-keys-query.svelte"
  import AdvancedKeysActiveBinding from "./advanced-keys-active-binding.svelte"

  const advancedKeysState = advancedKeysStateContext.get()
  const { numAdvancedKeys } = keyboardContext.get().metadata

  const advancedKeysQuery = advancedKeysQueryContext.get()
  const { current: advancedKeys } = $derived(advancedKeysQuery.advancedKeys)

  const count = $derived(
    advancedKeys?.reduce(
      (acc, { action: { type } }) => acc + (type === HMK_AKType.NONE ? 0 : 1),
      0,
    ),
  )
</script>

<div class="grid size-full grid-cols-[28rem_minmax(0,1fr)]">
  <FixedScrollArea class="flex flex-col gap-4 p-4">
    <div class="font-semibold">Add Advanced Key</div>
    <div class="flex flex-col gap-2">
      {#each advancedKeyMetadata as { type, icon: Icon, title, description } (type)}
        <Button
          class="size-full gap-4 px-4 py-2"
          onclick={() => advancedKeysState.createOpen(type)}
          size="lg"
          variant="outline"
        >
          <Icon class="size-6" />
          <div class="grid text-left text-sm text-wrap">
            <span class="font-medium">{title}</span>
            <span class="font-normal text-muted-foreground">
              {description}
            </span>
          </div>
        </Button>
      {/each}
    </div>
  </FixedScrollArea>
  <FixedScrollArea class="flex flex-col gap-4 p-4">
    <div class="font-semibold">
      Active Advanced Keys ({String(count ?? 0).padStart(2, "0")}/{String(
        numAdvancedKeys,
      ).padStart(2, "0")})
    </div>
    {#if !advancedKeys || !count}
      <Empty.Root class="border border-dashed">
        <Empty.Header>
          <Empty.Description>No active advanced keys...</Empty.Description>
        </Empty.Header>
      </Empty.Root>
    {:else}
      <div class="flex flex-col gap-2">
        {#each advancedKeys as advancedKey, i (i)}
          {#if advancedKey.action.type !== HMK_AKType.NONE}
            <AdvancedKeysActiveBinding index={i} {advancedKey} />
          {/if}
        {/each}
      </div>
    {/if}
  </FixedScrollArea>
</div>
