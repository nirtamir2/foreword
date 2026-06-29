"use client";

import type * as React from "react";

function Label({ htmlFor, ...props }: Omit<React.ComponentProps<"label">, "className">) {
  return (
    <label
      data-slot="label"
      htmlFor={htmlFor}
      className="flex items-center gap-2 text-sm leading-none font-medium text-app-text-muted select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
      {...props}
    />
  );
}

export { Label };
