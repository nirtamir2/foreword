import { useState } from "react";
import { clsx } from "clsx";
import { Check, Eye, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Kbd } from "@/components/ui/Kbd";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { directionFor } from "@/lib/languages";
import { m } from "@/paraglide/messages.js";
import type { StudyCard } from "@/utils/apiTypes";
import { CardAnswerDetails } from "./CardAnswerDetails";

interface Props {
  card: StudyCard;
  bookLanguage: string;
  nativeLanguage: string;
  onAnswer: (result: "KNOWN" | "STILL_LEARNING") => void;
}

export function Flashcard({ card, bookLanguage, nativeLanguage, onAnswer }: Props) {
  const [isFlipped, setIsFlipped] = useState(false);

  function reveal() {
    setIsFlipped(true);
  }

  function answerStillLearning() {
    if (isFlipped) {
      onAnswer("STILL_LEARNING");
    }
  }

  function answerKnown() {
    if (isFlipped) {
      onAnswer("KNOWN");
    }
  }

  useKeyboardShortcuts({
    isEnabled: true,
    bindings: {
      " ": reveal,
      Enter: reveal,
      "1": answerStillLearning,
      "2": answerKnown,
    },
  });

  return (
    <div className="flex flex-col gap-5">
      <div className="perspective-deep">
        <button
          type="button"
          aria-pressed={isFlipped}
          aria-label={isFlipped ? m.flashcard_showing_answer() : m.flashcard_reveal()}
          onClick={reveal}
          className={clsx(
            "flip-card relative block min-h-88 w-full cursor-pointer rounded-3xl text-start focus-visible:ring-2 focus-visible:ring-app-accent/40 focus-visible:ring-offset-4 focus-visible:ring-offset-app-canvas focus-visible:outline-none",
            isFlipped && "flip-card-flipped",
          )}
        >
          <div className="flip-card-face absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-3xl border border-app-border bg-app-surface p-8 text-center shadow-(--app-shadow-floating)">
            <span className="text-xs font-medium tracking-wide text-app-text-subtle uppercase">
              {m.flashcard_front_label()}
            </span>
            <span
              className="font-display text-5xl/tight tracking-tight text-balance text-app-text sm:text-6xl/tight"
              dir={directionFor(bookLanguage)}
              lang={bookLanguage}
            >
              {card.displayForm}
            </span>
            {card.partOfSpeech == null || card.partOfSpeech.length === 0 ? null : (
              <span className="text-sm text-app-text-muted">{card.partOfSpeech}</span>
            )}
            <span className="flex items-center gap-2 pt-4 text-sm text-app-text-subtle">
              <Eye className="size-4" />
              {m.flashcard_tap_to_flip()}
              <Kbd>␣</Kbd>
            </span>
          </div>
          <div className="flip-card-face flip-card-back absolute inset-0 flex flex-col justify-center gap-4 rounded-3xl border border-app-accent/20 bg-app-surface p-6 shadow-(--app-shadow-floating) sm:p-8">
            <span className="text-center text-xs font-medium tracking-wide text-app-text-subtle uppercase">
              {card.displayForm}
            </span>
            <CardAnswerDetails
              card={card}
              bookLanguage={bookLanguage}
              nativeLanguage={nativeLanguage}
            />
          </div>
        </button>
      </div>

      <div
        className={clsx(
          "grid gap-3 transition-opacity sm:grid-cols-2",
          !isFlipped && "pointer-events-none opacity-40",
        )}
      >
        <Button
          type="button"
          variant="outline"
          size="lg"
          disabled={!isFlipped}
          onClick={() => {
            onAnswer("STILL_LEARNING");
          }}
        >
          <RotateCcw />
          {m.flashcard_still_learning()}
          <Kbd>1</Kbd>
        </Button>
        <Button
          type="button"
          variant="success"
          size="lg"
          disabled={!isFlipped}
          onClick={() => {
            onAnswer("KNOWN");
          }}
        >
          <Check />
          {m.flashcard_i_know_this()}
          <Kbd>2</Kbd>
        </Button>
      </div>
    </div>
  );
}
