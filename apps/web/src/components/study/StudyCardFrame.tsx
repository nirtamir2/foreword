import type * as React from "react";
import { Badge } from "@/components/ui/Badge";
import { directionFor } from "@/lib/languages";
import { phraseTypeLabel } from "@/lib/vocabularyLabels";
import type { StudyCard } from "@/utils/apiTypes";

interface Props {
  card: StudyCard;
  bookLanguage: string;
  prompt: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

/** Shared chrome for every study mode: the word up top, the interaction below. */
export function StudyCardFrame({ card, bookLanguage, prompt, children, footer }: Props) {
  return (
    <article className="flex flex-col gap-6 rounded-3xl border border-app-border bg-app-surface p-6 shadow-(--app-shadow-floating) sm:p-8">
      <header className="flex flex-col items-center gap-3 text-center">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {card.phraseType != null && card.phraseType !== "WORD" ? (
            <Badge variant="highlight">{phraseTypeLabel({ phraseType: card.phraseType })}</Badge>
          ) : null}
          {card.partOfSpeech == null || card.partOfSpeech.length === 0 ? null : (
            <Badge variant="outline">{card.partOfSpeech}</Badge>
          )}
        </div>
        <h2
          className="font-display text-4xl/tight tracking-tight text-balance text-app-text sm:text-5xl/tight"
          dir={directionFor(bookLanguage)}
          lang={bookLanguage}
        >
          {card.displayForm}
        </h2>
        <p className="text-sm text-app-text-subtle">{prompt}</p>
      </header>
      <div className="flex flex-col gap-4">{children}</div>
      <footer className="flex flex-col gap-3">{footer}</footer>
    </article>
  );
}
