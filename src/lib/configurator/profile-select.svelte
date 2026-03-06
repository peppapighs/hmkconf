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
  import { KeyboardIcon } from "@lucide/svelte"
  import * as Select from "$lib/components/ui/select"
  import * as Tooltip from "$lib/components/ui/tooltip"
  import { keyboardContext } from "$lib/keyboard"
  import { globalStateContext } from "./context.svelte"
  import { profileQueryContext } from "./queries/profile-query.svelte"

  const globalState = globalStateContext.get()
  const { profile } = $derived(globalState)
  const { numProfiles } = keyboardContext.get().metadata

  const { current: keyboardProfile } = $derived(
    profileQueryContext.get().profile,
  )
</script>

<Select.Root
  bind:value={() => String(profile), (v) => globalState.setProfile(Number(v))}
  type="single"
>
  <Select.Trigger class="w-48" size="sm">
    <span class="flex items-center gap-2">
      Profile {profile}
      {#if keyboardProfile === profile}
        <KeyboardIcon />
      {/if}
    </span>
  </Select.Trigger>
  <Select.Content class="w-[var(--bits-select-anchor-width)]">
    {#each { length: numProfiles }, i (i)}
      <Select.Item value={String(i)}>
        <span class="flex items-center gap-2">
          Profile {i}
          {#if keyboardProfile === i}
            <Tooltip.Root>
              <Tooltip.Trigger>
                <KeyboardIcon />
                <span class="sr-only">Active</span>
              </Tooltip.Trigger>
              <Tooltip.Content>Current Active Profile</Tooltip.Content>
            </Tooltip.Root>
          {/if}
        </span>
      </Select.Item>
    {/each}
  </Select.Content>
</Select.Root>
