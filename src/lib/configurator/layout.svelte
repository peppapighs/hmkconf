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
  import { MonitorIcon } from "@lucide/svelte"
  import GithubLink from "$lib/components/github-link.svelte"
  import ThemeSwitcher from "$lib/components/theme-switcher.svelte"
  import * as Sidebar from "$lib/components/ui/sidebar"
  import { Tabs } from "bits-ui"
  import type { ComponentProps } from "svelte"
  import { globalStateContext } from "./context.svelte"
  import { MIN_WINDOW_HEIGHT, MIN_WINDOW_WIDTH } from "./lib/layout"
  import ProfileSelect from "./profile-select.svelte"
  import ConfiguratorSidebar from "./sidebar/sidebar.svelte"

  const { children, ...props }: ComponentProps<typeof Sidebar.Provider> =
    $props()

  const globalState = globalStateContext.get()

  let innerWidth = $state(Infinity)
  let innerHeight = $state(Infinity)
</script>

<svelte:window bind:innerWidth bind:innerHeight />

{#if innerWidth < MIN_WINDOW_WIDTH || innerHeight < MIN_WINDOW_HEIGHT}
  <div
    class="flex min-h-svh flex-col items-center justify-center px-6 py-24 text-muted-foreground"
  >
    <MonitorIcon class="size-24" />
    <div class="mx-auto max-w-2xl text-center">
      <p class="mt-4 text-lg font-medium text-wrap">
        Your window is too small. Please resize your window, or zoom out.
      </p>
    </div>
  </div>
{:else}
  <Tabs.Root bind:value={globalState.tab}>
    <Sidebar.Provider {...props}>
      <ConfiguratorSidebar />
      <Sidebar.Inset>
        <header class="flex h-14 shrink-0 items-center gap-4 px-4">
          <div class="flex flex-1 items-center gap-2">
            <Sidebar.Trigger class="-ml-1" />
            <Sidebar.Separator
              class="mr-2 data-[orientation=vertical]:h-4"
              orientation="vertical"
            />
            <ProfileSelect />
          </div>
          <div class="flex shrink-0 items-center gap-2">
            <GithubLink />
            <ThemeSwitcher />
          </div>
        </header>
        <main class="flex flex-1 flex-col">{@render children?.()}</main>
      </Sidebar.Inset>
    </Sidebar.Provider>
  </Tabs.Root>
{/if}
