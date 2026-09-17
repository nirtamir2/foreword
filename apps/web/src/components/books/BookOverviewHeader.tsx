import { Link } from "@tanstack/react-router";
import { BookOpenCheck, Download, GraduationCap, Loader2, PlusCircle, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonVariants } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { useLocale } from "@/hooks/useLocale";
import { languageLabel } from "@/lib/languages";
import { analysisStatusLabel, formatNumber, levelLabel } from "@/lib/vocabularyLabels";
import { m } from "@/paraglide/messages.js";
import type { BookDetail } from "@/utils/apiTypes";

interface Counts {
  total: number;
  known: number;
  learning: number;
  fresh: number;
}

interface Props {
  book: BookDetail;
  counts: Counts;
  isPreparing: boolean;
  canAddMore: boolean;
  onAddMore: () => void;
  onExport: () => void;
  onDelete: () => void;
}

export function BookOverviewHeader({
  book,
  counts,
  isPreparing,
  canAddMore,
  onAddMore,
  onExport,
  onDelete,
}: Props) {
  const locale = useLocale();
  const toLearn = counts.fresh + counts.learning;
  const percent = counts.total === 0 ? 0 : Math.round((counts.known / counts.total) * 100);

  return (
    <section className="grid grid-cols-1 gap-px overflow-hidden rounded-3xl border border-app-border bg-app-border shadow-(--app-shadow-raised) lg:grid-cols-[minmax(0,1.4fr)_minmax(20rem,0.8fr)]">
      <div className="flex min-w-0 flex-col gap-6 bg-app-surface p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{languageLabel({ code: book.bookLanguage })}</Badge>
          <Badge variant="outline">→ {languageLabel({ code: book.nativeLanguage })}</Badge>
          <Badge variant="secondary">{levelLabel({ level: book.level })}</Badge>
          <Badge variant="secondary">{book.sourceFormat}</Badge>
          {book.analysisStatus === "READY" ? null : (
            <Badge variant="warning">
              <Loader2 className="animate-spin" />
              {analysisStatusLabel({ status: book.analysisStatus })}
            </Badge>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <h2
            className="font-display text-4xl/tight tracking-tight text-app-text sm:text-5xl/tight"
            dir="auto"
          >
            {book.title}
          </h2>
          <p className="text-base text-app-text-muted" dir="auto">
            {book.author ?? m.unknown_author()}
            {book.totalWords == null
              ? null
              : ` · ${m.book_words_count({ count: formatNumber(book.totalWords, locale) })}`}
            {book.totalChapters == null
              ? null
              : ` · ${m.book_chapters_count({ count: book.totalChapters })}`}
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <p className="font-mono text-6xl/none font-semibold tracking-tight text-app-text tabular-nums sm:text-7xl/none">
            {toLearn}
          </p>
          <div className="flex flex-col gap-0.5 pb-1.5">
            <p className="text-sm font-semibold text-app-accent">{m.overview_words_to_learn()}</p>
            <p className="max-w-sm text-sm text-app-text-muted">
              {m.overview_words_to_learn_description()}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {toLearn > 0 ? (
            <Link
              to="/study/$bookId"
              params={{ bookId: book.id }}
              search={{ scope: "TO_LEARN" }}
              className={buttonVariants({ size: "lg" })}
            >
              <GraduationCap data-icon="inline-start" />
              {m.overview_start_studying()}
            </Link>
          ) : null}
          <Button
            type="button"
            variant={toLearn === 0 ? "default" : "outline"}
            size="lg"
            disabled={isPreparing || !canAddMore}
            onClick={onAddMore}
          >
            {isPreparing ? <Loader2 className="animate-spin" /> : <PlusCircle />}
            {isPreparing ? m.overview_preparing() : m.overview_add_more_words()}
          </Button>
          {counts.known > 0 ? (
            <Link
              to="/study/$bookId"
              params={{ bookId: book.id }}
              search={{ scope: "KNOWN" }}
              className={buttonVariants({ size: "lg", variant: "ghost" })}
            >
              <BookOpenCheck data-icon="inline-start" />
              {m.overview_review_known()}
            </Link>
          ) : null}
        </div>
      </div>

      <aside className="flex min-w-0 flex-col gap-5 bg-app-surface-soft p-6 sm:p-8">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-app-text-muted">{m.overview_progress()}</span>
          <span className="font-mono text-2xl font-semibold text-app-text tabular-nums">
            {percent}%
          </span>
        </div>
        <Progress
          value={counts.known}
          secondaryValue={counts.learning}
          max={Math.max(1, counts.total)}
          tone="success"
          size="lg"
          label={m.overview_progress()}
        />
        <dl className="grid grid-cols-3 gap-2">
          <OverviewStat label={m.status_known()} value={counts.known} dotClass="bg-app-success" />
          <OverviewStat
            label={m.status_learning()}
            value={counts.learning}
            dotClass="bg-app-warning"
          />
          <OverviewStat label={m.status_new()} value={counts.fresh} dotClass="bg-app-accent" />
        </dl>
        <div className="mt-auto flex flex-wrap gap-2 border-t border-app-border pt-4">
          <Button
            type="button"
            variant="subtle"
            size="sm"
            onClick={onExport}
            disabled={counts.total === 0}
          >
            <Download />
            {m.overview_export_csv()}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onDelete}>
            <Trash2 />
            {m.overview_delete_book()}
          </Button>
        </div>
      </aside>
    </section>
  );
}

function OverviewStat({
  label,
  value,
  dotClass,
}: {
  label: string;
  value: number;
  dotClass: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-app-border bg-app-surface px-3 py-2.5">
      <dd className="font-mono text-xl font-semibold text-app-text tabular-nums">{value}</dd>
      <dt className="flex items-center gap-1.5 text-xs text-app-text-subtle">
        <span className={`size-1.5 rounded-full ${dotClass}`} />
        {label}
      </dt>
    </div>
  );
}
