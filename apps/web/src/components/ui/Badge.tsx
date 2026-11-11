import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { clsx } from "clsx";

const badgeVariants = cva(
  "group/badge inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border px-2.5 text-xs font-medium whitespace-nowrap transition-[border-color,background-color,color] duration-150 ease-(--ease-app-out) focus-visible:ring-2 focus-visible:ring-app-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-app-canvas focus-visible:outline-none [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "border-transparent bg-app-accent text-app-on-accent",
        accent: "border-app-accent/15 bg-app-accent-soft text-app-accent-strong",
        secondary: "border-transparent bg-app-surface-muted text-app-text",
        outline: "border-app-border bg-app-surface text-app-text-muted",
        success: "border-app-success/20 bg-app-success-soft text-app-success",
        warning: "border-app-warning/25 bg-app-warning-soft text-app-warning",
        destructive: "border-app-red/20 bg-app-red-soft text-app-red",
        highlight: "border-transparent bg-app-highlight-soft text-app-ink",
        ghost: "border-transparent text-app-text-muted",
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
  const className = clsx(badgeVariants({ variant }));
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className,
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
