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
  import { WrenchIcon } from "@lucide/svelte"
  import { persistedStateContext } from "$lib/configurator/context.svelte"
  import { keyboardContext } from "$lib/keyboard"
  import Switch from "../switch.svelte"
  import { buttonVariants } from "../ui/button"
  import { Label } from "../ui/label"
  import * as Popover from "../ui/popover"
  import * as Select from "../ui/select"

  const persistedState = persistedStateContext.get()
  const { layoutOptions } = $derived(persistedState.current)
  const { labels } = keyboardContext.get().metadata.layout
</script>

<Popover.Root>
  <Popover.Trigger class={buttonVariants({ size: "icon", variant: "outline" })}>
    <WrenchIcon />
    <span class="sr-only">Configure Layout</span>
  </Popover.Trigger>
  <Popover.Content align="end" class="flex flex-col gap-4">
    {#each labels as label, i (i)}
      {#if typeof label === "string"}
        <Switch
          bind:checked={
            () => layoutOptions[i] === 1,
            (v) => (persistedState.current.layoutOptions[i] = v ? 1 : 0)
          }
          id={label}
          title={label}
        />
      {:else}
        <div class="flex flex-col gap-1.5">
          <div class="flex">
            <Label for={label[0]}>{label[0]}</Label>
          </div>
          <Select.Root
            bind:value={
              () => String(layoutOptions[i]),
              (v) => (persistedState.current.layoutOptions[i] = Number(v))
            }
            type="single"
          >
            <Select.Trigger id={label[0]} class="w-full" size="sm">
              <span class="flex items-center gap-2">
                {label[layoutOptions[i] + 1]}
              </span>
            </Select.Trigger>
            <Select.Content>
              {#each label.slice(1) as option, j (j)}
                <Select.Item value={String(j)}>{option}</Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
        </div>
      {/if}
    {/each}
  </Popover.Content>
</Popover.Root>
