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
  import { cn, type WithElementRef } from "$lib/utils"
  import type { Snippet } from "svelte"
  import type { HTMLButtonAttributes } from "svelte/elements"
  import { tv, type VariantProps } from "tailwind-variants"
  import { toggleVariants } from "../ui/toggle"

  const keyButtonVariants = tv({
    base: cn(
      toggleVariants({ variant: "outline" }),
      "size-full flex-col gap-0 p-0 text-[length:inherit] leading-[1em] whitespace-pre-wrap [&_svg:not([class*='size-'])]:size-[1em]",
    ),
    variants: {
      size: {
        default: "[&_span]:text-[length:0.875em]",
        sm: "[&_span]:text-[length:0.75em]",
      },
    },
    defaultVariants: { size: "default" },
  })

  let {
    children,
    class: className,
    ref = $bindable(null),
    size = "default",
    child,
    ...props
  }: WithElementRef<HTMLButtonAttributes> &
    VariantProps<typeof keyButtonVariants> & {
      child?: Snippet<[{ props: Record<string, unknown> }]>
    } = $props()

  const mergedProps = $derived({
    children,
    class: cn(keyButtonVariants({ size }), className),
    ...props,
  })
</script>

{#if child}
  {@render child({ props: mergedProps })}
{:else}
  <button bind:this={ref} {...mergedProps}>
    {@render children?.()}
  </button>
{/if}
