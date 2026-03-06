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
  import Switch from "$lib/components/switch.svelte"
  import { Button } from "$lib/components/ui/button"
  import * as Dialog from "$lib/components/ui/dialog"
  import { keyboardContext } from "$lib/keyboard"
  import { cn, isFeatureAvailable, type WithoutChildren } from "$lib/utils"
  import type { HTMLAttributes } from "svelte/elements"
  import { optionsQueryContext } from "../queries/options-query.svelte"
  import { profileQueryContext } from "../queries/profile-query.svelte"

  const {
    class: className,
    ...props
  }: WithoutChildren<HTMLAttributes<HTMLDivElement>> = $props()

  const keyboard = keyboardContext.get()
  const {
    demo,
    version,
    metadata: { usbHighSpeed },
  } = keyboard

  const profileQuery = profileQueryContext.get()
  const optionsQuery = optionsQueryContext.get()
  const { current: options } = $derived(optionsQuery.options)
</script>

<div
  class={cn("mx-auto flex size-full max-w-3xl flex-col", className)}
  {...props}
>
  <FixedScrollArea class="flex flex-col gap-4 p-4">
    {#if usbHighSpeed && isFeatureAvailable("pollingRateSwitch", version)}
      <Switch
        bind:checked={
          () => options?.highPollingRateEnabled ?? false,
          (v) =>
            options &&
            optionsQuery.set({
              data: { ...options, highPollingRateEnabled: v },
            })
        }
        id="8000hz-polling-rate"
        title="8000Hz Polling Rate"
        description="Enable the 8000Hz polling rate for faster response times, but may increase the CPU usage of the host device. Restart the keyboard to apply changes. This setting applies globally across all profiles."
      />
    {/if}
    <div class="flex flex-col gap-2">
      <div class="grid text-sm text-wrap">
        <span class="font-semibold">Restart Keyboard</span>
        <span class="text-muted-foreground">
          The keyboard will disconnect and reconnect. No changes will be made to
          your keyboard settings.
        </span>
      </div>
      <div>
        <Button
          disabled={demo}
          onclick={() => keyboard.reboot()}
          size="sm"
          variant="outline"
        >
          Restart Keyboard
        </Button>
      </div>
    </div>
    <div class="flex flex-col gap-2">
      <div class="grid text-sm text-wrap">
        <span class="font-semibold">Enter Bootloader Mode</span>
        <span class="text-muted-foreground">
          The keyboard will restart and enter bootloader mode if it is supported
          by the firmware. No changes will be made to your keyboard settings.
        </span>
      </div>
      <div>
        <Button
          disabled={demo}
          onclick={() => keyboard.bootloader()}
          size="sm"
          variant="outline"
        >
          Enter Bootloader Mode
        </Button>
      </div>
    </div>
    <div class="flex flex-col gap-2">
      <div class="grid text-sm text-wrap">
        <span class="font-semibold">Factory Reset</span>
        <span class="text-muted-foreground">
          Revert the keyboard to its factory settings defined by the firmware.
          All user data and settings will be lost.
        </span>
      </div>
      <div>
        <Dialog.Root>
          <Dialog.Trigger>
            {#snippet child({ props })}
              <Button
                disabled={demo}
                size="sm"
                variant="destructive"
                {...props}
              >
                Factory Reset
              </Button>
            {/snippet}
          </Dialog.Trigger>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Factory Reset?</Dialog.Title>
              <Dialog.Description>
                Are you sure you want to factory reset your keyboard?
              </Dialog.Description>
            </Dialog.Header>
            <Dialog.Footer>
              <Dialog.Close>
                {#snippet child({ props })}
                  <Button size="sm" variant="outline" {...props}>Cancel</Button>
                {/snippet}
              </Dialog.Close>
              <Dialog.Close onclick={() => profileQuery.factoryReset()}>
                {#snippet child({ props })}
                  <Button size="sm" variant="destructive" {...props}>
                    Factory Reset
                  </Button>
                {/snippet}
              </Dialog.Close>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Root>
      </div>
    </div>
  </FixedScrollArea>
</div>
