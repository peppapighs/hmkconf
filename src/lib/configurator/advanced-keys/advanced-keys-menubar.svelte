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
  import LayerSelect from "$lib/components/layer-select.svelte"
  import { advancedKeysStateContext } from "../context.svelte"

  const advancedKeysState = advancedKeysStateContext.get()
  const { layer, index, create } = $derived(advancedKeysState)
</script>

<KeyboardEditor.Menubar>
  <LayerSelect
    disabled={index !== null || create !== null}
    bind:layer={() => layer, (v) => advancedKeysState.setLayer(v)}
  />
  <KeyboardEditor.LayoutDialog />
</KeyboardEditor.Menubar>
