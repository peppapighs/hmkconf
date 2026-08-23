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
  import Switch from "$lib/components/switch.svelte"
  import { Badge } from "$lib/components/ui/badge"
  import { Button } from "$lib/components/ui/button"
  import { Input } from "$lib/components/ui/input"
  import * as Select from "$lib/components/ui/select"
  import { Separator } from "$lib/components/ui/separator"
  import { HMK_RGBCapability, HMK_RGBEffect } from "$lib/libhmk/rgb"
  import {
    RGB_EFFECT_NAMES,
    RGB_PALETTE,
    type LightingState,
  } from "./lighting-state.svelte"

  const { state }: { state: LightingState } = $props()

  const capabilityLabels = [
    [HMK_RGBCapability.ENABLED, "Enable"],
    [HMK_RGBCapability.BRIGHTNESS, "Brightness"],
    [HMK_RGBCapability.PIXEL, "LED access"],
    [HMK_RGBCapability.FRAME_CHUNKS, "Full frames"],
    [HMK_RGBCapability.FILL, "Fill / clear"],
    [HMK_RGBCapability.LIVE_MODE, "Live mode"],
    [HMK_RGBCapability.RESTORE_MODE, "Restore effect"],
  ] as const
</script>

<FixedScrollArea class="flex flex-col gap-4 p-4">
  <div class="flex items-start justify-between gap-4">
    <div class="grid gap-1 text-sm">
      <h2 class="text-base font-semibold">Lighting</h2>
      <p class="text-muted-foreground">
        Paint above, then tune the active color, effects and device controls
        here.
      </p>
    </div>
    {#if state.pending}
      <Badge variant="secondary" aria-live="polite">Sending…</Badge>
    {:else if state.capabilities}
      <Badge variant="outline">Connected</Badge>
    {/if}
  </div>

  {#if state.localError}
    <div
      class="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
      role="alert"
    >
      <p class="font-medium">RGB operation unavailable</p>
      <p class="mt-1 text-wrap">{state.localError}</p>
      {#if !state.capabilities}
        <Button
          class="mt-3"
          disabled={state.pending}
          onclick={() => void state.negotiate()}
          size="sm"
          variant="outline"
        >
          Retry negotiation
        </Button>
      {/if}
    </div>
  {/if}

  {#if state.loading}
    <p class="text-sm text-muted-foreground" aria-live="polite">
      Negotiating the local RGB bridge…
    </p>
  {:else if state.capabilities && state.rgbState}
    <div class="grid gap-4 lg:grid-cols-2">
      <section class="grid content-start gap-4 rounded-lg border p-4">
        <div class="grid gap-1 text-sm">
          <h3 class="font-semibold">Device state</h3>
          <p class="text-muted-foreground">
            Current effect: {state.currentEffectName}
          </p>
        </div>

        {#if state.supports(HMK_RGBCapability.ENABLED)}
          <Switch
            bind:checked={
              () => state.rgbState?.enabled ?? false,
              (enabled) => state.setEnabled(enabled)
            }
            description="Globally enable or disable the keyboard LEDs."
            disabled={state.pending || state.rgbState.enabled === null}
            id="rgb-enabled"
            title="Lighting enabled"
          />
        {/if}

        {#if state.supports(HMK_RGBCapability.BRIGHTNESS)}
          <CommitSlider
            committed={state.rgbState.brightness ?? 0}
            description="Sent once when the slider is released."
            disabled={state.pending || state.rgbState.brightness === null}
            display={(value) => `${Math.round((value / 255) * 100)}%`}
            max={255}
            min={0}
            onCommit={(value) => state.setBrightness(value)}
            step={1}
            title="Brightness"
          />
        {/if}

        <div class="grid gap-1.5 text-sm">
          <label class="font-medium" for="rgb-effect">Effect</label>
          <Select.Root
            bind:value={
              () => String(state.rgbState?.effect ?? ""),
              (value) => state.setEffect(value)
            }
            disabled={state.pending || state.metadata.effects.length === 0}
            type="single"
          >
            <Select.Trigger class="w-64" id="rgb-effect">
              {state.currentEffectName}
            </Select.Trigger>
            <Select.Content class="w-[var(--bits-select-anchor-width)]">
              {#each state.metadata.effects as effect (effect)}
                <Select.Item
                  disabled={effect === HMK_RGBEffect.LIVE &&
                    !state.supports(HMK_RGBCapability.LIVE_MODE)}
                  value={String(effect)}
                >
                  {RGB_EFFECT_NAMES[effect] ?? `Effect ${effect}`}
                </Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
        </div>
      </section>

      <section class="grid content-start gap-4 rounded-lg border p-4">
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div class="grid gap-1 text-sm">
            <h3 class="font-semibold">Painter and colors</h3>
            <p class="text-muted-foreground">
              A click or drag previews immediately and sends one frame when the
              gesture ends.
            </p>
          </div>
          <Badge variant="outline">{state.topologyLabel}</Badge>
        </div>

        <div class="flex flex-wrap items-end gap-3">
          <label class="grid gap-1 text-sm">
            <span class="font-medium">Active color</span>
            <Input
              aria-label="Active paint color"
              class="h-8 w-14 p-1"
              disabled={state.pending}
              type="color"
              bind:value={state.fillColor}
            />
          </label>
          <div class="flex items-center gap-1" aria-label="Color palette">
            {#each RGB_PALETTE as swatch (swatch)}
              <button
                aria-label={`Use ${swatch}`}
                aria-pressed={state.fillColor.toLowerCase() === swatch}
                class="size-7 rounded-md border shadow-xs transition-transform outline-none hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 aria-pressed:ring-2 aria-pressed:ring-ring"
                disabled={state.pending}
                onclick={() => (state.fillColor = swatch)}
                style={`background-color: ${swatch}`}
                title={swatch}
                type="button"
              ></button>
            {/each}
          </div>
        </div>

        {#if state.frameError}
          <div
            class="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
            role="alert"
          >
            <p class="font-medium">Frame preview unavailable</p>
            <p class="mt-1 text-wrap">{state.frameError}</p>
            <Button
              class="mt-3"
              disabled={state.pending}
              onclick={() => void state.retryFrame()}
              size="sm"
              variant="outline"
            >
              Reload frame
            </Button>
          </div>
        {:else if state.rgbState.enabled === false}
          <p class="text-sm text-muted-foreground" role="status">
            Enable lighting to use the painter.
          </p>
        {:else if !state.canLiveWrite}
          <p class="text-sm text-muted-foreground" role="status">
            Painting requires full-frame live mode and, while an autonomous
            effect is active, effect-restore support.
          </p>
        {/if}

        <div class="flex flex-wrap items-end gap-2">
          <Button
            disabled={state.pending || !state.canStaticWrite}
            onclick={() => state.applyStaticFill()}
            size="sm"
          >
            Apply static
          </Button>
          <Button
            disabled={state.pending || !state.canStaticWrite}
            onclick={() => state.clearFrame()}
            size="sm"
            variant="outline"
          >
            Clear LEDs
          </Button>
          <Button
            disabled={state.pending ||
              !state.supports(HMK_RGBCapability.RESTORE_MODE) ||
              state.rgbState.effect !== state.capabilities.liveEffectId}
            onclick={() => state.restoreEffect()}
            size="sm"
            variant="outline"
          >
            Restore effect
          </Button>
        </div>

        <Separator />

        <div class="flex flex-wrap items-end gap-2">
          <label class="grid gap-1 text-sm">
            <span class="font-medium">Gradient end</span>
            <Input
              aria-label="Gradient end color"
              class="h-8 w-14 p-1"
              disabled={state.pending}
              type="color"
              bind:value={state.gradientEndColor}
            />
          </label>
          <Button
            disabled={state.pending || !state.canLiveWrite}
            onclick={() => state.sendGradient()}
            size="sm"
          >
            Gradient
          </Button>
          <Button
            disabled={state.pending || !state.canLiveWrite}
            onclick={() => state.sendRainbow()}
            size="sm"
            variant="outline"
          >
            Rainbow
          </Button>
        </div>
      </section>
    </div>

    {#if state.supports(HMK_RGBCapability.PIXEL)}
      <section class="grid gap-3 rounded-lg border p-4">
        <div class="grid gap-1 text-sm">
          <h3 class="font-semibold">Firmware LED access</h3>
          <p class="text-muted-foreground">
            Advanced access by firmware LED index, independent from key indices.
          </p>
        </div>
        <div class="flex flex-wrap items-end gap-3">
          <label class="grid gap-1 text-sm">
            <span class="font-medium">LED index</span>
            <Input
              class="w-28"
              disabled={state.pending}
              max={state.capabilities.ledCount - 1}
              min={0}
              step={1}
              type="number"
              bind:value={state.ledIndex}
            />
          </label>
          <label class="grid gap-1 text-sm">
            <span class="font-medium">LED color</span>
            <Input
              aria-label="LED color"
              class="h-9 w-14 p-1"
              disabled={state.pending}
              type="color"
              bind:value={state.ledColor}
            />
          </label>
          <Button
            disabled={state.pending}
            onclick={() => state.readPixel()}
            size="sm"
            variant="outline"
          >
            Read
          </Button>
          <Button
            disabled={state.pending || !state.canPixelWrite}
            onclick={() => state.writePixel()}
            size="sm"
          >
            Set
          </Button>
        </div>
      </section>
    {/if}

    <details class="rounded-lg border p-4 text-sm">
      <summary class="cursor-pointer font-semibold">
        Negotiated capabilities
      </summary>
      <div class="mt-3 flex flex-wrap gap-2">
        <Badge variant="outline">
          Protocol {state.capabilities.protocolMajor}.{state.capabilities
            .protocolMinor}
        </Badge>
        <Badge variant="outline">{state.capabilities.ledCount} LEDs</Badge>
        <Badge variant="outline">
          {state.capabilities.chunkBytes}-byte chunks
        </Badge>
        {#each capabilityLabels as [capability, label] (capability)}
          <Badge
            variant={state.supports(capability) ? "secondary" : "outline"}
            class={!state.supports(capability) ? "opacity-50" : undefined}
          >
            {label}: {state.supports(capability) ? "yes" : "no"}
          </Badge>
        {/each}
      </div>
    </details>
  {/if}
</FixedScrollArea>
