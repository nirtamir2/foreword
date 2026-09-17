import { Link } from "@tanstack/react-router";
import { ArrowUpRight, BookOpen, FileText, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { useLocale } from "@/hooks/useLocale";
import { languageLabel } from "@/lib/languages";
import { formatRelativeDate, levelLabel } from "@/lib/vocabularyLabels";
import { m } from "@/paraglide/messages.js";
import type { BookListItem } from "@/utils/apiTypes";

interface Props {
  book: BookListItem;
}

/** Deterministic cover color per book so the library looks varied without cover images. */
const COVER_HUES = [278, 155, 25, 65, 205, 330];

function coverHue({ id }: { id: string }): number {
  let hash = 0;
  for (const char of id) {
    hash = (hash * 31 + (char.codePointAt(0) ?? 0)) % 100_000;
  }
  return COVER_HUES[hash % COVER_HUES.length] ?? 278;
}

export function BookCard({ book }: Props) {
  const locale = useLocale();
  const toLearn = Math.max(0, book.cardCount - book.knownCount);
  const hue = coverHue({ id: book.id });
  const isReady = book.analysisStatus === "READY";

  return (
    <Link
      to="/books/$bookId"
      params={{ bookId: book.id }}
      className="group/book flex w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-app-border bg-app-surface shadow-(--app-shadow-raised) transition-[transform,box-shadow,border-color] duration-200 ease-(--ease-app-out) hover:-translate-y-0.5 hover:border-app-border-strong hover:shadow-(--app-shadow-floating) focus-visible:ring-2 focus-visible:ring-app-accent/40 focus-visible:outline-none"
    >
      <div
        className="relative flex h-32 items-end justify-between p-4"
        style={{
          background: `linear-gradient(135deg, oklch(0.93 0.05 ${String(hue)}) 0%, oklch(0.86 0.09 ${String(hue)}) 100%)`,
        }}
      >
        <div className="paper-grid absolute inset-0 opacity-50" />
        <span
          className="relative flex size-10 items-center justify-center rounded-lg text-white shadow-(--app-shadow-raised)"
          style={{ background: `oklch(0.45 0.16 ${String(hue)})` }}
        >
          {book.sourceFormat === "PDF" ? (
            <FileText className="size-5" />
          ) : (
            <BookOpen className="size-5" />
          )}
        </span>
        <div className="relative flex flex-wrap justify-end gap-1.5">
          <Badge variant="outline">{languageLabel({ code: book.bookLanguage })}</Badge>
          {isReady ? null : (
            <Badge variant="warning">
              <Loader2 className="animate-spin" />
              {m.book_card_preparing()}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <h3
              className="line-clamp-2 font-display text-xl/tight tracking-tight text-app-text"
              dir="auto"
            >
              {book.title}
            </h3>
            <p className="truncate text-sm text-app-text-muted" dir="auto">
              {book.author ?? m.unknown_author()}
            </p>
          </div>
          <ArrowUpRight className="size-4 shrink-0 text-app-text-subtle transition-transform group-hover/book:translate-x-0.5 group-hover/book:-translate-y-0.5 rtl:-scale-x-100 rtl:group-hover/book:-translate-x-0.5" />
        </div>

        <div className="mt-auto flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-app-text-muted">
            <span>
              {book.cardCount === 0
                ? m.book_card_no_cards()
                : m.book_card_to_learn({ count: toLearn })}
            </span>
            <span className="font-mono font-semibold text-app-text">
              {book.knownCount}/{book.cardCount}
            </span>
          </div>
          <Progress
            value={book.knownCount}
            secondaryValue={book.learningCount}
            max={Math.max(1, book.cardCount)}
            tone="success"
            size="sm"
            label={m.book_card_progress_label()}
          />
          <div className="flex items-center justify-between pt-1 text-xs text-app-text-subtle">
            <span>{levelLabel({ level: book.level })}</span>
            <span>{formatRelativeDate(new Date(book.updatedAt), locale)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
