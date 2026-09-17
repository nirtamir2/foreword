import { Quote } from "lucide-react";
import { directionFor } from "@/lib/languages";
import type { StudyCard } from "@/utils/apiTypes";

interface Props {
  card: StudyCard;
  bookLanguage: string;
  nativeLanguage: string;
}

/** Translation, explanation and the book example: the "back" of a card. */
export function CardAnswerDetails({ card, bookLanguage, nativeLanguage }: Props) {
  const example = card.examples.at(0);
  return (
    <div className="flex animate-pop flex-col gap-4">
      <div className="flex flex-col items-center gap-1 text-center">
        <p
          className="text-2xl font-semibold text-app-accent-strong"
          dir={directionFor(nativeLanguage)}
          lang={nativeLanguage}
        >
          {card.translation}
        </p>
        {card.explanation.length > 0 ? (
          <p
            className="max-w-md text-sm/relaxed text-app-text-muted"
            dir={directionFor(nativeLanguage)}
            lang={nativeLanguage}
          >
            {card.explanation}
          </p>
        ) : null}
      </div>
      {example == null ? null : (
        <blockquote className="flex flex-col gap-2 rounded-2xl bg-app-paper px-4 py-3 text-start">
          <div className="flex items-start gap-2">
            <Quote className="mt-1 size-3.5 shrink-0 text-app-text-subtle" />
            <p
              className="font-display text-lg/snug text-app-ink"
              dir={directionFor(bookLanguage)}
              lang={bookLanguage}
            >
              {example.source}
            </p>
          </div>
          {example.translation.length > 0 ? (
            <p
              className="ps-6 text-sm text-app-text-muted"
              dir={directionFor(nativeLanguage)}
              lang={nativeLanguage}
            >
              {example.translation}
            </p>
          ) : null}
        </blockquote>
      )}
    </div>
  );
}
