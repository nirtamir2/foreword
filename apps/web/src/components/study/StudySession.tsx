import type { ReactNode } from "react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { BookOpen, Clapperboard, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { WordVideoDialog } from "@/components/books/WordVideoDialog";
import { Button, buttonVariants } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Progress } from "@/components/ui/Progress";
import { Skeleton } from "@/components/ui/Skeleton";
import { m } from "@/paraglide/messages.js";
import type { StudyCard, StudySessionData } from "@/utils/apiTypes";
import { orpc } from "@/utils/orpc";
import { Flashcard } from "./Flashcard";
import { MultipleChoiceQuestion } from "./MultipleChoiceQuestion";
import { RecallQuestion } from "./RecallQuestion";
import { SessionSummary } from "./SessionSummary";
import type { SessionStats } from "./SessionSummary";
import { StudyModeTabs } from "./StudyModeTabs";
import type { StudyMode } from "./StudyModeTabs";

type AnswerResult = "KNOWN" | "STILL_LEARNING" | "CORRECT" | "INCORRECT";
type Scope = "TO_LEARN" | "KNOWN";

export const STUDY_SESSION_SIZE = 15;
const EMPTY_STATS: SessionStats = {
  answered: 0,
  known: 0,
  correct: 0,
  incorrect: 0,
  stillLearning: 0,
};

function shuffle<T>(items: ReadonlyArray<T>): Array<T> {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    // eslint-disable-next-line sonarjs/pseudo-random -- quiz option order only
    const swap = Math.floor(Math.random() * (index + 1));
    const a = copy[index];
    const b = copy[swap];
    if (a === undefined || b === undefined) {
      continue;
    }

    copy[index] = b;
    copy[swap] = a;
  }
  return copy;
}

/** Four answer options: the right one plus three distinct distractors from the same book. */
function buildOptions({
  card,
  session,
}: {
  card: StudyCard;
  session: StudySessionData;
}): Array<string> {
  const pool = new Set<string>();
  for (const other of session.cards) {
    if (other.id !== card.id && other.translation !== card.translation) {
      pool.add(other.translation);
    }
  }
  for (const translation of session.distractors) {
    if (translation !== card.translation) {
      pool.add(translation);
    }
  }
  const distractors = shuffle([...pool]).slice(0, 3);
  return shuffle([card.translation, ...distractors]);
}

function applyResult(stats: SessionStats, result: AnswerResult): SessionStats {
  return {
    answered: stats.answered + 1,
    known: stats.known + (result === "KNOWN" ? 1 : 0),
    correct: stats.correct + (result === "CORRECT" ? 1 : 0),
    incorrect: stats.incorrect + (result === "INCORRECT" ? 1 : 0),
    stillLearning: stats.stillLearning + (result === "STILL_LEARNING" ? 1 : 0),
  };
}

interface Props {
  bookId: string;
  scope: Scope;
}

