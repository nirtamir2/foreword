import type * as React from "react";

export function Skeleton({ style, ...props }: Omit<React.ComponentProps<"div">, "className">) {
  return <div data-slot="skeleton" className="shimmer rounded-xl" style={style} {...props} />;
}
