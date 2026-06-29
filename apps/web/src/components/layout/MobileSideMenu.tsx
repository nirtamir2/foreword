import type { ReactNode } from "react";
import { useState } from "react";
import { Drawer } from "@base-ui/react/drawer";
import { Link } from "@tanstack/react-router";
import clsx from "clsx";
import { Home, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { m } from "@/paraglide/messages.js";
import { getTextDirection } from "@/paraglide/runtime.js";

interface Props {
  headerAction: ReactNode;
  headerControls: ReactNode;
}

function getMobileSideMenuSide() {
  return getTextDirection() === "rtl" ? "right" : "left";
}

export function MobileSideMenu({ headerAction, headerControls }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const side = getMobileSideMenuSide();

  return (
    <div className="md:hidden">
      <Drawer.Root open={isOpen} onOpenChange={setIsOpen} swipeDirection={side}>
        <Drawer.Trigger render={<Button variant="secondary" size="icon-sm" aria-label={m.menu_open()} />}>
          <Menu className="size-4" />
        </Drawer.Trigger>

        <Drawer.Portal>
          <Drawer.Backdrop className="fixed inset-0 z-50 bg-black/70 transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0" />
          <Drawer.Viewport
            className={clsx(
              "fixed inset-0 z-50 flex p-0",
              side === "right" ? "justify-end" : "justify-start",
            )}
          >
            <Drawer.Popup
              className={clsx(
                "flex h-full w-80 max-w-[calc(100vw-3rem)] flex-col gap-5 border-app-border bg-app-canvas p-5 text-app-text shadow-(--app-shadow-raised) transition-transform duration-200 ease-(--ease-app-out) data-ending-style:duration-150",
                side === "right"
                  ? "border-s data-ending-style:translate-x-full data-starting-style:translate-x-full"
                  : "border-e data-ending-style:-translate-x-full data-starting-style:-translate-x-full",
              )}
            >
              <header className="flex items-center justify-between gap-3">
                <Drawer.Title className="text-lg font-semibold tracking-tight">
                  {m.app_name()}
                </Drawer.Title>
                <Drawer.Description className="sr-only">
                  {m.mobile_navigation_description()}
                </Drawer.Description>
                <Drawer.Close render={<Button variant="ghost" size="icon-sm" aria-label={m.menu_close()} />}>
                  <X className="size-4" />
                </Drawer.Close>
              </header>

              <nav className="grid gap-2">
                <Link
                  to="/"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-app-text-muted transition-colors hover:bg-app-surface-soft hover:text-app-text"
                  onClick={() => {
                    setIsOpen(false);
                  }}
                >
                  <Home className="size-4" />
                  {m.home()}
                </Link>
              </nav>

              <div className="grid gap-2">{headerAction}</div>
              <div className="mt-auto grid gap-2">{headerControls}</div>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}
