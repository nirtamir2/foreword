import type * as React from "react";

export function Kbd(props: Omit<React.ComponentProps<"kbd">, "className">) {
  return (
    <kbd
      data-slot="kbd"
      className="inline-flex h-5 min-w-5 items-center justify-center rounded-[5px] border border-app-border bg-app-surface px-1.5 font-mono text-[0.6875rem] font-medium text-app-text-muted shadow-[inset_0_-1px_0_var(--app-border)]"
      {...props}
    />
  );
}
