import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { clsx } from "clsx";

const badgeVariants = cva(
  "group/badge inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-md border border-transparent px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap transition-[border-color,background-color,color] duration-150 ease-(--ease-app-out) focus-visible:ring-2 focus-visible:ring-app-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-app-canvas focus-visible:outline-none has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-app-red aria-invalid:ring-app-red/20 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "border-app-accent/40 bg-app-accent text-app-canvas [a]:hover:bg-app-accent/90",
        secondary: "border-app-border bg-app-surface-muted text-app-text [a]:hover:bg-white/10",
        destructive:
          "border-app-red/35 bg-app-red/10 text-app-red focus-visible:ring-app-red/20 [a]:hover:bg-app-red/20",
        outline:
          "border-app-border bg-transparent text-app-text-muted [a]:hover:bg-app-surface-soft [a]:hover:text-app-text",
        ghost: "text-app-text-muted hover:bg-app-surface-soft hover:text-app-text",
        link: "text-app-accent underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  variant = "default",
  render,
  ...props
}: Omit<useRender.ComponentProps<"span">, "className"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: clsx(badgeVariants({ variant })),
      },
      props,
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  });
}

export { Badge, badgeVariants };
