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
  import CommitSlider from "$lib/components/commit-slider.svelte"
  import FixedScrollArea from "$lib/components/fixed-scroll-area.svelte"
  import * as KeyTester from "$lib/components/key-tester"
  import Switch from "$lib/components/switch.svelte"
  import { Button } from "$lib/components/ui/button"
  import { keyboardContext } from "$lib/keyboard"
  import { isFeatureAvailable } from "$lib/utils"
  import { toast } from "svelte-sonner"
  import { analogInfoQueryContext } from "../queries/analog-info-query.svelte"
  import { calibrationQueryContext } from "../queries/calibration.query.svelte"
  import { optionsQueryContext } from "../queries/options-query.svelte"

  const keyboard = keyboardContext.get()
  const {
    demo,
    version,
    metadata: { adcResolution },
  } = keyboard

  const analogInfoQuery = analogInfoQueryContext.get()
  const calibrationQuery = calibrationQueryContext.get()
  const optionsQuery = optionsQueryContext.get()
  const { current: calibration } = $derived(calibrationQuery.calibration)
  const { current: options } = $derived(optionsQuery.options)
</script>

<div class="grid size-full grid-cols-[minmax(0,1fr)_24rem]">
  <FixedScrollArea class="flex flex-col gap-4 p-4">
    {#if !isFeatureAvailable("saveCalibrationThreshold", version)}
      <Switch
        bind:checked={
          () => options?.saveBottomOutThreshold ?? false,
          (v) =>
            options &&
            optionsQuery.set({
              data: { ...options, saveBottomOutThreshold: v },
            })
        }
        disabled={demo || !options}
        id="save-bottom-out-threshold"
        title="Save Bottom Out Threshold"
        description="Periodically save the per-key bottom-out threshold values after some inactivity to be restored on next boot. The saved values will only be cleared on recalibration. This setting applies globally across all profiles."
      />
    {/if}
    <CommitSlider
      bind:committed={
        () => calibration?.initialRestValue ?? 0,
        (v) =>
          calibration &&
          calibrationQuery.set({
            data: {
              ...calibration,
              initialRestValue: v,
            },
          })
      }
      description="The initial noise floor represents the estimated analog value when a key is at rest. It should be set slightly higher than the actual analog readings of all keys in their resting position to prevent deadzones. Recalibrate the keyboard to apply changes. This setting applies globally across all profiles."
      disabled={demo || !calibration}
      min={0}
      max={(1 << adcResolution) - 1}
      step={10}
      title="Initial Noise Floor"
    />
    <CommitSlider
      bind:committed={
        () =>
          calibration?.initialBottomOutThreshold ?? (1 << adcResolution) - 1,
        (v) =>
          calibration &&
          calibrationQuery.set({
            data: {
              ...calibration,
              initialBottomOutThreshold: v,
            },
          })
      }
      description="The initial bottom out threshold represents the estimated change in analog value when a key is fully pressed. It should be set slightly lower than the actual change in analog readings when keys are fully pressed to prevent deadzones. Recalibrate the keyboard to apply changes. This setting applies globally across all profiles."
      disabled={demo || !calibration}
      min={0}
      max={(1 << adcResolution) - 1}
      step={10}
      title="Initial Bottom Out Threshold"
    />
    <div class="flex gap-2">
      <Button
        disabled={demo}
        onclick={() => analogInfoQuery.recalibrate()}
        size="sm"
        variant="destructive"
      >
        Recalibrate
      </Button>
      {#if isFeatureAvailable("saveCalibrationThreshold", version)}
        <Button
          disabled={demo}
          onclick={async () => {
            await keyboard.saveCalibrationThreshold()
            toast.success("Successfully saved calibration threshold.")
          }}
          size="sm"
        >
          Save Current Threshold
        </Button>
      {/if}
    </div>
  </FixedScrollArea>
  <FixedScrollArea class="flex flex-col gap-4 p-4">
    <KeyTester.Root>
      <div class="flex flex-col gap-2">
        <div class="text-sm font-medium">Pressed Keys</div>
        <KeyTester.Press class="h-32 w-full" />
      </div>
      <div class="flex flex-col gap-2">
        <div class="text-sm font-medium">Released Keys</div>
        <KeyTester.Release class="h-32 w-full" />
      </div>
    </KeyTester.Root>
  </FixedScrollArea>
</div>
