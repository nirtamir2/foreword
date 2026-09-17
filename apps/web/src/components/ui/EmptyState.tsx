import type * as React from "react";
import { clsx } from "clsx";

type EmptyStateTone = "neutral" | "accent" | "warning";

interface Props {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  tone?: EmptyStateTone;
}

export function EmptyState({ icon, title, description, action, tone = "neutral" }: Props) {
  return (
    <section className="flex flex-col items-center gap-5 rounded-2xl border border-dashed border-app-border-strong bg-app-surface px-6 py-12 text-center">
      <span
        className={clsx(
          "flex size-14 items-center justify-center rounded-2xl [&_svg]:size-6",
          tone === "neutral" && "bg-app-surface-muted text-app-text-muted",
          tone === "accent" && "bg-app-accent-soft text-app-accent",
          tone === "warning" && "bg-app-warning-soft text-app-warning",
        )}
      >
        {icon}
      </span>
      <div className="flex max-w-md flex-col gap-1.5">
        <h3 className="text-lg font-semibold tracking-tight text-app-text" dir="auto">
          {title}
        </h3>
        <p className="text-sm/relaxed text-app-text-muted" dir="auto">
          {description}
        </p>
      </div>
      {action == null ? null : <div className="flex flex-wrap justify-center gap-2">{action}</div>}
    </section>
  );
}
