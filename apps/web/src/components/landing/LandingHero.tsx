import { Link } from "@tanstack/react-router";
import { ArrowRight, Library, LogIn, Plus, ShieldCheck } from "lucide-react";
import { ProductPreview } from "@/components/landing/ProductPreview";
import { Badge } from "@/components/ui/Badge";
import { buttonVariants } from "@/components/ui/Button";
import { m } from "@/paraglide/messages.js";
import { getTextDirection } from "@/paraglide/runtime.js";

interface Props {
  isSignedIn: boolean;
}

export function LandingHero({ isSignedIn }: Props) {
  const isRtl = getTextDirection() === "rtl";

  return (
    <section className="relative overflow-hidden border-b border-app-border">
      <div className="paper-grid absolute inset-0 -z-10 mask-[radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
      <div className="absolute inset-s-1/2 -top-40 -z-10 size-168 -translate-x-1/2 rounded-full bg-app-accent-soft blur-3xl rtl:translate-x-1/2" />
      <div className="container mx-auto grid max-w-6xl grid-cols-1 gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(24rem,0.9fr)] lg:items-center lg:py-24">
        <div className="flex min-w-0 animate-rise flex-col gap-7">
          <Badge variant="accent">
            <ShieldCheck />
            {m.hero_badge()}
          </Badge>
          <div className="flex flex-col gap-5">
            <h1
              className="max-w-3xl font-display text-5xl/[1.02] tracking-tight text-balance text-app-text sm:text-6xl/[1.02] lg:text-7xl/[1]"
              dir="auto"
            >
              {m.hero_title_start()}{" "}
              <span className="marker marker-animated">{m.hero_title_highlight()}</span>{" "}
              {m.hero_title_end()}
            </h1>
            <p className="max-w-xl text-lg/8 text-pretty text-app-text-muted" dir="auto">
              {m.hero_subtitle()}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isSignedIn ? (
              <>
                <Link to="/books/new" className={buttonVariants({ size: "lg" })}>
                  <Plus data-icon="inline-start" />
                  {m.hero_add_book()}
                </Link>
                <Link to="/library" className={buttonVariants({ size: "lg", variant: "outline" })}>
                  <Library data-icon="inline-start" />
                  {m.hero_open_library()}
                </Link>
              </>
            ) : (
              <>
                <Link to="/auth/sign-up" className={buttonVariants({ size: "lg" })}>
                  {m.hero_get_started()}
                  <ArrowRight data-icon="inline-end" className={isRtl ? "rotate-180" : ""} />
                </Link>
                <Link
                  to="/auth/login"
                  className={buttonVariants({ size: "lg", variant: "outline" })}
                >
                  <LogIn data-icon="inline-start" />
                  {m.sign_in()}
                </Link>
              </>
            )}
          </div>

          <dl className="grid grid-cols-3 gap-4 border-t border-app-border pt-6 text-sm">
            <div className="flex flex-col gap-1">
              <dt className="text-xs font-medium text-app-text-subtle uppercase">
                {m.hero_stat_formats_label()}
              </dt>
              <dd className="font-semibold text-app-text">{m.hero_stat_formats_value()}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-xs font-medium text-app-text-subtle uppercase">
                {m.hero_stat_privacy_label()}
              </dt>
              <dd className="font-semibold text-app-text">{m.hero_stat_privacy_value()}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-xs font-medium text-app-text-subtle uppercase">
                {m.hero_stat_modes_label()}
              </dt>
              <dd className="font-semibold text-app-text">{m.hero_stat_modes_value()}</dd>
            </div>
          </dl>
        </div>

        <ProductPreview />
      </div>
    </section>
  );
}
