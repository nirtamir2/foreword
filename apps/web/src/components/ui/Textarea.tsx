import type * as React from "react";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";

export const textareaVariants = cva(
  "flex field-sizing-content min-h-20 w-full resize-none rounded-lg border bg-app-surface px-3 py-2.5 text-sm text-app-text shadow-xs transition-[border-color,background-color,box-shadow] duration-150 ease-(--ease-app-out) outline-none placeholder:text-app-text-subtle disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-app-red aria-invalid:ring-3 aria-invalid:ring-app-red/20",
  {
    variants: {
      tone: {
        neutral:
          "border-app-border hover:border-app-border-strong focus-visible:border-app-accent focus-visible:ring-3 focus-visible:ring-app-accent/20",
        danger:
          "border-app-red/35 bg-app-red-soft focus-visible:border-app-red focus-visible:ring-3 focus-visible:ring-app-red/20",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  },
);

interface Props
  extends
    Omit<React.ComponentProps<"textarea">, "className">,
    VariantProps<typeof textareaVariants> {
  ref?: React.RefObject<HTMLTextAreaElement | null>;
}

function Textarea({ ref, tone, ...props }: Props) {
  return (
    <textarea ref={ref} data-slot="textarea" className={textareaVariants({ tone })} {...props} />
  );
}

export { Textarea };
