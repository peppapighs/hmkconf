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
  import * as Tooltip from "$lib/components/ui/tooltip"
  import {
    DKS_ACTION_SIZE,
    DKS_ROW_PADDING,
    dynamicKeystrokeHeaders,
  } from "$lib/configurator/lib/advanced-keys"
</script>

<div class="grid place-items-center" style="grid-area: bindings">
  <span class="text-sm font-medium">Bindings</span>
</div>
{#each dynamicKeystrokeHeaders as { icon: Icon, tooltip }, i (i)}
  <div class="flex items-center" style="grid-area: icon{i}">
    <Tooltip.Root>
      <Tooltip.Trigger
        class="-translate-x-1/2"
        style="margin-left: {DKS_ROW_PADDING + DKS_ACTION_SIZE / 2}px"
      >
        <Icon class="size-4" />
        <span class="sr-only">{tooltip}</span>
      </Tooltip.Trigger>
      <Tooltip.Content>{tooltip}</Tooltip.Content>
    </Tooltip.Root>
  </div>
{/each}
