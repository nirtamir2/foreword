import { useState } from "react";
import { clsx } from "clsx";
import { Check, Eye, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Kbd } from "@/components/ui/Kbd";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { directionFor } from "@/lib/languages";
import { m } from "@/paraglide/messages.js";
import type { StudyCard } from "@/utils/apiTypes";
import { CardAnswerDetails } from "./CardAnswerDetails";
import { StudyCardFrame } from "./StudyCardFrame";

interface Props {
  card: StudyCard;
  bookLanguage: string;
  nativeLanguage: string;
  onAnswer: (result: "CORRECT" | "INCORRECT") => void;
}

const SENSE_SEPARATOR = /[,;/]/;

function normalizeGuess(value: string): string {
  return value
    .toLocaleLowerCase()
    .normalize("NFKD")
    .replaceAll(/\p{M}/gu, "")
    .replaceAll(/[^\p{L}\p{N}\s]/gu, "")
    .replaceAll(/\s+/g, " ")
    .trim();
}

/** A guess counts as a match if it equals the translation or a comma/slash separated sense of it. */
function isGuessMatch({ guess, translation }: { guess: string; translation: string }): boolean {
  const normalizedGuess = normalizeGuess(guess);
  if (normalizedGuess.length === 0) {
    return false;
  }
  const senses = translation.split(SENSE_SEPARATOR).map((sense) => normalizeGuess(sense));
  return senses.some(
    (sense) =>
      sense.length > 0 &&
      (sense === normalizedGuess ||
        (sense.includes(normalizedGuess) && normalizedGuess.length >= 4)),
  );
}

export function RecallQuestion({ card, bookLanguage, nativeLanguage, onAnswer }: Props) {
  const [guess, setGuess] = useState("");
  const [isRevealed, setIsRevealed] = useState(false);
  const autoMatched = isRevealed && isGuessMatch({ guess, translation: card.translation });

  useKeyboardShortcuts({
    isEnabled: isRevealed,
    bindings: {
      "1": () => {
        onAnswer("INCORRECT");
      },
      "2": () => {
        onAnswer("CORRECT");
      },
    },
  });

  return (
    <StudyCardFrame
      card={card}
      bookLanguage={bookLanguage}
      prompt={m.recall_prompt()}
      footer={
        isRevealed ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => {
                onAnswer("INCORRECT");
              }}
            >
              <X />
              {m.recall_missed()}
              <Kbd>1</Kbd>
            </Button>
            <Button
              type="button"
              variant="success"
              size="lg"
              onClick={() => {
                onAnswer("CORRECT");
              }}
            >
              <Check />
              {m.recall_got_it()}
              <Kbd>2</Kbd>
            </Button>
          </div>
        ) : (
          <Button type="submit" form="recall-form" size="lg" fullWidth>
            <Eye />
            {m.recall_reveal()}
            <Kbd>↵</Kbd>
          </Button>
        )
      }
    >
      <form
        id="recall-form"
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          setIsRevealed(true);
        }}
      >
        <label htmlFor="recall-guess" className="sr-only">
          {m.recall_placeholder()}
        </label>
        <Input
          id="recall-guess"
          autoComplete="off"
          dir={directionFor(nativeLanguage)}
          lang={nativeLanguage}
          placeholder={m.recall_placeholder()}
          value={guess}
          disabled={isRevealed}
          onChange={(event) => {
            setGuess(event.target.value);
          }}
        />
      </form>
      {isRevealed ? (
        <div className="flex flex-col gap-3 border-t border-app-border pt-4">
          {guess.trim().length > 0 ? (
            <p
              className={clsx(
                "text-center text-sm font-semibold",
                autoMatched ? "text-app-success" : "text-app-text-muted",
              )}
            >
              {autoMatched ? m.recall_looks_right() : m.recall_compare({ guess: guess.trim() })}
            </p>
          ) : null}
          <CardAnswerDetails
            card={card}
            bookLanguage={bookLanguage}
            nativeLanguage={nativeLanguage}
          />
        </div>
      ) : null}
    </StudyCardFrame>
  );
}
