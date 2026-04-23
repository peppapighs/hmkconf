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
  import { displayDistance } from "$lib/distance"
  import { HMK_MAX_DISTANCE, HMK_MIN_DISTANCE } from "$lib/libhmk"
</script>

<div
  class="flex flex-col items-center text-sm text-muted-foreground"
  style:grid-area="analog-max"
>
  255
</div>
<div
  class="flex -rotate-90 flex-col items-center justify-center text-sm whitespace-nowrap text-muted-foreground"
  style:grid-area="analog-label"
>
  Analog Value
</div>
<div
  class="flex flex-col items-center justify-end text-sm text-muted-foreground"
  style:grid-area="analog-min"
>
  0
</div>
<div
  class="flex items-center text-sm text-muted-foreground"
  style:grid-area="switch-min"
>
  {displayDistance(HMK_MIN_DISTANCE)}mm
</div>
<div
  class="flex items-center justify-center text-sm text-muted-foreground"
  style:grid-area="switch-label"
>
  Key Press Distance
</div>
<div
  class="flex items-center justify-end text-sm text-muted-foreground"
  style:grid-area="switch-max"
>
  {displayDistance(HMK_MAX_DISTANCE)}mm
</div>
