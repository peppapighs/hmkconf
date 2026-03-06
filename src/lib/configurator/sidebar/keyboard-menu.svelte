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
  import {
    CableIcon,
    ChevronsUpDownIcon,
    KeyboardIcon,
    LogOutIcon,
  } from "@lucide/svelte"
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu"
  import * as Sidebar from "$lib/components/ui/sidebar"
  import { displayUInt16 } from "$lib/integer"
  import { keyboardContext } from "$lib/keyboard"

  const keyboard = keyboardContext.get()
  const {
    demo,
    metadata: { name, vendorId, productId },
  } = keyboard
</script>

<Sidebar.Menu>
  <Sidebar.MenuItem>
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        {#snippet child({ props })}
          <Sidebar.MenuButton
            class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            size="lg"
            {...props}
          >
            <div
              class="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"
            >
              <KeyboardIcon class="size-4" />
            </div>
            <div class="grid flex-1 text-left text-sm leading-tight">
              <span class="truncate font-medium">{name}</span>
              <span class="truncate font-mono text-xs">
                {displayUInt16(vendorId)}
                {displayUInt16(productId)}
              </span>
            </div>
            <ChevronsUpDownIcon class="ml-auto" />
          </Sidebar.MenuButton>
        {/snippet}
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        align="start"
        class="w-(--bits-dropdown-menu-anchor-width) min-w-56 rounded-lg"
      >
        {#if demo}
          <DropdownMenu.Item class="gap-2 p-2">
            {#snippet child({ props })}
              <a href="/" {...props}>
                <LogOutIcon class="size-4" />
                Exit Demo
              </a>
            {/snippet}
          </DropdownMenu.Item>
        {:else}
          <DropdownMenu.Item
            class="gap-2 p-2"
            onSelect={() => keyboard.forget()}
          >
            <CableIcon class="size-4" />
            Disconnect
          </DropdownMenu.Item>
        {/if}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  </Sidebar.MenuItem>
</Sidebar.Menu>
