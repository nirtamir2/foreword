import { Button as ButtonPrimitive } from "@base-ui/react/button";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import type { OmitClassName } from "@/components/ui/OmitClassName";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-semibold whitespace-nowrap transition-[transform,border-color,background-color,color,box-shadow] duration-150 ease-(--ease-app-out) outline-none select-none focus-visible:ring-2 focus-visible:ring-app-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-app-canvas focus-visible:outline-none active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-app-red aria-invalid:ring-2 aria-invalid:ring-app-red/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-app-accent text-app-on-accent shadow-(--app-shadow-pressed) hover:bg-app-accent-strong",
        ink: "bg-app-ink text-app-canvas hover:bg-app-ink/90",
        outline:
          "border-app-border bg-app-surface text-app-text shadow-xs hover:border-app-border-strong hover:bg-app-surface-soft aria-expanded:border-app-border-strong aria-expanded:bg-app-surface-soft",
        secondary:
          "bg-app-surface-muted text-app-text hover:bg-app-border/70 aria-expanded:bg-app-border/70",
        ghost:
          "text-app-text-muted hover:bg-app-surface-muted hover:text-app-text aria-expanded:bg-app-surface-muted aria-expanded:text-app-text",
        destructive:
          "border-app-red/20 bg-app-red-soft text-app-red hover:bg-app-red/15 focus-visible:ring-app-red/30",
        subtle:
          "border-app-border bg-transparent text-app-text-muted hover:border-app-border-strong hover:bg-app-surface-soft hover:text-app-text",
        success: "bg-app-success text-white hover:bg-app-success/90",
        link: "rounded-sm px-0 text-app-accent underline-offset-4 hover:underline active:scale-100",
      },
      size: {
        default:
          "h-10 gap-2 px-4 has-data-[icon=inline-end]:pe-3 has-data-[icon=inline-start]:ps-3",
        xs: "h-7 gap-1.5 rounded-md px-2.5 text-xs has-data-[icon=inline-end]:pe-2 has-data-[icon=inline-start]:ps-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-md px-3 text-xs has-data-[icon=inline-end]:pe-2.5 has-data-[icon=inline-start]:ps-2.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-12 gap-2 rounded-xl px-6 text-base has-data-[icon=inline-end]:pe-4 has-data-[icon=inline-start]:ps-4",
        icon: "size-10",
        "icon-xs": "size-7 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-md",
        "icon-lg": "size-12 rounded-xl",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      fullWidth: false,
    },
  },
);

function Button({
  variant = "default",
  size = "default",
  fullWidth = false,
  ...props
}: OmitClassName<ButtonPrimitive.Props> & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={buttonVariants({ variant, size, fullWidth })}
      {...props}
    />
  );
}

export { Button, buttonVariants };
