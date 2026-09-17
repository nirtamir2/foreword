import type * as React from "react";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";

export const surfaceVariants = cva(
  "overflow-hidden border text-app-text transition-[transform,border-color,background-color,box-shadow] duration-180 ease-(--ease-app-out)",
  {
    variants: {
      tone: {
        neutral: "border-app-border bg-app-surface shadow-(--app-shadow-raised)",
        soft: "border-app-border bg-app-surface-soft",
        raised: "border-app-border bg-app-surface-raised shadow-(--app-shadow-floating)",
        accent: "border-app-accent/15 bg-app-accent-soft",
        success: "border-app-success/20 bg-app-success-soft",
        warning: "border-app-warning/25 bg-app-warning-soft",
        danger: "border-app-red/20 bg-app-red-soft",
        paper: "border-app-border bg-app-paper",
        ink: "border-app-ink bg-app-ink text-app-canvas",
      },
      radius: {
        sm: "rounded-lg",
        default: "rounded-xl",
        lg: "rounded-2xl",
      },
      padding: {
        none: "p-0",
        sm: "p-3",
        default: "p-4 md:p-5",
        lg: "p-6 md:p-8",
      },
      interactive: {
        true: "cursor-pointer hover:border-app-border-strong hover:shadow-(--app-shadow-floating) active:scale-[0.99]",
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
