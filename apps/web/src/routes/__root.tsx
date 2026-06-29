import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { Toaster } from "@/components/ui/Toaster";
import { m } from "@/paraglide/messages.js";
import { getLocale, getTextDirection } from "@/paraglide/runtime.js";
import { appName } from "@/utils/appName";
import { buildSeo } from "@/utils/buildSeo";
import type { orpc } from "@/utils/orpc";
import styles from "../index.css?url";

export interface RouterAppContext {
  orpc: typeof orpc;
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  head: () => {
    const seo = buildSeo({
      title: appName(),
      description: m.seo_root_description(),
      pathname: "/",
    });

    return {
      meta: [
        { charSet: "utf8" },
        {
          name: "viewport",
          content: "width=device-width, initial-scale=1, viewport-fit=cover",
        },
        { name: "theme-color", content: "#0b1020" },
        { name: "apple-mobile-web-app-title", content: appName() },
        ...seo.meta,
      ],
      links: [
        { rel: "stylesheet", href: styles },
        { rel: "icon", href: "/favicon.ico", sizes: "32x32" },
        { rel: "icon", href: "/icon.svg", type: "image/svg+xml" },
        { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
        { rel: "manifest", href: "/manifest.webmanifest" },
      ],
    };
  },

  component: RootDocument,
});

function RootDocument() {
  const locale = getLocale();
  const textDirection = getTextDirection();

  return (
    <html lang={locale} dir={textDirection} suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="bg-app-canvas text-app-text antialiased">
        <Outlet />
        <Toaster richColors />
        <script src="/register-service-worker.js" defer />

        <TanStackDevtools
          config={{
            position: "bottom-right",
            hideUntilHover: true,
          }}
          plugins={[
            {
              name: "TanStack Query",
              render: <ReactQueryDevtoolsPanel />,
            },
            {
              name: "TanStack Router",
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  );
}
