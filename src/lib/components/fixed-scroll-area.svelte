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
  import type { Snippet } from "svelte"
  import type { HTMLAttributes } from "svelte/elements"
  import { ScrollArea } from "./ui/scroll-area"

  const {
    children,
    child,
    ...props
  }: HTMLAttributes<HTMLDivElement> & {
    child?: Snippet<[{ props: Record<string, unknown> }]>
  } = $props()
</script>

<div class="relative size-full">
  <ScrollArea class="absolute! inset-0">
    {#if child}
      {@render child({ props })}
    {:else}
      <div {...props}>
        {@render children?.()}
      </div>
    {/if}
  </ScrollArea>
</div>
