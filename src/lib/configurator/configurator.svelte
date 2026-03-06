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
  import { keyboardContext, type Keyboard } from "$lib/keyboard"
  import { Tabs } from "bits-ui"
  import { setConfiguratorStateContext } from "./context.svelte"
  import ConfiguratorLayout from "./layout.svelte"
  import { setConfiguratorQueryContext } from "./queries"

  const { keyboard }: { keyboard: Keyboard } = $props()

  const profilesTab = import("./profiles/profiles-tab.svelte")
  const remapTab = import("./remap/remap-tab.svelte")
  const performanceTab = import("./performance/performance-tab.svelte")
  const advancedKeysTab = import("./advanced-keys/advanced-keys-tab.svelte")
  const gamepadTab = import("./gamepad/gamepad-tab.svelte")
  const calibrationTab = import("./calibration/calibration-tab.svelte")
  const settingsTab = import("./settings/settings-tab.svelte")

  // svelte-ignore state_referenced_locally
  keyboardContext.set(keyboard)
  setConfiguratorStateContext()
  setConfiguratorQueryContext()
</script>

<ConfiguratorLayout>
  {#await profilesTab then { default: ProfilesTab }}
    <Tabs.Content value="profiles">
      {#snippet child({ props })}
        <ProfilesTab {...props} />
      {/snippet}
    </Tabs.Content>
  {/await}
  {#await remapTab then { default: RemapTab }}
    <Tabs.Content value="remap">
      {#snippet child({ props })}
        <RemapTab {...props} />
      {/snippet}
    </Tabs.Content>
  {/await}
  {#await performanceTab then { default: PerformanceTab }}
    <Tabs.Content value="performance">
      {#snippet child({ props })}
        <PerformanceTab {...props} />
      {/snippet}
    </Tabs.Content>
  {/await}
  {#await advancedKeysTab then { default: AdvancedKeysTab }}
    <Tabs.Content value="advanced-keys">
      {#snippet child({ props })}
        <AdvancedKeysTab {...props} />
      {/snippet}
    </Tabs.Content>
  {/await}
  {#await gamepadTab then { default: GamepadTab }}
    <Tabs.Content value="gamepad">
      {#snippet child({ props })}
        <GamepadTab {...props} />
      {/snippet}
    </Tabs.Content>
  {/await}
  {#await calibrationTab then { default: CalibrationTab }}
    <Tabs.Content value="calibration">
      {#snippet child({ props })}
        <CalibrationTab {...props} />
      {/snippet}
    </Tabs.Content>
  {/await}
  {#await settingsTab then { default: SettingsTab }}
    <Tabs.Content value="settings">
      {#snippet child({ props })}
        <SettingsTab {...props} />
      {/snippet}
    </Tabs.Content>
  {/await}
</ConfiguratorLayout>
