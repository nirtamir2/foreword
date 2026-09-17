import type * as React from "react";
import { Link } from "@tanstack/react-router";
import { clsx } from "clsx";
import { BrandMark } from "@/components/layout/BrandMark";
import { MobileSideMenu } from "@/components/layout/MobileSideMenu";
import { PageBackButton } from "@/components/ui/PageBackButton";
import { m } from "@/paraglide/messages.js";

type PageWidth = "default" | "narrow" | "wide";

export type NavigationRenderer = (input: { onNavigate: (() => void) | null }) => React.ReactNode;

interface Props {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  headerAction?: React.ReactNode;
  headerControls?: React.ReactNode;
  /** Primary navigation shown in the header for signed-in users. */
  navigation?: NavigationRenderer | null;
  width?: PageWidth;
  /** Removes the padded container so a page can paint edge-to-edge sections. */
  bleed?: boolean;
  children: React.ReactNode;
}

export function PageLayout({
  title,
  subtitle,
  onBack,
  headerAction,
  headerControls,
  navigation,
  width = "default",
  bleed = false,
  children,
}: Props) {
  return (
    <div className="relative flex min-h-screen flex-col bg-app-canvas text-app-text">
      <header className="sticky top-0 z-30 border-b border-app-border/80 bg-app-canvas/85 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <MobileSideMenu
              headerAction={headerAction ?? null}
              headerControls={headerControls ?? null}
              navigation={navigation ?? null}
            />
            {onBack == null ? null : <PageBackButton onBack={onBack} />}
            <Link
              to="/"
              className="flex shrink-0 items-center gap-2.5 rounded-lg focus-visible:ring-2 focus-visible:ring-app-accent/40 focus-visible:outline-none"
              aria-label={m.app_name()}
            >
              <BrandMark size="sm" />
              <span className="hidden font-display text-xl tracking-tight text-app-text sm:inline">
                {m.app_name()}
              </span>
            </Link>
            {title == null ? null : (
              <>
                <span aria-hidden="true" className="hidden h-5 w-px bg-app-border sm:block" />
                <div className="min-w-0">
                  <h1
                    className="truncate text-sm font-semibold tracking-tight text-app-text sm:text-base"
                    dir="auto"
                  >
                    {title}
                  </h1>
                  {subtitle == null ? null : (
                    <p className="hidden truncate text-xs text-app-text-subtle sm:block" dir="auto">
                      {subtitle}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {navigation == null ? null : (
              <nav
                aria-label={m.primary_navigation()}
                className="hidden items-center gap-1 md:flex"
              >
                {navigation({ onNavigate: null })}
              </nav>
            )}
            <div
              className={clsx(
                "hidden items-center gap-2 md:flex",
                headerAction == null && headerControls == null && "md:hidden",
              )}
            >
              {headerAction}
              {headerControls}
            </div>
          </div>
        </div>
      </header>

      <main
        className={clsx(
          "flex-1",
          !bleed && "container mx-auto px-4 py-6 sm:px-6 sm:py-10",
          !bleed && width === "narrow" && "max-w-3xl",
          !bleed && width === "default" && "max-w-6xl",
          !bleed && width === "wide" && "max-w-7xl",
        )}
      >
        {children}
      </main>

      <footer className="border-t border-app-border bg-app-surface-soft/60">
        <div className="container mx-auto flex flex-wrap items-center justify-center gap-4 px-4 py-6 text-xs text-app-text-subtle sm:justify-between sm:px-6">
          <div className="flex items-center gap-2">
            <BrandMark size="sm" />
            <span className="font-display text-base text-app-text">{m.app_name()}</span>
            <span className="hidden sm:inline">· {m.footer_tagline()}</span>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/accessibility-statement" className="transition-colors hover:text-app-text">
              {m.accessibility_statement()}
            </Link>
            <Link to="/privacy-policy" className="transition-colors hover:text-app-text">
              {m.privacy_policy()}
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
