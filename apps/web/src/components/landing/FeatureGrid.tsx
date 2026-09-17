import { Clapperboard, Download, Languages, ListOrdered, Lock, Repeat } from "lucide-react";
import { m } from "@/paraglide/messages.js";

const FEATURES = [
  { icon: Lock, title: m.feature_private_title, description: m.feature_private_description },
  { icon: ListOrdered, title: m.feature_ranking_title, description: m.feature_ranking_description },
  { icon: Repeat, title: m.feature_modes_title, description: m.feature_modes_description },
  { icon: Clapperboard, title: m.feature_video_title, description: m.feature_video_description },
  { icon: Languages, title: m.feature_rtl_title, description: m.feature_rtl_description },
  { icon: Download, title: m.feature_export_title, description: m.feature_export_description },
] as const;

export function FeatureGrid() {
  return (
    <section
      aria-labelledby="features-title"
      className="border-y border-app-border bg-app-surface-soft/60"
    >
      <div className="container mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <div className="flex flex-col gap-4">
            <p className="text-sm font-semibold text-app-accent">{m.features_kicker()}</p>
            <h2
              id="features-title"
              className="font-display text-4xl/tight tracking-tight text-balance sm:text-5xl/tight"
              dir="auto"
            >
              {m.features_title()}
            </h2>
            <p className="max-w-md text-base/7 text-app-text-muted" dir="auto">
              {m.features_description()}
            </p>
          </div>
          <ul className="grid gap-px overflow-hidden rounded-2xl border border-app-border bg-app-border sm:grid-cols-2">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <li key={feature.title()} className="flex flex-col gap-3 bg-app-surface p-5">
                  <Icon className="size-5 text-app-accent" />
                  <div className="flex flex-col gap-1">
                    <h3 className="font-semibold text-app-text" dir="auto">
                      {feature.title()}
                    </h3>
                    <p className="text-sm/6 text-app-text-muted" dir="auto">
                      {feature.description()}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
