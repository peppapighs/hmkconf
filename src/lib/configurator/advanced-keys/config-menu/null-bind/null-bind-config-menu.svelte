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
  import { InfoIcon } from "@lucide/svelte"
  import FixedScrollArea from "$lib/components/fixed-scroll-area.svelte"
  import Switch from "$lib/components/switch.svelte"
  import { Label } from "$lib/components/ui/label"
  import * as RadioGroup from "$lib/components/ui/radio-group"
  import * as Tabs from "$lib/components/ui/tabs"
  import * as Tooltip from "$lib/components/ui/tooltip"
  import { nullBindBehaviorMetadata } from "$lib/configurator/lib/advanced-keys"
  import {
    DEFAULT_BOTTOM_OUT_POINT,
    type HMK_AKNullBind,
  } from "$lib/libhmk/advanced-keys"
  import { configMenuStateContext } from "../context.svelte"
  import KeyTesterTab from "../key-tester-tab.svelte"
  import NullBindPerformanceTab from "./null-bind-performance-tab.svelte"

  const configMenuState = configMenuStateContext.get()
  const action = $derived(configMenuState.advancedKey.action as HMK_AKNullBind)
</script>

<FixedScrollArea class="flex flex-col gap-4 p-4 pt-0">
  <div class="grid text-sm text-wrap">
    <span class="font-medium">Configure Null Bind Resolution Behavior</span>
    <span class="text-muted-foreground">
      Select how Null Bind resolves key presses when both keys are pressed
      simultaneously.
    </span>
  </div>
  <RadioGroup.Root
    bind:value={
      () => String(action.behavior),
      (v) => configMenuState.updateAction({ ...action, behavior: Number(v) })
    }
  >
    {#each nullBindBehaviorMetadata as { behavior, title, description } (behavior)}
      <div class="flex items-center gap-3">
        <RadioGroup.Item id={String(behavior)} value={String(behavior)} />
        <div class="flex flex-1 items-center gap-2">
          <Label class="flex-1" for={String(behavior)}>{title}</Label>
          <Tooltip.Root>
            <Tooltip.Trigger>
              <InfoIcon class="size-4" />
              <span class="sr-only">Info</span>
            </Tooltip.Trigger>
            <Tooltip.Content>{description}</Tooltip.Content>
          </Tooltip.Root>
        </div>
      </div>
    {/each}
  </RadioGroup.Root>
  <Switch
    bind:checked={
      () => action.bottomOutPoint > 0,
      (v) =>
        configMenuState.updateAction({
          ...action,
          bottomOutPoint: v ? DEFAULT_BOTTOM_OUT_POINT : 0,
        })
    }
    description="Enable this option to register both key presses when keys are fully pressed simultaneously, bypassing the resolution behavior."
    id="alternative-fully-pressed-behavior"
    title="Alternative Fully Pressed Behavior"
  />
</FixedScrollArea>
<FixedScrollArea class="flex flex-col gap-4 p-4 pt-0">
  <Tabs.Root value="performance">
    <Tabs.List>
      <Tabs.Trigger value="performance">Performance</Tabs.Trigger>
      <Tabs.Trigger value="key-tester">Key Tester</Tabs.Trigger>
    </Tabs.List>
    <div class="p-2">
      <Tabs.Content value="performance">
        {#snippet child({ props })}
          <NullBindPerformanceTab {...props} />
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
