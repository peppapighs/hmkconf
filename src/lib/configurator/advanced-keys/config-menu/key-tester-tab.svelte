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
  import * as KeyTester from "$lib/components/key-tester"
  import { cn, type WithoutChildren } from "$lib/utils"
  import type { HTMLAttributes } from "svelte/elements"

  const {
    class: className,
    ...props
  }: WithoutChildren<HTMLAttributes<HTMLDivElement>> = $props()
</script>

<KeyTester.Root>
  <div class={cn("flex flex-col gap-4", className)} {...props}>
    <div class="flex flex-col gap-2">
      <div class="text-sm font-medium">Pressed Keys</div>
      <KeyTester.Press class="h-24 max-w-72" />
    </div>
    <div class="flex flex-col gap-2">
      <div class="text-sm font-medium">Released Keys</div>
      <KeyTester.Release class="h-24 max-w-72" />
    </div>
  </div>
</KeyTester.Root>
