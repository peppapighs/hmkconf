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
  import { LightbulbOffIcon } from "@lucide/svelte"
  import ColorPicker from "$lib/components/color-picker.svelte"
  import CommitSlider from "$lib/components/commit-slider.svelte"
  import FixedScrollArea from "$lib/components/fixed-scroll-area.svelte"
  import Switch from "$lib/components/switch.svelte"
  import { Button } from "$lib/components/ui/button"
  import * as Empty from "$lib/components/ui/empty"
  import { Separator } from "$lib/components/ui/separator"
  import { Skeleton } from "$lib/components/ui/skeleton"
  import { HMK_RGBCapability } from "$lib/libhmk/rgb"
  import LightingEffectPreview from "./lighting-effect-preview.svelte"
  import {
    RGB_PALETTE,
    rgbEffectInfo,
    type LightingState,
  } from "./lighting-state.svelte"

  const { state }: { state: LightingState } = $props()

  const RAINBOW_PREVIEW =
    "linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)"

  const patterns = $derived([
    {
      name: "Solid",
      preview: state.paintColor,
      apply: () => state.fillLiveFrame(state.paintColor),
    },
    {
      name: "Gradient",
      preview: `linear-gradient(to right, ${state.paintColor}, ${state.gradientEndColor})`,
      apply: () => state.sendGradient(),
    },
    {
      name: "Rainbow",
      preview: RAINBOW_PREVIEW,
      apply: () => state.sendRainbow(),
    },
    {
      name: "Clear",
      preview: "#000000",
      apply: () => state.clearLiveFrame(),
    },
  ])
</script>

