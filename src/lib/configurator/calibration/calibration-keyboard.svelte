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
  import * as KeyButton from "$lib/components/key-button"
  import { KeyboardEditorKeyboard } from "$lib/components/keyboard-editor"
  import { displayDistance } from "$lib/distance"
  import { analogInfoQueryContext } from "../queries/analog-info-query.svelte"

  const { current: analogInfo } = $derived(
    analogInfoQueryContext.get().analogInfo,
  )
</script>

<KeyboardEditorKeyboard>
  {#snippet keyGenerator(key)}
    {#if !analogInfo}
      <KeyButton.Skeleton />
    {:else}
      <KeyButton.Root>
        <span>{analogInfo[key].adcValue}</span>
        <span>{displayDistance(analogInfo[key].distance)}</span>
      </KeyButton.Root>
    {/if}
  {/snippet}
</KeyboardEditorKeyboard>
