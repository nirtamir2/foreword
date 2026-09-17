import { Link } from "@tanstack/react-router";
import { Library, Plus } from "lucide-react";
import { m } from "@/paraglide/messages.js";

/** Primary product navigation for signed-in users. Renders inline in the header and stacked in the drawer. */
interface Props {
  /** Called after a link is chosen so a containing drawer can close. */
  onNavigate: (() => void) | null;
}

export function AppNavigation({ onNavigate }: Props) {
  return (
    <>
      <Link
        to="/library"
        onClick={onNavigate ?? undefined}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-app-text-muted transition-colors hover:bg-app-surface-muted hover:text-app-text data-[status=active]:bg-app-surface-muted data-[status=active]:text-app-text"
      >
        <Library className="size-4" />
        {m.nav_library()}
      </Link>
      <Link
        to="/books/new"
        onClick={onNavigate ?? undefined}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-app-text-muted transition-colors hover:bg-app-surface-muted hover:text-app-text data-[status=active]:bg-app-surface-muted data-[status=active]:text-app-text"
      >
        <Plus className="size-4" />
        {m.nav_add_book()}
      </Link>
    </>
  );
}
