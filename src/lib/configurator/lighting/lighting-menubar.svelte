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
  import { Button } from "$lib/components/ui/button"
  import type { LightingState } from "./lighting-state.svelte"

  const { state }: { state: LightingState } = $props()

  const hint = $derived(
    state.canPaint
      ? "Click or drag on the keyboard to paint keys."
      : (state.painterHint ??
          "Preview of the effect running on your keyboard."),
  )
</script>

<KeyboardEditor.Menubar>
  <div class="flex items-center gap-3">
    {#if state.pending}
      <Badge aria-live="polite" variant="secondary">Applying...</Badge>
    {:else if state.lightingOff}
      <Badge variant="destructive">Lighting is off</Badge>
    {:else if state.capabilities}
      <Badge variant="secondary">{state.effectInfo.name}</Badge>
    {/if}
    <span class="text-sm text-wrap text-muted-foreground">{hint}</span>
  </div>
  <div class="flex items-center gap-2">
    {#if state.frameError}
      <Button
        disabled={state.pending}
        onclick={() => void state.retryFrame()}
        size="sm"
        variant="outline"
      >
        Reload Lighting
      </Button>
    {/if}
    <KeyboardEditor.LayoutDialog />
  </div>
</KeyboardEditor.Menubar>
