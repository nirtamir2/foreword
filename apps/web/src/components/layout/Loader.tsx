import { Loader2 } from "lucide-react";
import { m } from "@/paraglide/messages.js";

export function Loader() {
  return (
    <div
      className="flex h-full items-center justify-center pt-8 text-app-text-subtle"
      role="status"
      aria-live="polite"
    >
      <Loader2 className="size-5 animate-spin" />
      <span className="sr-only">{m.loading()}</span>
    </div>
  );
}
