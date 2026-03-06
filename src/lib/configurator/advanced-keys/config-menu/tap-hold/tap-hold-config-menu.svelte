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
  import FixedScrollArea from "$lib/components/fixed-scroll-area.svelte"
  import { KeycodeButton } from "$lib/components/keycode-button"
  import * as Tabs from "$lib/components/ui/tabs"
  import type { HMK_AKTapHold } from "$lib/libhmk/advanced-keys"
  import { Keycode } from "$lib/libhmk/keycodes"
  import { unitToStyle } from "$lib/ui"
  import { ToggleGroup } from "bits-ui"
  import { configMenuStateContext } from "../context.svelte"
  import KeyTesterTab from "../key-tester-tab.svelte"
  import {
    TapHoldConfigMenuState,
    tapHoldConfigMenuStateContext,
  } from "./context.svelte"
  import TapHoldAdvancedTab from "./tap-hold-advanced-tab.svelte"
  import TapHoldBindingsTab from "./tap-hold-bindings-tab.svelte"

  const tapHoldConfigMenuState = tapHoldConfigMenuStateContext.set(
    new TapHoldConfigMenuState(),
  )

  const configMenuState = configMenuStateContext.get()
  const action = $derived(configMenuState.advancedKey.action as HMK_AKTapHold)
</script>

<FixedScrollArea class="flex flex-col gap-4 p-4 pt-0">
  <div class="grid text-sm">
    <span class="font-medium">Configure Tap-Hold Bindings</span>
    <span class="text-muted-foreground">
      Assign bindings for tap and hold actions of the key.
    </span>
  </div>
  <div class="grid place-items-center">
    <ToggleGroup.Root
      bind:value={tapHoldConfigMenuState.binding}
      class="flex"
      type="single"
    >
      <div class="flex flex-col items-center text-center text-base">
        <div class="text-muted-foreground">Tap</div>
        <div class="p-0.5" style={unitToStyle()}>
          <ToggleGroup.Item
            oncontextmenu={(e) => {
              e.preventDefault()
              configMenuState.updateAction({
                ...action,
                tapKeycode: Keycode.KC_NO,
              })
            }}
            value="tap"
          >
            {#snippet child({ props })}
              <KeycodeButton keycode={action.tapKeycode} {...props} />
            {/snippet}
          </ToggleGroup.Item>
        </div>
      </div>
      <div class="flex flex-col items-center text-center text-base">
        <div class="text-muted-foreground">Hold</div>
        <div class="p-0.5" style={unitToStyle()}>
          <ToggleGroup.Item
            oncontextmenu={(e) => {
              e.preventDefault()
              configMenuState.updateAction({
                ...action,
                holdKeycode: Keycode.KC_NO,
              })
            }}
            value="hold"
          >
            {#snippet child({ props })}
              <KeycodeButton keycode={action.holdKeycode} {...props} />
            {/snippet}
          </ToggleGroup.Item>
        </div>
      </div>
    </ToggleGroup.Root>
  </div>
</FixedScrollArea>
<FixedScrollArea class="flex flex-col gap-4 p-4 pt-0">
  <Tabs.Root value="bindings">
    <Tabs.List>
      <Tabs.Trigger value="bindings">Bindings</Tabs.Trigger>
      <Tabs.Trigger value="advanced">Advanced</Tabs.Trigger>
      <Tabs.Trigger value="key-tester">Key Tester</Tabs.Trigger>
    </Tabs.List>
    <div class="p-2">
      <Tabs.Content value="bindings">
        {#snippet child({ props })}
          <TapHoldBindingsTab {...props} />
        {/snippet}
      </Tabs.Content>
      <Tabs.Content value="advanced">
        {#snippet child({ props })}
          <TapHoldAdvancedTab {...props} />
        {/snippet}
      </Tabs.Content>
      <Tabs.Content value="key-tester">
        {#snippet child({ props })}
          <KeyTesterTab {...props} />
        {/snippet}
      </Tabs.Content>
    </div>
  </Tabs.Root>
</FixedScrollArea>
