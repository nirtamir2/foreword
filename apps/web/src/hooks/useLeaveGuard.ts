import { useEffect } from "react";
import { useBlocker } from "@tanstack/react-router";
import { m } from "@/paraglide/messages.js";

interface Props {
  isActive: boolean;
}

/**
 * Warn before the tab closes or the router navigates away while a preparation run is active.
 * The in-app block is resolved by the browser confirm so it also works for keyboard users.
 */
export function useLeaveGuard({ isActive }: Props) {
  useBlocker({
    shouldBlockFn: () => {
      if (!isActive) {
        return false;
      }
      // eslint-disable-next-line no-alert -- native confirm mirrors the browser's beforeunload prompt
      return !confirm(m.prep_leave_warning());
    },
    enableBeforeUnload: () => isActive,
  });

  useEffect(() => {
    if (!isActive) {
      return;
    }
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
    }
    addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isActive]);
}
