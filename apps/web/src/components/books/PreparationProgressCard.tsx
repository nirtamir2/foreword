import { clsx } from "clsx";
import { Check, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/Progress";
import { PREPARATION_STAGES } from "@/lib/analysis/preparationProgress";
import type { PreparationProgress, PreparationStage } from "@/lib/analysis/preparationProgress";
import { m } from "@/paraglide/messages.js";

interface Props {
  progress: PreparationProgress;
  title: string;
}

function stageLabel({ stage }: { stage: PreparationStage }): string {
  switch (stage) {
    case "reading": {
      return m.stage_reading();
    }
    case "detecting": {
      return m.stage_detecting();
    }
    case "ranking": {
      return m.stage_ranking();
    }
    case "saving": {
      return m.stage_saving();
    }
    case "writing": {
      return m.stage_writing();
    }
    case "done": {
      return m.stage_done();
    }
  }
}

function stageDetail({ progress }: { progress: PreparationProgress }): string | null {
  if (progress.stage === "writing" && progress.detail != null) {
    return m.stage_writing_detail({
      current: progress.detail.current,
      total: progress.detail.total,
      cards: progress.cardsCreated,
    });
  }
  if (progress.stage === "saving" && progress.detail != null) {
    return m.stage_saving_detail({
      current: progress.detail.current,
      total: progress.detail.total,
    });
  }
  if (progress.stage === "done") {
    return m.stage_done_detail({ cards: progress.cardsCreated });
  }
  return null;
}

export function PreparationProgressCard({ progress, title }: Props) {
  const currentIndex = PREPARATION_STAGES.indexOf(progress.stage);
  const detail = stageDetail({ progress });

  return (
    <section
      aria-live="polite"
      aria-busy={progress.stage !== "done"}
      className="flex flex-col gap-6 rounded-2xl border border-app-border bg-app-surface p-5 shadow-(--app-shadow-raised) sm:p-6"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-app-accent-soft text-app-accent">
              {progress.stage === "done" ? (
                <Check className="size-5" />
              ) : (
                <Loader2 className="size-5 animate-spin" />
              )}
            </span>
            <div className="flex flex-col">
              <h2 className="text-base font-semibold text-app-text">{title}</h2>
              <p className="text-sm text-app-text-muted">{stageLabel({ stage: progress.stage })}</p>
            </div>
          </div>
          <span className="font-mono text-2xl font-semibold text-app-text tabular-nums">
            {progress.percent}%
          </span>
        </div>
        <Progress value={progress.percent} label={title} />
        {detail == null ? null : <p className="text-sm text-app-text-muted">{detail}</p>}
      </div>

      <ol className="grid grid-cols-1 gap-2 sm:grid-cols-6">
        {PREPARATION_STAGES.map((stage, index) => {
          const isDone = index < currentIndex || progress.stage === "done";
          const isCurrent = index === currentIndex && progress.stage !== "done";
          return (
            <li
              key={stage}
              aria-current={isCurrent ? "step" : undefined}
              className={clsx(
                "flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs font-medium transition-colors sm:flex-col sm:items-start sm:gap-1.5",
                isDone && "border-app-success/20 bg-app-success-soft text-app-success",
                isCurrent && "border-app-accent/30 bg-app-accent-soft text-app-accent-strong",
                !isDone &&
                  !isCurrent &&
                  "border-app-border bg-app-surface-soft text-app-text-subtle",
              )}
            >
              <span
                className={clsx(
                  "flex size-4 shrink-0 items-center justify-center rounded-full text-[0.6rem] font-bold",
                  isDone && "bg-app-success text-white",
                  isCurrent && "bg-app-accent text-app-on-accent",
                  !isDone && !isCurrent && "bg-app-border text-app-text-subtle",
                )}
              >
                {isDone ? <Check className="size-2.5" strokeWidth={3} /> : index + 1}
              </span>
              <span className="truncate">{stageLabel({ stage })}</span>
            </li>
          );
        })}
      </ol>

      {progress.stage === "done" ? null : (
        <p className="rounded-xl bg-app-warning-soft px-3 py-2 text-xs text-app-warning">
          {m.stage_keep_tab_open()}
        </p>
      )}
    </section>
  );
}
