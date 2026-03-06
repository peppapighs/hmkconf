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
  import { KeyboardEditorKeyboard } from "$lib/components/keyboard-editor"
  import * as KeycodeButton from "$lib/components/keycode-button"
  import { defaultAdvancedKey, HMK_AKType } from "$lib/libhmk/advanced-keys"
  import { Toggle } from "bits-ui"
  import { advancedKeysStateContext } from "../context.svelte"
  import { getAdvancedKeyMetadata } from "../lib/advanced-keys"
  import { advancedKeysQueryContext } from "../queries/advanced-keys-query.svelte"
  import { keymapQueryContext } from "../queries/keymap-query.svelte"

  const advancedKeysState = advancedKeysStateContext.get()
  const { layer, index, create } = $derived(advancedKeysState)

  const advancedKeysQuery = advancedKeysQueryContext.get()
  const { current: advancedKeys } = $derived(advancedKeysQuery.advancedKeys)
  const { current: keymap } = $derived(keymapQueryContext.get().keymap)

  const { disabled, advancedKeymap, indexMatrix } = $derived.by(() => {
    if (!advancedKeys || !keymap) {
      return { disabled: true } as const
    }

    const advancedKeymap = keymap.map((row) => [...row])
    const indexMatrix: (number | null)[][] = keymap.map((row) =>
      Array(row.length).fill(null),
    )
    for (let i = 0; i < advancedKeys.length; i++) {
      const { layer, key, action } = advancedKeys[i]
      if (action.type === HMK_AKType.NONE) continue

      const keys = [key]
      if (action.type === HMK_AKType.NULL_BIND) {
        keys.push(action.secondaryKey)
      }

      const { keycodes } = getAdvancedKeyMetadata(action.type)
      for (let j = 0; j < keys.length; j++) {
        advancedKeymap[layer][keys[j]] = keycodes[j]
        indexMatrix[layer][keys[j]] = i
      }
    }

    return { disabled: false, advancedKeymap, indexMatrix } as const
  })
</script>

<KeyboardEditorKeyboard>
  {#snippet keyGenerator(key)}
    {#if disabled}
      <KeycodeButton.Skeleton />
    {:else}
      <Toggle.Root
        bind:pressed={
          () =>
            create === null
              ? index !== null && index === indexMatrix[layer][key]
              : create.keys.includes(key),
          (v) =>
            create === null
              ? advancedKeysState.setIndex(v ? indexMatrix[layer][key] : null)
              : advancedKeysState.createSetKey(key)
        }
        disabled={create === null
          ? indexMatrix[layer][key] === null
          : indexMatrix[layer][key] !== null ||
            (!create.keys.includes(key) &&
              create.keys.every((key) => key !== null))}
        oncontextmenu={(e) => {
          if (create !== null || indexMatrix[layer][key] === null) return
          e.preventDefault()
          if (indexMatrix[layer][key] === index) {
            advancedKeysState.setIndex(null)
          }
          advancedKeysQuery.set({
            offset: indexMatrix[layer][key],
            data: [defaultAdvancedKey],
          })
        }}
      >
        {#snippet child({ props })}
          <KeycodeButton.Root keycode={advancedKeymap[layer][key]} {...props} />
        {/snippet}
      </Toggle.Root>
    {/if}
  {/snippet}
</KeyboardEditorKeyboard>
