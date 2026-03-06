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
  import * as Tabs from "$lib/components/ui/tabs"
  import KeyTesterTab from "../key-tester-tab.svelte"
  import TickRateSlider from "../tick-rate-slider.svelte"
  import DynamicKeystrokeActions from "./actions/actions.svelte"
  import {
    DKSConfigMenuState,
    dksConfigMenuStateContext,
  } from "./context.svelte"
  import DynamicKeystrokeBindingsTab from "./dynamic-keystroke-bindings-tab.svelte"
  import DynamicKeystrokePerformanceTab from "./dynamic-keystroke-performance-tab.svelte"

  dksConfigMenuStateContext.set(new DKSConfigMenuState())
</script>

<FixedScrollArea class="flex flex-col gap-4 p-4 pt-0">
  <div class="grid text-sm">
    <span class="font-medium">Configure DKS Bindings</span>
    <span class="text-muted-foreground">
      Assign bindings using the menu on the left. For a tap action, click the
      plus icon once. For a hold action, click the plus icon and drag it to the
      desired key position based on your preferred behavior.
    </span>
  </div>
  <DynamicKeystrokeActions />
</FixedScrollArea>
<FixedScrollArea class="flex flex-col gap-4 p-4 pt-0">
  <Tabs.Root value="bindings">
    <Tabs.List>
      <Tabs.Trigger value="bindings">Bindings</Tabs.Trigger>
      <Tabs.Trigger value="performance">Performance</Tabs.Trigger>
      <Tabs.Trigger value="advanced">Advanced</Tabs.Trigger>
      <Tabs.Trigger value="key-tester">Key Tester</Tabs.Trigger>
    </Tabs.List>
    <div class="p-2">
      <Tabs.Content value="bindings">
        {#snippet child({ props })}
          <DynamicKeystrokeBindingsTab {...props} />
        {/snippet}
      </Tabs.Content>
      <Tabs.Content value="performance">
        {#snippet child({ props })}
          <DynamicKeystrokePerformanceTab {...props} />
        {/snippet}
      </Tabs.Content>
      <Tabs.Content value="advanced">
        {#snippet child({ props })}
          <TickRateSlider {...props} />
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
