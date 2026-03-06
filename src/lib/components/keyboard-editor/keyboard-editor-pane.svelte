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
  import type { ComponentProps } from "svelte"
  import { ResizablePane } from "../ui/resizable"

  const { children, ...props }: ComponentProps<typeof ResizablePane> = $props()
</script>

<ResizablePane defaultSize={50} minSize={30} {...props}>
  <div class="flex h-full flex-col">
    {@render children?.()}
  </div>
</ResizablePane>
