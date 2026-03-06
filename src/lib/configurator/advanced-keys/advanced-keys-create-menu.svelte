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
  import { KeyButton } from "$lib/components/key-button"
  import * as KeycodeButton from "$lib/components/keycode-button"
  import { Button } from "$lib/components/ui/button"
  import { HMK_AKType } from "$lib/libhmk/advanced-keys"
  import { unitToStyle } from "$lib/ui"
  import { stringNullable } from "$lib/utils"
  import { ToggleGroup } from "bits-ui"
  import { advancedKeysStateContext } from "../context.svelte"
  import {
    createAdvancedKey,
    getAdvancedKeyMetadata,
  } from "../lib/advanced-keys"
  import { advancedKeysQueryContext } from "../queries/advanced-keys-query.svelte"
  import { keymapQueryContext } from "../queries/keymap-query.svelte"

  const advancedKeysState = advancedKeysStateContext.get()
  const { layer, create } = $derived(advancedKeysState)
  const { type, keyIndex, keys } = $derived(create!)

  const advancedKeysQuery = advancedKeysQueryContext.get()
  const { current: advancedKeys } = $derived(advancedKeysQuery.advancedKeys)
  const { current: keymap } = $derived(keymapQueryContext.get().keymap)

  const { title, description, numKeys } = $derived(getAdvancedKeyMetadata(type))
</script>

<FixedScrollArea class="flex flex-col gap-2 p-4">
  <div class="flex items-center justify-between gap-4">
    <div class="font-semibold">{title}</div>
    <div class="flex items-center gap-2">
      <Button
        onclick={() => advancedKeysState.createClose()}
        size="sm"
        variant="outline"
      >
        Cancel
      </Button>
      <Button
        disabled={!advancedKeys || !keymap || keys.some((key) => key === null)}
        onclick={() => {
          if (!advancedKeys || !keymap) return
          const index = advancedKeys.findIndex(
            ({ action: { type } }) => type === HMK_AKType.NONE,
          )
          if (index !== -1) {
            advancedKeysQuery.set({
              offset: index,
              data: [
                createAdvancedKey({
                  layer,
                  type,
                  keys: keys as number[],
                  keycodes: keys.map((key) => keymap[layer][key!]),
                }),
              ],
            })
            advancedKeysState.setIndex(index)
          }
        }}
        size="sm"
      >
        Continue
      </Button>
    </div>
  </div>
  <div class="flex flex-col gap-4">
    <div class="grid text-sm">
      <span class="font-medium">
        {`Select ${numKeys > 1 ? `${numKeys} keys` : `${numKeys} key`} to assign ${title} to.`}
      </span>
      <span class="text-muted-foreground">{description}</span>
    </div>
    <div class="grid place-items-center">
      <ToggleGroup.Root
        bind:value={
          () => stringNullable(keyIndex),
          (v) => v !== "" && advancedKeysState.createSetKeyIndex(Number(v))
        }
        class="flex"
        type="single"
      >
        {#each { length: numKeys }, i (i)}
          <div class="flex flex-col items-center text-center text-base">
            <div class="text-muted-foreground">Key {i + 1}</div>
            <div class="p-0.5" style={unitToStyle()}>
              {#if !advancedKeys || !keymap}
                <KeycodeButton.Skeleton />
              {:else}
                <ToggleGroup.Item value={String(i)}>
                  {#snippet child({ props })}
                    {#if keys[i] !== null}
                      <KeycodeButton.Root
                        keycode={keymap[layer][keys[i]]}
                        {...props}
                      />
                    {:else}
                      <KeyButton
                        class="border-dashed font-normal text-muted-foreground"
                        {...props}
                      >
                        <span>Assign</span>
                      </KeyButton>
                    {/if}
                  {/snippet}
                </ToggleGroup.Item>
              {/if}
            </div>
          </div>
        {/each}
      </ToggleGroup.Root>
    </div>
  </div>
</FixedScrollArea>