{#snippet sectionHeading(title: string, description: string)}
  <div class="grid text-sm text-wrap">
    <span class="font-semibold">{title}</span>
    <span class="text-muted-foreground">{description}</span>
  </div>
{/snippet}

{#snippet palette(current: string, pick: (color: string) => void)}
  <div aria-label="Color presets" class="flex flex-wrap gap-1.5" role="group">
    {#each RGB_PALETTE as swatch (swatch)}
      <button
        aria-label={`Use ${swatch}`}
        aria-pressed={current.toLowerCase() === swatch}
        class="size-9 rounded-md border shadow-xs transition-transform outline-none hover:scale-105 focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-pressed:ring-2 aria-pressed:ring-ring aria-pressed:ring-offset-2 aria-pressed:ring-offset-background"
        onclick={() => pick(swatch)}
        style={`background-color: ${swatch}`}
        type="button"
      ></button>
    {/each}
  </div>
{/snippet}

{#if state.loading}
  <div class="flex size-full flex-col gap-4 p-4">
    <Skeleton class="h-5 w-32" />
    <Skeleton class="h-24 w-full max-w-2xl" />
  </div>
{:else if !state.capabilities || !state.rgbState}
  <div class="flex size-full flex-col p-4">
    <Empty.Root class="border border-dashed">
      <Empty.Header>
        <Empty.Media variant="icon">
          <LightbulbOffIcon />
        </Empty.Media>
        <Empty.Title>Lighting Unavailable</Empty.Title>
        <Empty.Description>
          {state.localError ??
            "This keyboard did not answer the lighting handshake."}
        </Empty.Description>
      </Empty.Header>
      <Empty.Content>
        <Button
          disabled={state.pending}
          onclick={() => void state.negotiate()}
          size="sm"
          variant="outline"
        >
          Try Again
        </Button>
      </Empty.Content>
    </Empty.Root>
  </div>
{:else}
  <div class="grid size-full grid-cols-[minmax(0,1fr)_24rem]">
    <FixedScrollArea class="flex flex-col gap-4 p-4">
      <div class="flex flex-col gap-2">
        {@render sectionHeading("Effect", state.effectInfo.description)}
        <div class="flex flex-wrap gap-2">
          {#each state.metadata.effects as effect (effect)}
            {@const info = rgbEffectInfo(effect)}
            {@const live = effect === state.capabilities.liveEffectId}
            <Button
              aria-pressed={state.effect === effect}
              class="h-auto w-32 flex-col items-stretch gap-2 p-2 aria-pressed:border-ring aria-pressed:ring-2 aria-pressed:ring-ring"
              disabled={state.pending || (live && !state.canSelectLive)}
              onclick={() => state.setEffect(effect)}
              variant="outline"
            >
              <LightingEffectPreview {effect} {state} />
              <span class="text-xs font-medium">{info.name}</span>
            </Button>
          {/each}
        </div>
      </div>

      {#if state.effectInfo.colored}
        <div class="flex flex-col gap-2">
          {@render sectionHeading(
            "Effect Color",
            state.canFill
              ? "Saved on the keyboard and restored every time it boots."
              : "This keyboard does not accept a base color.",
          )}
          <div class="flex flex-wrap items-center gap-2">
            {@render palette(state.baseColor, (color) =>
              state.setBaseColor(color),
            )}
            <Separator class="h-9" orientation="vertical" />
            <ColorPicker
              bind:value={
                () => state.baseColor, (color) => (state.baseColor = color)
              }
              disabled={state.pending || !state.canFill}
              id="rgb-base-color"
              onCommit={(color) => state.setBaseColor(color)}
              presets={RGB_PALETTE}
              title="Effect color"
            />
          </div>
        </div>
      {:else if state.isLive}
        <div class="flex flex-col gap-2">
          {@render sectionHeading(
            "Paint Color",
            "Click or drag across the keyboard above. The frame is sent once you release.",
          )}
          <div class="flex flex-wrap items-end gap-6">
            <div class="grid gap-1.5">
              <span class="text-sm font-medium">Paint</span>
              <div class="flex flex-wrap items-center gap-2">
                {@render palette(
                  state.paintColor,
                  (color) => (state.paintColor = color),
                )}
                <Separator class="h-9" orientation="vertical" />
                <ColorPicker
                  bind:value={state.paintColor}
                  id="rgb-paint-color"
                  presets={RGB_PALETTE}
                  title="Paint color"
                />
              </div>
            </div>
            <div class="grid gap-1.5">
              <span class="text-sm font-medium">Gradient End</span>
              <ColorPicker
                bind:value={state.gradientEndColor}
                id="rgb-gradient-end"
                presets={RGB_PALETTE}
                title="Gradient end"
              />
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-2">
          {@render sectionHeading(
            "Patterns",
            "Fill every key at once instead of painting them one by one.",
          )}
          <div class="flex flex-wrap gap-2">
            {#each patterns as { name, preview, apply } (name)}
              <Button
                class="size-24 flex-col gap-2"
                disabled={state.pending || !state.canPaint}
                onclick={apply}
                size="icon"
                variant="outline"
              >
                <div
                  class="size-10 rounded-md border shadow-xs"
                  style={`background: ${preview}`}
                ></div>
                {name}
              </Button>
            {/each}
          </div>
        </div>
      {:else}
        <p class="text-sm text-wrap text-muted-foreground">
          {state.effectInfo.name} runs through the whole spectrum on the keyboard
          itself, so it has no color to set.
        </p>
      {/if}
    </FixedScrollArea>
    <FixedScrollArea class="flex flex-col gap-4 p-4">
      {#if state.supports(HMK_RGBCapability.ENABLED)}
        <Switch
          bind:checked={
            () => state.rgbState?.enabled ?? false,
            (enabled) => state.setEnabled(enabled)
          }
          description="Turn every LED on the keyboard on or off. Your effect, color, and brightness are kept."
          disabled={state.pending || state.rgbState.enabled === null}
          id="rgb-enabled"
          title="Enable Lighting"
        />
      {/if}
      {#if state.supports(HMK_RGBCapability.BRIGHTNESS)}
        <CommitSlider
          committed={state.rgbState.brightness ?? 0}
          description="Scales every LED on the keyboard. The new value is sent once you release the slider."
          disabled={state.pending || state.rgbState.brightness === null}
          display={(value) => `${Math.round((value / 255) * 100)}%`}
          max={255}
          min={0}
          onCommit={(value) => state.setBrightness(value)}
          step={1}
          title="Brightness"
        />
      {/if}
    </FixedScrollArea>
  </div>
{/if}
