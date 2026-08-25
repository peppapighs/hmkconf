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
  import * as Select from "$lib/components/ui/select"
  import { keyboardContext } from "$lib/keyboard"
  import type { HMK_GamepadMode } from "$lib/libhmk"
  import { optionsQueryContext } from "../queries/options-query.svelte"

  const optionsQuery = optionsQueryContext.get()
  const { current: options } = $derived(optionsQuery.options)
  const { gamepadApis } = keyboardContext.get().metadata

  const modes: { value: HMK_GamepadMode; label: string }[] = [
    { value: "disabled", label: "Disabled" },
    ...gamepadApis.map((api) => ({
      value: api,
      label: api === "xinput" ? "XInput" : "USB HID gamepad",
    })),
  ]
  const mode = $derived<HMK_GamepadMode>(
    options?.gamepadMode ?? (options?.xInputEnabled ? "xinput" : "disabled"),
  )
  let reconnectRequired = $state(false)

  async function setMode(value: string) {
    if (!options || value === mode) return
    const gamepadMode = value as HMK_GamepadMode
    reconnectRequired = await optionsQuery.set({
      data: {
        ...options,
        gamepadMode,
        // Keep the legacy field coherent for older consumers of HMK_Options.
        xInputEnabled: gamepadMode === "xinput",
      },
    })
  }
</script>

<KeyboardEditor.Menubar>
  <div class="flex items-center gap-3">
    <span class="text-sm font-medium">Gamepad interface</span>
    <Select.Root
      bind:value={() => mode, setMode}
      disabled={!options}
      type="single"
    >
      <Select.Trigger class="w-44" size="sm">
        {modes.find(({ value }) => value === mode)?.label ?? "Unavailable"}
      </Select.Trigger>
      <Select.Content class="w-[var(--bits-select-anchor-width)]">
        {#each modes as { value, label } (value)}
          <Select.Item {value}>{label}</Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
    {#if reconnectRequired}
      <Badge variant="secondary">Restart and reconnect to apply</Badge>
    {/if}
  </div>
  <KeyboardEditor.LayoutDialog />
</KeyboardEditor.Menubar>
