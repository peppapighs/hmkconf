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
  import { getKeycodeMetadata } from "$lib/keycodes"
  import type { WithoutChildren } from "$lib/utils"
  import type { ComponentProps } from "svelte"
  import { KeyButton } from "../key-button"
  import KeycodeButtonTooltip from "./keycode-button-tooltip.svelte"

  const {
    keycode,
    showTooltip,
    ...props
  }: WithoutChildren<ComponentProps<typeof KeyButton>> & {
    keycode: number
    showTooltip?: boolean
  } = $props()

  const { name, display } = $derived(getKeycodeMetadata(keycode))
</script>

<KeycodeButtonTooltip {keycode} {showTooltip}>
  <KeyButton {...props}>
    {#each display ?? [name] as Variant, i (i)}
      {#if typeof Variant === "string"}
        <span>{Variant}</span>
      {:else}
        <Variant />
      {/if}
    {/each}
  </KeyButton>
</KeycodeButtonTooltip>
