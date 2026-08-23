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
  import * as KeyboardEditor from "$lib/components/keyboard-editor"
  import { keyboardContext } from "$lib/keyboard"
  import { hmkRgbEffectPhase } from "$lib/libhmk/rgb-effects"
  import type { WithoutChildren } from "$lib/utils"
  import type { ComponentProps } from "svelte"
  import { displayLayoutContext, globalStateContext } from "../context.svelte"
  import LightingKeyboard from "./lighting-keyboard.svelte"
  import LightingMenu from "./lighting-menu.svelte"
  import LightingMenubar from "./lighting-menubar.svelte"
  import { LightingState } from "./lighting-state.svelte"

  const {
    ...props
  }: WithoutChildren<ComponentProps<typeof KeyboardEditor.Root>> = $props()

  const globalState = globalStateContext.get()
  const displayLayout = displayLayoutContext.get()
  const state = new LightingState(keyboardContext.get())

  // The rendered layout is the board's own geometry, so it stands in for the
  // physical LED coordinates the firmware compiles into `RGB_LED_POS_X`.
  $effect(() => {
    const topology = state.topology
    state.ledPlacements =
      topology.kind === "keyboard"
        ? displayLayout.displayKeys.flatMap(({ key, w, x }) => {
            const led = topology.keyToLed[key]
            return led === null || led === undefined
              ? []
              : [{ led, position: x + w / 2 }]
          })
        : []
  })

  $effect(() => {
    if (globalState.tab !== "lighting" || state.negotiated) return
    // RGB failures stay local to this tab and cannot block other configurator
    // resources. Runtime capabilities remain authoritative over metadata.
    state.negotiated = true
    void state.negotiate()
  })

  // Every gallery tile animates, so the clock runs for the whole tab. It stops
  // while lighting is off, exactly like `rgb_task()` on the keyboard.
  const animating = $derived(
    globalState.tab === "lighting" &&
      state.capabilities !== null &&
      !state.lightingOff,
  )

  $effect(() => {
    if (!animating) return
    const start = performance.now()
    let handle = 0
    const tick = () => {
      const phase = hmkRgbEffectPhase(performance.now() - start)
      if (phase !== state.previewPhase) state.previewPhase = phase
      handle = requestAnimationFrame(tick)
    }
    handle = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(handle)
  })
</script>

<!-- The board is the primary surface here, so it opens with the larger pane. -->
<KeyboardEditor.Root {...props}>
  <KeyboardEditor.Pane defaultSize={55}>
    <LightingKeyboard {state} />
    <LightingMenubar {state} />
  </KeyboardEditor.Pane>
  <KeyboardEditor.Handle />
  <KeyboardEditor.Pane defaultSize={45}>
    <KeyboardEditor.Container>
      <LightingMenu {state} />
    </KeyboardEditor.Container>
  </KeyboardEditor.Pane>
</KeyboardEditor.Root>
