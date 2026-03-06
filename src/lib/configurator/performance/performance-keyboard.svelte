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
  import AreaSelect from "$lib/components/area-select.svelte"
  import { KeyboardEditorKeyboard } from "$lib/components/keyboard-editor"
  import * as KeycodeButton from "$lib/components/keycode-button"
  import { ToggleGroup } from "bits-ui"
  import { performanceStateContext } from "../context.svelte"
  import { actuationQueryContext } from "../queries/actuation-query.svelte"
  import { keymapQueryContext } from "../queries/keymap-query.svelte"
  import PerformanceKeyButton from "./performance-key-button.svelte"

  const performanceState = performanceStateContext.get()
  const { keys, showKeymap } = $derived(performanceState)

  const { current: keymap } = $derived(keymapQueryContext.get().keymap)
  const { current: actuationMap } = $derived(
    actuationQueryContext.get().actuationMap,
  )

  let isDragging = $state(false)
</script>

<svelte:document onmouseup={() => (isDragging = false)} />

<ToggleGroup.Root
  bind:value={() => [...keys].map(String), () => {}}
  type="multiple"
>
  {#snippet child({ props })}
    <AreaSelect
      bind:selections={
        () => performanceState.keys, (v) => (performanceState.keys = v)
      }
      class="flex flex-1 flex-col"
      {...props}
    >
      <KeyboardEditorKeyboard {...props}>
        {#snippet keyGenerator(key)}
          {#if !keymap || !actuationMap}
            <KeycodeButton.Skeleton />
          {:else}
            <ToggleGroup.Item
              data-selectable
              data-selectable-index={key}
              onmousedown={(e) => {
                e.stopPropagation()
                isDragging = true
                if (keys.has(key)) performanceState.keys.delete(key)
                else performanceState.keys.add(key)
              }}
              onmouseenter={(e) => {
                e.stopPropagation()
                if (isDragging) performanceState.keys.add(key)
              }}
              value={String(key)}
            >
              {#snippet child({ props })}
                {#if showKeymap}
                  <KeycodeButton.Root keycode={keymap[0][key]} {...props} />
                {:else}
                  <PerformanceKeyButton
                    actuation={actuationMap[key]}
                    {...props}
                  />
                {/if}
              {/snippet}
            </ToggleGroup.Item>
          {/if}
        {/snippet}
      </KeyboardEditorKeyboard>
    </AreaSelect>
  {/snippet}
</ToggleGroup.Root>
