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
  import GithubLink from "./github-link.svelte"
  import ThemeSwitcher from "./theme-switcher.svelte"
</script>

<footer class="flex items-center border border-t p-4">
  <div class="flex-1">
    <h1 class="text-xl font-semibold tracking-tight">hmkconf</h1>
  </div>
  <div class="flex shrink-0 items-center gap-2">
    <GithubLink />
    <ThemeSwitcher />
  </div>
</footer>
