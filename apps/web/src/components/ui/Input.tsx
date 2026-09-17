import type * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";
import { cva } from "class-variance-authority";

const inputVariants = cva(
  "h-10 w-full min-w-0 rounded-lg border border-app-border bg-app-surface px-3 py-2 text-sm text-app-text shadow-xs transition-[border-color,background-color,box-shadow,color] duration-150 ease-(--ease-app-out) outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-xs file:font-medium file:text-app-text placeholder:text-app-text-subtle hover:border-app-border-strong focus-visible:border-app-accent focus-visible:ring-3 focus-visible:ring-app-accent/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-app-red aria-invalid:ring-3 aria-invalid:ring-app-red/20",
);

function Input({ type, ...props }: Omit<React.ComponentProps<"input">, "className">) {
  return <InputPrimitive type={type} data-slot="input" className={inputVariants()} {...props} />;
}

export { Input, inputVariants };
