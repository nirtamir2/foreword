import { QueryClientProvider } from "@tanstack/react-query";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { ErrorBoundaryFallback } from "@/components/layout/ErrorBoundaryFallback";
import { Loader } from "@/components/layout/Loader";
import { RouterInnerWrap } from "@/components/layout/RouterInnerWrap";
import "./index.css";
import { m } from "@/paraglide/messages.js";
import { routeTree } from "./routeTree.gen";
import { orpc, queryClient } from "./utils/orpc";

function RouterWrap({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

function getMobilePendingOptions(): { defaultPendingMs?: number; defaultPendingMinMs?: number } {
  if (import.meta.env.SSR) {
    return {};
  }

  if (!globalThis.window.matchMedia("(max-width: 767px)").matches) {
    return {};
  }

  return {
    defaultPendingMs: 150,
    defaultPendingMinMs: 250,
  };
}

export const getRouter = () => {
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: "intent",
    ...getMobilePendingOptions(),
    context: { orpc, queryClient },
    defaultPendingComponent: () => <Loader />,
    defaultErrorComponent: ErrorBoundaryFallback,
    defaultNotFoundComponent: () => <div>{m.not_found()}</div>,
    Wrap: RouterWrap,
    InnerWrap: RouterInnerWrap,
  });
  return router;
};

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
