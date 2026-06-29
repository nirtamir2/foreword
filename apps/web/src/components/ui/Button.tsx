import { Button as ButtonPrimitive } from "@base-ui/react/button";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import type { OmitClassName } from "@/components/ui/OmitClassName";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-semibold whitespace-nowrap transition-[transform,border-color,background-color,color,box-shadow] duration-150 ease-(--ease-app-out) outline-none select-none focus-visible:ring-2 focus-visible:ring-app-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-app-canvas focus-visible:outline-none active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-app-red aria-invalid:ring-2 aria-invalid:ring-app-red/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-app-accent text-app-canvas shadow-(--app-shadow-pressed) hover:bg-app-accent/90",
        outline:
          "border-app-border bg-transparent text-app-text hover:border-app-border-strong hover:bg-app-surface-soft aria-expanded:border-app-border-strong aria-expanded:bg-app-surface-soft",
        secondary:
          "border-app-border bg-app-surface-muted text-app-text hover:border-app-border-strong hover:bg-white/10 aria-expanded:border-app-border-strong aria-expanded:bg-white/10",
        ghost:
          "text-app-text-muted hover:bg-app-surface-soft hover:text-app-text aria-expanded:bg-app-surface-soft aria-expanded:text-app-text",
        destructive:
          "border-app-red/35 bg-app-red/10 text-app-red hover:bg-app-red/15 focus-visible:ring-app-red/30",
        subtle:
          "border-app-border bg-white/0 text-app-text-muted hover:border-app-border-strong hover:bg-app-surface-soft hover:text-app-text",
        link: "rounded-sm px-0 text-app-accent underline-offset-4 hover:underline active:scale-100",
      },
      size: {
        default:
          "h-10 gap-2 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-7 gap-1.5 rounded-md px-2.5 text-xs has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-md px-3 text-xs has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-12 gap-2 px-5 text-base has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        icon: "size-10",
        "icon-xs": "size-7 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-md",
        "icon-lg": "size-12",
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
