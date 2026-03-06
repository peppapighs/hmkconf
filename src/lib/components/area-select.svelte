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
  import { clamp, cn, optMap } from "$lib/utils"
  import type { HTMLAttributes } from "svelte/elements"

  const {
    children,
    selections = $bindable(new Set()),
    ...props
  }: HTMLAttributes<HTMLDivElement> & {
    selections?: Set<number>
  } = $props()

  let selectionBoxRef: HTMLElement | null = $state(null)
  let selectionMode: "normal" | "add" | "subtract" = $state("normal")
  let previousSelections: Set<number> | null = $state(null)

  let ref: HTMLElement | null = $state(null)
  let selectionBox: { x1: number; y1: number; x2: number; y2: number } | null =
    $state(null)

  const selectionBoxStyle = $derived.by(() => {
    if (!ref || !selectionBox) return ""

    const bound = ref.getBoundingClientRect()
    const x1 = clamp(selectionBox.x1, [bound.left, bound.right])
    const y1 = clamp(selectionBox.y1, [bound.top, bound.bottom])
    const x2 = clamp(selectionBox.x2, [bound.left, bound.right])
    const y2 = clamp(selectionBox.y2, [bound.top, bound.bottom])

    return `
      left: ${Math.min(x1, x2)}px;
      top: ${Math.min(y1, y2)}px;
      width: ${Math.abs(x1 - x2)}px;
      height: ${Math.abs(y1 - y2)}px;
    `
  })

  const onmousedown = (e: MouseEvent) => {
    if (e.buttons !== 1) return
    selectionBox = {
      x1: e.clientX,
      y1: e.clientY,
      x2: e.clientX,
      y2: e.clientY,
    }
    if (e.shiftKey) {
      selectionMode = "add"
    } else if (e.ctrlKey) {
      selectionMode = "subtract"
    } else {
      selections.clear()
    }
    previousSelections = new Set(selections)
  }

  const onmousemove = (e: MouseEvent) => {
    if (!selectionBox || !ref) return
    selectionBox.x2 = e.clientX
    selectionBox.y2 = e.clientY

    ref.querySelectorAll("*[data-selectable]").forEach((elt) => {
      if (!selectionBoxRef) return

      const index = optMap(elt.getAttribute("data-selectable-index"), Number)
      if (index === undefined || !previousSelections) return

      const a = elt.getBoundingClientRect()
      const b = selectionBoxRef.getBoundingClientRect()
      const intersect = !(
        a.y + a.height < b.y ||
        a.y > b.y + b.height ||
        a.x + a.width < b.x ||
        a.x > b.x + b.width
      )

      switch (selectionMode) {
        case "normal":
          if (intersect) {
            selections.add(index)
          } else {
            selections.delete(index)
          }
          break
        case "add":
          if (intersect) {
            selections.add(index)
          } else if (!previousSelections.has(index)) {
            selections.delete(index)
          }
          break
        case "subtract":
          if (intersect === previousSelections.has(index)) {
            selections.delete(index)
          } else {
            selections.add(index)
          }
          break
      }
    })
  }

  const onmouseup = () => {
    selectionBox = null
    selectionMode = "normal"
    previousSelections = null
  }
</script>

<svelte:document {onmousemove} {onmouseup} />

<div
  bind:this={selectionBoxRef}
  class={cn(
    "fixed z-50 hidden border border-input bg-primary/30",
    selectionBox && "block",
  )}
  style={selectionBoxStyle}
></div>
<div bind:this={ref} {onmousedown} {...props}>
  {@render children?.()}
</div>
