import { BookOpen, FileText, Hash, Languages, Layers, User } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { useLocale } from "@/hooks/useLocale";
import { languageLabel } from "@/lib/languages";
import type { ParsedBook } from "@/lib/parsing/types";
import { formatNumber } from "@/lib/vocabularyLabels";
import { m } from "@/paraglide/messages.js";

interface Props {
  book: ParsedBook;
  onReplace: (() => void) | null;
}

export function ParsedBookSummary({ book, onReplace }: Props) {
  const locale = useLocale();
  const chapterLabel = book.sourceFormat === "PDF" ? m.summary_sections() : m.summary_chapters();

  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-app-border bg-app-surface p-5 shadow-(--app-shadow-raised) sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-app-ink text-app-canvas">
            <BookOpen className="size-5" />
          </span>
          <div className="flex min-w-0 flex-col gap-1">
            <p className="text-xs font-medium text-app-text-subtle uppercase">
              {m.summary_detected()}
            </p>
            <h2
              className="font-display text-2xl/tight tracking-tight text-app-text sm:text-3xl/tight"
              dir="auto"
            >
              {book.title ?? m.untitled_book()}
            </h2>
            <p className="flex items-center gap-1.5 text-sm text-app-text-muted" dir="auto">
              <User className="size-3.5" />
              {book.author ?? m.unknown_author()}
            </p>
          </div>
        </div>
        {onReplace == null ? null : (
          <button
            type="button"
            onClick={onReplace}
            className="text-sm font-medium text-app-accent underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-app-accent/40 focus-visible:outline-none"
          >
            {m.summary_replace_file()}
          </button>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryStat icon={<FileText />} label={m.summary_format()} value={book.sourceFormat} />
        <SummaryStat
          icon={<Layers />}
          label={chapterLabel}
          value={formatNumber(book.chapters.length, locale)}
        />
        <SummaryStat
          icon={<Hash />}
          label={m.summary_words()}
          value={formatNumber(book.totalWords, locale)}
        />
        <SummaryStat
          icon={<Languages />}
          label={m.summary_language()}
          value={languageLabel({ code: book.detectedLanguage })}
          badge={
            book.detectedLanguage == null ? (
              <Badge variant="warning">{m.summary_language_unknown()}</Badge>
            ) : null
          }
        />
      </dl>
    </section>
  );
}

function SummaryStat({
  icon,
  label,
  value,
  badge = null,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  badge?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl bg-app-surface-soft px-3.5 py-3">
      <dt className="flex items-center gap-1.5 text-xs text-app-text-subtle [&_svg]:size-3.5">
        {icon}
        {label}
      </dt>
      <dd
        className="flex flex-wrap items-center gap-2 text-sm font-semibold text-app-text"
        dir="auto"
      >
        {value}
        {badge}
      </dd>
    </div>
  );
}
