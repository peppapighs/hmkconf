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
  import { cn } from "$lib/utils"
  import type { HTMLAttributes } from "svelte/elements"
  import { KeyboardEditorContainer } from "."

  const {
    children,
    class: className,
    ...props
  }: HTMLAttributes<HTMLElement> = $props()
</script>

<header class={cn("flex h-14 shrink-0 items-center", className)} {...props}>
  <KeyboardEditorContainer class="flex items-center justify-between gap-4 px-4">
    {@render children?.()}
  </KeyboardEditorContainer>
</header>
