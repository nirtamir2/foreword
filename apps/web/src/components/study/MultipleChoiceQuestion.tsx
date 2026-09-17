import { useState } from "react";
import { clsx } from "clsx";
import { ArrowRight, Check, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Kbd } from "@/components/ui/Kbd";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { directionFor } from "@/lib/languages";
import { m } from "@/paraglide/messages.js";
import { getTextDirection } from "@/paraglide/runtime.js";
import type { StudyCard } from "@/utils/apiTypes";
import { CardAnswerDetails } from "./CardAnswerDetails";
import { StudyCardFrame } from "./StudyCardFrame";

interface Props {
  card: StudyCard;
  options: ReadonlyArray<string>;
  bookLanguage: string;
  nativeLanguage: string;
  onAnswer: (result: "CORRECT" | "INCORRECT") => void;
}

export function MultipleChoiceQuestion({
  card,
  options,
  bookLanguage,
  nativeLanguage,
  onAnswer,
}: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const isAnswered = selected != null;
  const isCorrect = selected === card.translation;
  const isRtl = getTextDirection() === "rtl";

  function choose(option: string) {
    if (!isAnswered) {
      setSelected(option);
    }
  }

  function chooseAt(position: number) {
    const option = options.at(position);
    if (option != null) {
      choose(option);
    }
  }

  useKeyboardShortcuts({
    isEnabled: true,
    bindings: {
      "1": () => {
        chooseAt(0);
      },
      "2": () => {
        chooseAt(1);
      },
      "3": () => {
        chooseAt(2);
      },
      "4": () => {
        chooseAt(3);
      },
      Enter: () => {
        if (isAnswered) {
          onAnswer(isCorrect ? "CORRECT" : "INCORRECT");
        }
      },
    },
  });

  return (
    <StudyCardFrame
      card={card}
      bookLanguage={bookLanguage}
      prompt={m.mcq_prompt()}
      footer={
        isAnswered ? (
          <Button
            type="button"
            size="lg"
            fullWidth
            onClick={() => {
              onAnswer(isCorrect ? "CORRECT" : "INCORRECT");
            }}
          >
            {m.continue_label()}
            <ArrowRight className={clsx(isRtl && "rotate-180")} />
            <Kbd>↵</Kbd>
          </Button>
        ) : (
          <p className="text-center text-xs text-app-text-subtle">{m.mcq_keyboard_hint()}</p>
        )
      }
    >
      <div role="radiogroup" aria-label={m.mcq_prompt()} className="grid gap-2.5">
        {options.map((option, index) => {
          const isThisCorrect = option === card.translation;
          const isChosen = option === selected;
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={isChosen}
              disabled={isAnswered}
              dir={directionFor(nativeLanguage)}
              lang={nativeLanguage}
              onClick={() => {
                choose(option);
              }}
              className={clsx(
                "flex items-center gap-3 rounded-xl border px-4 py-3.5 text-start text-base transition-[border-color,background-color,transform] duration-150 ease-(--ease-app-out) focus-visible:ring-2 focus-visible:ring-app-accent/40 focus-visible:outline-none",
                !isAnswered &&
                  "border-app-border bg-app-surface hover:border-app-accent/60 hover:bg-app-accent-soft/40 active:scale-[0.99]",
                isAnswered &&
                  isThisCorrect &&
                  "border-app-success bg-app-success-soft text-app-text",
                isAnswered &&
                  isChosen &&
                  !isThisCorrect &&
                  "border-app-red bg-app-red-soft text-app-text",
                isAnswered && !isChosen && !isThisCorrect && "border-app-border opacity-50",
              )}
            >
              <span
                className={clsx(
                  "flex size-7 shrink-0 items-center justify-center rounded-md border text-xs font-semibold",
                  isAnswered && isThisCorrect && "border-app-success bg-app-success text-white",
                  isAnswered &&
                    isChosen &&
                    !isThisCorrect &&
                    "border-app-red bg-app-red text-white",
                  (!isAnswered || (!isChosen && !isThisCorrect)) &&
                    "border-app-border bg-app-surface-soft text-app-text-muted",
                )}
              >
                {isAnswered && isThisCorrect ? (
                  <Check className="size-3.5" strokeWidth={3} />
                ) : null}
                {isAnswered && isChosen && !isThisCorrect ? (
                  <X className="size-3.5" strokeWidth={3} />
                ) : null}
                {!isAnswered || (!isChosen && !isThisCorrect) ? index + 1 : null}
              </span>
              <span className="flex-1">{option}</span>
            </button>
          );
        })}
      </div>
      {isAnswered ? (
        <div className="flex flex-col gap-3 border-t border-app-border pt-4">
          <p
            className={clsx(
              "text-center text-sm font-semibold",
              isCorrect ? "text-app-success" : "text-app-red",
            )}
          >
            {isCorrect ? m.answer_correct() : m.answer_incorrect()}
          </p>
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
