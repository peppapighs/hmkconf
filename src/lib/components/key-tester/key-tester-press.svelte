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
  import { cn, type WithoutChildren } from "$lib/utils"
  import type { HTMLAttributes } from "svelte/elements"
  import FixedScrollArea from "../fixed-scroll-area.svelte"
  import { Badge } from "../ui/badge"
  import { keyTesterStateContext } from "./context.svelte"

  const {
    class: className,
    ...props
  }: WithoutChildren<HTMLAttributes<HTMLDivElement>> = $props()

  const { keyEvents } = $derived(keyTesterStateContext.get())
</script>

<div class={cn("overflow-hidden rounded-md border", className)} {...props}>
  <FixedScrollArea>
    <div class="flex flex-wrap gap-2 p-2">
      {#each keyEvents.filter(({ pressed }) => pressed) as { display }, i (i)}
        <Badge>{display}</Badge>
      {/each}
    </div>
  </FixedScrollArea>
</div>
