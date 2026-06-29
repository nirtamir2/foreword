import type * as React from "react";

const skeletonFillStyle = {
  animation: "shimmer 1.5s ease-in-out infinite",
} as const;

export function Skeleton({ style, ...props }: Omit<React.ComponentProps<"div">, "className">) {
  return (
    <div
      data-slot="skeleton"
      className="rounded-lg bg-linear-to-r from-white/5 via-white/10 to-white/5 bg-size-[200%_100%]"
      style={{ ...skeletonFillStyle, ...style }}
      {...props}
    />
  );
}
