import { Brain, FileUp, GraduationCap } from "lucide-react";
import { m } from "@/paraglide/messages.js";

const STEPS = [
  { icon: FileUp, title: m.workflow_upload_title, description: m.workflow_upload_description },
  { icon: Brain, title: m.workflow_prepare_title, description: m.workflow_prepare_description },
  { icon: GraduationCap, title: m.workflow_study_title, description: m.workflow_study_description },
] as const;

export function WorkflowSteps() {
  return (
    <section
      aria-labelledby="workflow-title"
      className="container mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24"
    >
      <div className="flex flex-col gap-3 pb-10">
        <p className="text-sm font-semibold text-app-accent">{m.workflow_kicker()}</p>
        <h2
          id="workflow-title"
          className="max-w-2xl font-display text-4xl/tight tracking-tight text-balance sm:text-5xl/tight"
          dir="auto"
        >
          {m.workflow_title()}
        </h2>
        <p className="max-w-2xl text-base/7 text-app-text-muted" dir="auto">
          {m.workflow_description()}
        </p>
      </div>

      <ol className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          return (
            <li
              key={step.title()}
              className="group relative flex flex-col gap-4 rounded-2xl border border-app-border bg-app-surface p-6 shadow-(--app-shadow-raised) transition-[transform,box-shadow] duration-200 ease-(--ease-app-out) hover:-translate-y-0.5 hover:shadow-(--app-shadow-floating)"
            >
              <div className="flex items-center justify-between">
                <span className="flex size-11 items-center justify-center rounded-xl bg-app-accent-soft text-app-accent">
                  <Icon className="size-5" />
                </span>
                <span className="font-mono text-xs font-semibold text-app-text-subtle">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-lg font-semibold tracking-tight text-app-text" dir="auto">
                  {step.title()}
                </h3>
                <p className="text-sm/6 text-app-text-muted" dir="auto">
                  {step.description()}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
