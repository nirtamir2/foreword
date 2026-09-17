import { Link } from "@tanstack/react-router";
import { clsx } from "clsx";
import { BookOpen, PartyPopper, RotateCcw, Trophy } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/Button";
import { m } from "@/paraglide/messages.js";

export interface SessionStats {
  answered: number;
  known: number;
  correct: number;
  incorrect: number;
  stillLearning: number;
}

interface Props {
  bookId: string;
  stats: SessionStats;
  remainingToLearn: number;
  onStudyAgain: () => void;
}

export function SessionSummary({ bookId, stats, remainingToLearn, onStudyAgain }: Props) {
  const mastered = stats.known + stats.correct;
  const accuracy = stats.answered === 0 ? 0 : Math.round((mastered / stats.answered) * 100);
  const isAllDone = remainingToLearn === 0;

  return (
    <section className="relative flex animate-pop flex-col items-center gap-8 overflow-hidden rounded-3xl border border-app-border bg-app-surface p-8 text-center shadow-(--app-shadow-floating) sm:p-12">
      <div className="absolute inset-s-1/2 -top-20 -z-10 size-72 -translate-x-1/2 rounded-full bg-app-highlight-soft blur-3xl rtl:translate-x-1/2" />
      <span className="flex size-16 items-center justify-center rounded-2xl bg-app-highlight text-app-ink">
        {isAllDone ? <Trophy className="size-8" /> : <PartyPopper className="size-8" />}
      </span>
      <div className="flex flex-col gap-2">
        <h2 className="font-display text-4xl/tight tracking-tight sm:text-5xl/tight">
          {isAllDone ? m.session_all_done_title() : m.session_complete_title()}
        </h2>
        <p className="max-w-md text-base/7 text-app-text-muted">
          {isAllDone
            ? m.session_all_done_description()
            : m.session_complete_description({
                count: stats.answered,
                remaining: remainingToLearn,
              })}
        </p>
      </div>

      <dl className="grid w-full max-w-lg grid-cols-3 gap-3">
        <SummaryStat label={m.session_stat_mastered()} value={mastered} tone="success" />
        <SummaryStat
          label={m.session_stat_review()}
          value={stats.stillLearning + stats.incorrect}
          tone="warning"
        />
        <SummaryStat label={m.session_stat_accuracy()} value={accuracy} suffix="%" tone="accent" />
      </dl>

      <div className="flex flex-wrap justify-center gap-3">
        {isAllDone ? null : (
          <Button type="button" size="lg" onClick={onStudyAgain}>
            <RotateCcw />
            {m.session_study_more()}
          </Button>
        )}
        <Link
          to="/books/$bookId"
          params={{ bookId }}
          className={buttonVariants({ size: "lg", variant: isAllDone ? "default" : "outline" })}
        >
          <BookOpen data-icon="inline-start" />
          {m.session_back_to_book()}
        </Link>
      </div>
    </section>
  );
}

function SummaryStat({
  label,
  value,
  suffix = "",
  tone,
}: {
  label: string;
  value: number;
  suffix?: string;
  tone: "success" | "warning" | "accent";
}) {
  return (
    <div
      className={clsx(
        "flex flex-col gap-1 rounded-2xl px-3 py-4",
        tone === "success" && "bg-app-success-soft text-app-success",
        tone === "warning" && "bg-app-warning-soft text-app-warning",
        tone === "accent" && "bg-app-accent-soft text-app-accent-strong",
      )}
    >
      <dd className="font-mono text-3xl font-semibold tabular-nums">
        {value}
        {suffix}
      </dd>
      <dt className="text-xs font-medium uppercase opacity-80">{label}</dt>
    </div>
  );
}
