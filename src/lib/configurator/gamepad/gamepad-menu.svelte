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
  import { Badge } from "$lib/components/ui/badge"
  import * as Tabs from "$lib/components/ui/tabs"
  import type { HMK_GamepadMode } from "$lib/libhmk"
  import { gamepadStateContext } from "../context.svelte"
  import { optionsQueryContext } from "../queries/options-query.svelte"
  import GamepadAnalogTab from "./gamepad-analog-tab.svelte"
  import GamepadSetupTab from "./gamepad-setup-tab.svelte"

  const gamepadState = gamepadStateContext.get()
  const { tab } = $derived(gamepadState)

  const { current: options } = $derived(optionsQueryContext.get().options)
  const mode = $derived<HMK_GamepadMode>(
    options?.gamepadMode ?? (options?.xInputEnabled ? "xinput" : "disabled"),
  )
</script>

<Tabs.Root
  class="size-full"
  bind:value={() => tab, (v) => gamepadState.setTab(v)}
>
  <div class="flex items-center gap-4 p-4 pb-0">
    <Tabs.List>
      <Tabs.Trigger value="setup">Setup</Tabs.Trigger>
      <Tabs.Trigger value="analog">Analog</Tabs.Trigger>
    </Tabs.List>
    {#if options && mode === "disabled"}
      <Badge variant="destructive">Gamepad interface is disabled</Badge>
    {:else if options}
      <Badge variant="secondary">
        {mode === "xinput" ? "XInput" : "USB HID gamepad"}
      </Badge>
    {/if}
  </div>
  <Tabs.Content value="setup">
    {#snippet child({ props })}
      <GamepadSetupTab {...props} />
    {/snippet}
  </Tabs.Content>
  <Tabs.Content value="analog">
    {#snippet child({ props })}
      <GamepadAnalogTab {...props} />
    {/snippet}
  </Tabs.Content>
</Tabs.Root>
