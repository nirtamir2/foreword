import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/Button";
import { m } from "@/paraglide/messages.js";
import { getTextDirection } from "@/paraglide/runtime.js";

interface Props {
  isSignedIn: boolean;
}

export function ClosingCallToAction({ isSignedIn }: Props) {
  const isRtl = getTextDirection() === "rtl";
  return (
    <section className="container mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
      <div className="relative overflow-hidden rounded-3xl bg-app-ink px-6 py-14 text-center text-app-canvas sm:px-12">
        <div className="absolute -inset-e-24 -top-24 size-72 rounded-full bg-app-accent/40 blur-3xl" />
        <div className="absolute -inset-s-24 -bottom-24 size-72 rounded-full bg-app-highlight/30 blur-3xl" />
        <div className="relative flex flex-col items-center gap-6">
          <h2
            className="max-w-2xl font-display text-4xl/tight tracking-tight text-balance sm:text-5xl/tight"
            dir="auto"
          >
            {m.cta_title()}
          </h2>
          <p className="max-w-xl text-base/7 text-app-canvas/75" dir="auto">
            {m.cta_description()}
          </p>
          <Link
            to={isSignedIn ? "/books/new" : "/auth/sign-up"}
            className={buttonVariants({ size: "lg", variant: "outline" })}
          >
            {isSignedIn ? m.hero_add_book() : m.hero_get_started()}
            <ArrowRight data-icon="inline-end" className={isRtl ? "rotate-180" : ""} />
          </Link>
        </div>
      </div>
    </section>
  );
}
