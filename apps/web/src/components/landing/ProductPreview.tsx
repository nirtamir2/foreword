import { clsx } from "clsx";
import { BookOpen, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { m } from "@/paraglide/messages.js";

const PREVIEW_WORDS = [
  { word: "reluctant", meaning: m.preview_word_1_meaning, chapter: 1, score: 96 },
  { word: "brittle", meaning: m.preview_word_2_meaning, chapter: 1, score: 91 },
  { word: "to come to terms", meaning: m.preview_word_3_meaning, chapter: 2, score: 88 },
  { word: "ember", meaning: m.preview_word_4_meaning, chapter: 3, score: 82 },
] as const;

/** A static, illustrative mock of the book page. No live data: it is a marketing preview. */
export function ProductPreview() {
  return (
    <aside
      aria-label={m.preview_label()}
      className="relative min-w-0 animate-rise [animation-delay:150ms] lg:justify-self-end"
    >
      <div className="absolute -inset-x-6 top-10 -bottom-10 -z-10 rounded-[2.5rem] bg-app-highlight-soft blur-2xl" />
      <div className="relative w-full max-w-lg min-w-0 overflow-hidden rounded-3xl border border-app-border bg-app-surface shadow-(--app-shadow-floating)">
        <div className="flex items-center justify-between gap-3 border-b border-app-border bg-app-surface-soft/70 px-5 py-3.5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-app-ink text-app-canvas">
              <BookOpen className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-display text-lg text-app-text">
                {m.preview_book_title()}
              </p>
              <p className="truncate text-xs text-app-text-subtle">{m.preview_book_meta()}</p>
            </div>
          </div>
          <Badge variant="success">{m.preview_ready()}</Badge>
        </div>

        <div className="flex flex-col gap-5 p-5">
          <div className="grid grid-cols-3 gap-3">
            <PreviewStat label={m.preview_stat_to_learn()} value="37" tone="accent" />
            <PreviewStat label={m.preview_stat_learning()} value="12" tone="warning" />
            <PreviewStat label={m.preview_stat_known()} value="41" tone="success" />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-app-text-muted">
              <span>{m.preview_progress_label()}</span>
              <span className="font-mono font-semibold text-app-text">46%</span>
            </div>
            <Progress
              value={41}
              secondaryValue={12}
              max={90}
              tone="success"
              label={m.preview_progress_label()}
            />
          </div>

          <ul className="flex flex-col divide-y divide-app-border rounded-xl border border-app-border">
            {PREVIEW_WORDS.map((item) => (
              <li key={item.word} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate font-semibold text-app-text" dir="ltr">
                    {item.word}
                  </span>
                  <span className="truncate text-xs text-app-text-muted" dir="auto">
                    {item.meaning()}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="hidden text-[0.6875rem] text-app-text-subtle sm:inline">
                    {m.preview_chapter({ chapter: item.chapter })}
                  </span>
                  <span className="rounded-md bg-app-accent-soft px-1.5 py-0.5 font-mono text-[0.6875rem] font-semibold text-app-accent-strong">
                    {item.score}
                  </span>
                </div>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-3 rounded-xl bg-app-ink px-4 py-3 text-app-canvas">
            <Sparkles className="size-4 shrink-0 text-app-highlight" />
            <p className="text-sm">{m.preview_footer()}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function PreviewStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "accent" | "warning" | "success";
}) {
  return (
    <div
      className={clsx(
        "flex flex-col gap-1 rounded-xl px-3 py-2.5",
        tone === "accent" && "bg-app-accent-soft text-app-accent-strong",
        tone === "warning" && "bg-app-warning-soft text-app-warning",
        tone === "success" && "bg-app-success-soft text-app-success",
      )}
    >
      <span className="text-[0.6875rem] font-medium uppercase opacity-80">{label}</span>
      <span className="font-mono text-2xl font-semibold tabular-nums">{value}</span>
    </div>
  );
}
