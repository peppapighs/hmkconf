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
  import { XIcon } from "@lucide/svelte"
  import { keyboardContext } from "$lib/keyboard"
  import {
    getCategorizedKeycodes,
    getKeycodeMetadata,
    keycodeCategories,
  } from "$lib/keycodes"
  import { unitToStyle } from "$lib/ui"
  import { cn, type WithoutChildrenOrChild } from "$lib/utils"
  import type { HTMLAttributes } from "svelte/elements"
  import { KeycodeButton } from "./keycode-button"
  import * as Accordion from "./ui/accordion"
  import * as InputGroup from "./ui/input-group"

  const {
    class: className,
    onKeycodeSelected,
    ...props
  }: WithoutChildrenOrChild<HTMLAttributes<HTMLDivElement>> & {
    onKeycodeSelected?: (keycode: number) => void
  } = $props()

  let search = $state("")
  let accordionValue = $state(["Basic"])

  const getAccordionValue = () =>
    search === "" ? accordionValue : Object.values(keycodeCategories)
  const setAccordionValue = (v: string[]) =>
    search === "" && (accordionValue = v)

  const categorizedKeycodes = getCategorizedKeycodes(
    keyboardContext.get().metadata,
  )
  const filteredKeycodes = $derived.by(() => {
    if (search === "") return categorizedKeycodes
    const lowerSearch = search.toLowerCase()
    return categorizedKeycodes.map(
      ([category, keycodes]) =>
        [
          category,
          keycodes.filter((keycode) => {
            const { name, tooltip = "" } = getKeycodeMetadata(keycode)
            return (
              name.toLowerCase().includes(lowerSearch) ||
              tooltip.toLowerCase().includes(lowerSearch)
            )
          }),
        ] as const,
    )
  })
</script>

<div class={cn("flex w-full flex-col gap-2", className)} {...props}>
  <div class="flex justify-end">
    <InputGroup.Root class="w-60">
      <InputGroup.Input bind:value={search} placeholder="Search..." />
      <InputGroup.Addon align="inline-end">
        <InputGroup.Button onclick={() => (search = "")} size="icon-xs">
          <XIcon />
          <span class="sr-only">Clear Search</span>
        </InputGroup.Button>
      </InputGroup.Addon>
    </InputGroup.Root>
  </div>
  <Accordion.Root
    bind:value={getAccordionValue, setAccordionValue}
    type="multiple"
  >
    {#each filteredKeycodes as [category, keycodes] (category)}
      {#if keycodes.length > 0}
        <Accordion.Item value={category}>
          <Accordion.Trigger>{category}</Accordion.Trigger>
          <Accordion.Content class="flex flex-wrap text-sm">
            {#each keycodes as keycode (keycode)}
              <div class="p-0.5" style={unitToStyle()}>
                <KeycodeButton
                  {keycode}
                  onclick={() => onKeycodeSelected?.(keycode)}
                  showTooltip
                />
              </div>
            {/each}
          </Accordion.Content>
        </Accordion.Item>
      {/if}
    {/each}
  </Accordion.Root>
</div>
