import type * as React from "react";
import { useRouterState } from "@tanstack/react-router";
import type { AnyRouter } from "@tanstack/react-router";

interface Props {
  children: React.ReactNode;
}

export function RouterInnerWrap({ children }: Props): React.JSX.Element {
  const isNavigating = useRouterState<AnyRouter, boolean>({
    select: (state) => state.isLoading,
  });

  return (
    <>
      {isNavigating ? (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 animate-pulse bg-app-accent shadow-[0_0_18px_rgba(45,212,191,0.42)] motion-reduce:animate-none"
        />
      ) : null}
      {children}
    </>
  );
}
