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
  import * as Sidebar from "$lib/components/ui/sidebar"
  import { Tabs } from "bits-ui"
  import KeyboardMenu from "./keyboard-menu.svelte"
  import SidebarTabs from "./sidebar-tabs.svelte"
  import VersionFooter from "./version-footer.svelte"
</script>

<Tabs.List>
  <Sidebar.Root collapsible="icon">
    <Sidebar.Header>
      <KeyboardMenu />
    </Sidebar.Header>
    <Sidebar.Content>
      <SidebarTabs />
    </Sidebar.Content>
    <Sidebar.Footer>
      <VersionFooter />
    </Sidebar.Footer>
    <Sidebar.Rail />
  </Sidebar.Root>
</Tabs.List>
