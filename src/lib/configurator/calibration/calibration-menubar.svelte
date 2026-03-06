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
  import * as KeyboardEditor from "$lib/components/keyboard-editor"
  import { Badge } from "$lib/components/ui/badge"
  import * as Tooltip from "$lib/components/ui/tooltip"
</script>

<KeyboardEditor.Menubar>
  <Tooltip.Root>
    <Tooltip.Trigger>
      <Badge variant="destructive">Warning</Badge>
    </Tooltip.Trigger>
    <Tooltip.Content class="max-w-sm text-wrap">
      This tab requests data from the keyboard at a high frequency, which may
      impact performance. Please close this tab or switch to another one when
      performing other performance-sensitive tasks with your keyboard.
    </Tooltip.Content>
  </Tooltip.Root>
  <KeyboardEditor.LayoutDialog />
</KeyboardEditor.Menubar>
