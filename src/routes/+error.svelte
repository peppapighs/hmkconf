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
  import Footer from "$lib/components/footer.svelte"
  import { Button } from "$lib/components/ui/button"
</script>

<main class="grid min-h-svh place-items-center px-6 py-24">
  <div class="text-center">
    <h1 class="text-5xl font-semibold tracking-tight">Page not found</h1>
    <div class="mt-6 grid place-items-center">
      <Button href="/" size="lg">Go Back Home</Button>
    </div>
  </div>
</main>
<Footer />
