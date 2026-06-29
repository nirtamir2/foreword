import type * as React from "react";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";

export const surfaceVariants = cva(
  "overflow-hidden border text-app-text shadow-(--app-shadow-raised) transition-[transform,border-color,background-color,box-shadow] duration-180 ease-(--ease-app-out)",
  {
    variants: {
      tone: {
        neutral: "border-app-border bg-app-surface-soft",
        raised: "border-app-border bg-app-surface-raised",
        accent: "border-app-accent/35 bg-app-accent/10",
        danger: "border-app-red/35 bg-app-red/10",
      },
      radius: {
        sm: "rounded-lg",
        default: "rounded-lg",
        lg: "rounded-xl",
      },
      padding: {
        none: "p-0",
        sm: "p-3",
        default: "p-4 md:p-5",
        lg: "p-6 md:p-8",
      },
      interactive: {
        true: "cursor-pointer hover:border-app-border-strong hover:bg-app-surface-muted active:scale-[0.97]",
        false: "",
      },
      align: {
        start: "text-start",
        center: "text-center",
      },
      fullHeight: {
        true: "h-full",
        false: "",
      },
      maxWidth: {
        none: "",
        sm: "mx-auto max-w-sm",
        md: "mx-auto max-w-md",
        "full-md": "w-full max-w-md",
      },
      groupRelative: {
        true: "group relative",
        false: "",
      },
    },
    defaultVariants: {
      tone: "neutral",
      radius: "default",
      padding: "default",
      interactive: false,
      align: "start",
      fullHeight: false,
      maxWidth: "none",
      groupRelative: false,
    },
  },
);

interface Props
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, "className">,
    VariantProps<typeof surfaceVariants> {
  ref?: React.RefObject<HTMLDivElement | null>;
}

export function Surface({
  ref,
  tone,
  radius,
  padding,
  interactive,
  align,
  fullHeight,
  maxWidth,
  groupRelative,
  ...props
}: Props) {
  return (
    <div
      ref={ref}
      data-slot="surface"
      className={surfaceVariants({
        tone,
        radius,
        padding,
        interactive,
        align,
        fullHeight,
        maxWidth,
        groupRelative,
      })}
      {...props}
    />
  );
}