export function StudySession({ bookId, scope }: Props) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<StudyMode>("FLASHCARD");
  const [index, setIndex] = useState(0);
  const [stats, setStats] = useState<SessionStats>(EMPTY_STATS);
  const [videoCard, setVideoCard] = useState<StudyCard | null>(null);
  const [round, setRound] = useState(0);

  const sessionQuery = useQuery({
    ...orpc.study.session.queryOptions({ input: { bookId, limit: STUDY_SESSION_SIZE, scope } }),
    // Every round must be a fresh snapshot; a cached deck would repeat cards just learned.
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
  const bookQuery = useQuery(orpc.books.get.queryOptions({ input: { bookId } }));

  const recordAnswer = useMutation({
    ...orpc.study.recordAnswer.mutationOptions(),
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : m.error_saving_answer());
    },
  });

  const session = sessionQuery.data;
  const deck = session?.cards ?? [];
  const current = deck.at(index);
  const isComplete = session != null && deck.length > 0 && current == null;

  function answer(result: AnswerResult) {
    if (current == null) {
      return;
    }
    const isLastCard = index + 1 >= deck.length;
    recordAnswer.mutate(
      { cardId: current.id, mode, result },
      {
        onSettled: () => {
          if (isLastCard) {
            void invalidateBookData();
          }
        },
      },
    );
    setStats((previous) => applyResult(previous, result));
    setIndex((previous) => previous + 1);
  }

  async function invalidateBookData() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: orpc.cards.list.key() }),
      queryClient.invalidateQueries({ queryKey: orpc.books.get.key() }),
      queryClient.invalidateQueries({ queryKey: orpc.books.list.key() }),
      queryClient.invalidateQueries({ queryKey: orpc.study.summary.key() }),
    ]);
  }

  async function startNextRound() {
    setIndex(0);
    setStats(EMPTY_STATS);
    setRound((previous) => previous + 1);
    await invalidateBookData();
    await queryClient.invalidateQueries({ queryKey: orpc.study.session.key() });
  }

  function renderQuestion(): ReactNode {
    if (current == null || session == null) {
      return null;
    }
    const languages = {
      bookLanguage: session.book.bookLanguage,
      nativeLanguage: session.book.nativeLanguage,
    };
    switch (mode) {
      case "FLASHCARD": {
        return (
          <Flashcard
            key={`${current.id}-${mode}`}
            card={current}
            onAnswer={answer}
            {...languages}
          />
        );
      }
      case "MCQ": {
        return (
          <MultipleChoiceQuestion
            key={`${current.id}-${mode}`}
            card={current}
            options={buildOptions({ card: current, session })}
            onAnswer={answer}
            {...languages}
          />
        );
      }
      case "RECALL": {
        return (
          <RecallQuestion
            key={`${current.id}-${mode}`}
            card={current}
            onAnswer={answer}
            {...languages}
          />
        );
      }
    }
  }

  if (sessionQuery.isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
        <Skeleton style={{ height: "2.5rem", width: "20rem" }} />
        <Skeleton style={{ height: "24rem" }} />
      </div>
    );
  }

  if (session != null && deck.length === 0) {
    return (
      <div className="mx-auto w-full max-w-2xl">
        <EmptyState
          tone="accent"
          icon={<GraduationCap />}
          title={scope === "KNOWN" ? m.study_empty_known_title() : m.study_empty_title()}
          description={
            scope === "KNOWN" ? m.study_empty_known_description() : m.study_empty_description()
          }
          action={
            <Link to="/books/$bookId" params={{ bookId }} className={buttonVariants()}>
              <BookOpen data-icon="inline-start" />
              {m.session_back_to_book()}
            </Link>
          }
        />
      </div>
    );
  }

  const answered = Math.min(index, deck.length);
  const remainingToLearn = Math.max(
    0,
    (bookQuery.data?.cardCount ?? 0) - (bookQuery.data?.knownCount ?? 0),
  );

  return (
    <div key={round} className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <StudyModeTabs mode={mode} onModeChange={setMode} />
        <div className="flex items-center gap-3">
          {current == null ? null : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setVideoCard(current);
              }}
            >
              <Clapperboard />
              {m.video_watch_scene()}
            </Button>
          )}
          <span className="font-mono text-sm text-app-text-muted tabular-nums" aria-live="polite">
            {answered}/{deck.length}
          </span>
        </div>
      </div>

      <Progress value={answered} max={deck.length} label={m.study_progress_label()} size="sm" />

      {isComplete ? (
        <SessionSummary
          bookId={bookId}
          stats={stats}
          remainingToLearn={remainingToLearn}
          onStudyAgain={() => {
            void startNextRound();
          }}
        />
      ) : (
        renderQuestion()
      )}

      <WordVideoDialog
        card={
          videoCard == null
            ? null
            : {
                id: videoCard.id,
                displayForm: videoCard.displayForm,
                translation: videoCard.translation,
              }
        }
        onClose={() => {
          setVideoCard(null);
        }}
      />
    </div>
  );
}
