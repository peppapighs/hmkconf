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
  import { getKeycodeMetadata } from "$lib/keycodes"
  import type { Snippet } from "svelte"
  import * as Tooltip from "../ui/tooltip"

  const {
    children,
    keycode,
    showTooltip,
  }: {
    children?: Snippet
    keycode: number
    showTooltip?: boolean
  } = $props()

  const { tooltip } = $derived(getKeycodeMetadata(keycode))
</script>

{#if !showTooltip || !tooltip}
  {@render children?.()}
{:else}
  <Tooltip.Root disableHoverableContent>
    <Tooltip.Trigger class="size-full">
      {#snippet child({ props })}
        <div {...props}>
          {@render children?.()}
        </div>
      {/snippet}
    </Tooltip.Trigger>
    <Tooltip.Content class="max-w-56 text-wrap">{tooltip}</Tooltip.Content>
  </Tooltip.Root>
{/if}
