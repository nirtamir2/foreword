import { useEffect } from "react";

type Handler = (event: KeyboardEvent) => void;

interface Props {
  /** Map of `event.key` values (case-sensitive, e.g. " ", "1", "Enter") to handlers. */
  bindings: Partial<Record<string, Handler>>;
  isEnabled: boolean;
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

/** Global key bindings for study sessions. Ignored while the user is typing in a field. */
export function useKeyboardShortcuts({ bindings, isEnabled }: Props) {
  useEffect(() => {
    if (!isEnabled) {
      return;
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey || isTypingTarget(event.target)) {
        return;
      }
      const handler = bindings[event.key];
      if (handler != null) {
        event.preventDefault();
        handler(event);
      }
    }
    globalThis.addEventListener("keydown", handleKeyDown);
    return () => {
      globalThis.removeEventListener("keydown", handleKeyDown);
    };
  }, [bindings, isEnabled]);
}
