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
  import { CableIcon } from "@lucide/svelte"
  import screenshotDark from "$lib/assets/screenshot-dark.png"
  import screenshot from "$lib/assets/screenshot.png"
  import Footer from "$lib/components/footer.svelte"
  import { Button } from "$lib/components/ui/button"
  import Configurator from "$lib/configurator/configurator.svelte"
  import type { Keyboard } from "$lib/keyboard"
  import { connect } from "$lib/keyboard/hmk-keyboard.svelte"
  import { HMK_FIRMWARE_MAX_VERSION } from "$lib/libhmk"
  import { toast } from "svelte-sonner"

  let keyboard: Keyboard | null = $state(null)

  const handleConnect = async () => {
    try {
      keyboard = await connect(({ metadata: { name } }) => {
        toast.success(`${name} disconnected.`)
        keyboard = null
      })
      if (keyboard) {
        let message = `Successfully connected to ${keyboard.metadata.name}.`
        if (keyboard.version < HMK_FIRMWARE_MAX_VERSION) {
          message += " Newer version of the firmware is available."
        }
        toast.success(message)
      }
    } catch (err) {
      toast.error(String(err))
    }
  }
</script>

{#if keyboard}
  <Configurator {keyboard} />
{:else}
  <main class="py-24">
    <div class="mx-auto max-w-7xl px-6">
      <div class="mx-auto max-w-2xl text-center">
        <h1 class="text-5xl font-semibold tracking-tight">hmkconf</h1>
        <p class="mt-4 text-lg font-medium text-wrap text-muted-foreground">
          A web-based configurator for libhmk keyboards. Customize keyboard
          bindings, adjust actuation points, enable Rapid Trigger, and more.
        </p>
        <div class="mt-6 flex items-center justify-center gap-4">
          <Button onclick={() => handleConnect()} size="lg">
            <CableIcon /> Connect Keyboard
          </Button>
          <Button href="/demo" size="lg" variant="outline">Try Demo</Button>
        </div>
      </div>
      <div class="mt-16 grid place-items-center">
        <div class="overflow-hidden rounded-xl border shadow-md">
          <img
            class="dark:hidden"
            alt="Screenshot"
            src={screenshot}
            width="1024"
            height="768"
          />
          <img
            class="not-dark:hidden"
            alt="Screenshot"
            src={screenshotDark}
            width="1024"
            height="768"
          />
        </div>
      </div>
    </div>
  </main>
  <Footer />
{/if}
