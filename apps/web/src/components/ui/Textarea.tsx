import type * as React from "react";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";

export const textareaVariants = cva(
  "flex field-sizing-content min-h-24 w-full resize-none rounded-lg border bg-app-surface-soft px-4 py-3 text-sm text-app-text transition-[border-color,background-color,box-shadow] duration-150 ease-(--ease-app-out) outline-none placeholder:text-app-text-subtle disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-app-red aria-invalid:ring-2 aria-invalid:ring-app-red/20",
  {
    variants: {
      tone: {
        neutral:
          "border-app-border focus-visible:border-app-accent/80 focus-visible:ring-2 focus-visible:ring-app-accent/25",
        danger:
          "border-app-red/35 bg-app-red/10 focus-visible:border-app-red/80 focus-visible:ring-2 focus-visible:ring-app-red/25",
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
