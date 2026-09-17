import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { clsx } from "clsx";
import { Check, Clapperboard, MoreHorizontal, Pencil, RotateCcw, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { directionFor } from "@/lib/languages";
import { difficultyLabel, phraseTypeLabel, statusLabel } from "@/lib/vocabularyLabels";
import type { ReviewStatus } from "@/lib/vocabularyLabels";
import { m } from "@/paraglide/messages.js";
import type { VocabularyCardRow } from "@/utils/apiTypes";
import { orpc } from "@/utils/orpc";
import { DeleteCardsDialog } from "./DeleteCardsDialog";
import { EditCardDialog } from "./EditCardDialog";
import { WordVideoDialog } from "./WordVideoDialog";

interface Props {
  cards: ReadonlyArray<VocabularyCardRow>;
  bookLanguage: string;
  nativeLanguage: string;
}

function statusBadgeVariant({ status }: { status: ReviewStatus }) {
  switch (status) {
    case "NEW": {
      return "accent" as const;
    }
    case "LEARNING": {
      return "warning" as const;
    }
    case "KNOWN": {
      return "success" as const;
    }
  }
}

function difficultyDots({ difficulty }: { difficulty: number }): number {
  if (difficulty < 0.34) {
    return 1;
  }
  return difficulty < 0.67 ? 2 : 3;
}

function DifficultyDots({ difficulty }: { difficulty: number }) {
  const filled = difficultyDots({ difficulty });
  return (
    <span
      className="inline-flex items-center gap-0.5"
      aria-label={difficultyLabel({ difficulty })}
      title={difficultyLabel({ difficulty })}
    >
      {[1, 2, 3].map((dot) => (
        <span
          key={dot}
          className={clsx(
            "size-1.5 rounded-full",
            dot <= filled ? "bg-app-text" : "bg-app-border-strong",
          )}
        />
      ))}
    </span>
  );
}

export function VocabularyTable({ cards, bookLanguage, nativeLanguage }: Props) {
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(() => new Set());
  const [editing, setEditing] = useState<VocabularyCardRow | null>(null);
  const [deleting, setDeleting] = useState<ReadonlyArray<string>>([]);
  const [videoCard, setVideoCard] = useState<VocabularyCardRow | null>(null);

  const visibleIds = new Set(cards.map((card) => card.id));
  const visibleSelected = [...selectedIds].filter((id) => visibleIds.has(id));
  const allSelected = cards.length > 0 && visibleSelected.length === cards.length;
  const someSelected = visibleSelected.length > 0 && !allSelected;

  const setStatus = useMutation({
    ...orpc.cards.setStatus.mutationOptions(),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: orpc.cards.list.key() });
      const previous = queryClient.getQueriesData<ReadonlyArray<VocabularyCardRow>>({
        queryKey: orpc.cards.list.key(),
      });
      const ids = new Set(variables.cardIds);
      queryClient.setQueriesData<ReadonlyArray<VocabularyCardRow>>(
        { queryKey: orpc.cards.list.key() },
        (current) =>
          current?.map((card) => (ids.has(card.id) ? { ...card, status: variables.status } : card)),
      );
      setSelectedIds(new Set());
      return { previous };
    },
    onError: (error, _variables, context) => {
      for (const [key, data] of context?.previous ?? []) {
        queryClient.setQueryData(key, data);
      }
      toast.error(error instanceof Error ? error.message : m.error_updating_cards());
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: orpc.cards.list.key() }),
        queryClient.invalidateQueries({ queryKey: orpc.books.get.key() }),
        queryClient.invalidateQueries({ queryKey: orpc.books.list.key() }),
        queryClient.invalidateQueries({ queryKey: orpc.study.session.key() }),
      ]);
    },
  });

  function toggle(id: string, checked: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }

  function markSelected(status: ReviewStatus) {
    if (visibleSelected.length > 0) {
      setStatus.mutate({ cardIds: visibleSelected, status });
    }
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-app-border bg-app-surface shadow-(--app-shadow-raised)">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Checkbox
                  aria-label={m.select_all()}
                  checked={allSelected}
                  indeterminate={someSelected}
                  onCheckedChange={(checked) => {
                    setSelectedIds(checked ? new Set(cards.map((card) => card.id)) : new Set());
                  }}
                />
              </TableHead>
              <TableHead>{m.column_word()}</TableHead>
              <TableHead>{m.column_meaning()}</TableHead>
              <TableHead>
                <span className="hidden lg:inline">{m.column_context()}</span>
              </TableHead>
              <TableHead>{m.column_status()}</TableHead>
              <TableHead>
                <span className="sr-only">{m.column_actions()}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cards.map((card) => {
              const isSelected = selectedIds.has(card.id);
              const example = card.examples.at(0);
              return (
                <TableRow key={card.id} data-state={isSelected ? "selected" : undefined}>
                  <TableCell>
                    <Checkbox
                      aria-label={m.select_item({ item: card.displayForm })}
                      checked={isSelected}
                      onCheckedChange={(checked) => {
                        toggle(card.id, checked);
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex min-w-40 flex-col gap-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={clsx(
                            "text-base font-semibold text-app-text",
                            card.status === "KNOWN" && "text-app-text-muted",
                          )}
                          dir={directionFor(bookLanguage)}
                          lang={bookLanguage}
                        >
                          {card.displayForm}
                        </span>
                        <DifficultyDots difficulty={card.difficulty} />
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-app-text-subtle">
                        {card.partOfSpeech == null || card.partOfSpeech.length === 0 ? null : (
                          <span>{card.partOfSpeech}</span>
                        )}
                        {card.isPhrase && card.phraseType != null ? (
                          <Badge variant="highlight">
                            {phraseTypeLabel({ phraseType: card.phraseType })}
                          </Badge>
                        ) : null}
                        <span>{m.frequency_times({ count: card.bookFrequency })}</span>
                        <span>· {m.chapter_short({ chapter: card.firstChapterIndex + 1 })}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div
                      className="flex max-w-md min-w-48 flex-col gap-1"
                      dir={directionFor(nativeLanguage)}
                      lang={nativeLanguage}
                    >
                      <span className="font-medium text-app-text">{card.translation}</span>
                      {card.explanation.length > 0 ? (
                        <span className="line-clamp-2 text-xs/relaxed text-app-text-muted">
                          {card.explanation}
                        </span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    {example == null ? null : (
                      <p
                        className="hidden max-w-xs font-display text-sm/snug text-app-text-muted lg:line-clamp-3"
                        dir={directionFor(bookLanguage)}
                        lang={bookLanguage}
                      >
                        “{example.source}”
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col items-start gap-1">
                      <Badge variant={statusBadgeVariant({ status: card.status })}>
                        {statusLabel({ status: card.status })}
                      </Badge>
                      {card.timesSeen > 0 ? (
                        <span className="text-[0.6875rem] text-app-text-subtle">
                          {m.seen_times({ count: card.timesSeen })}
                        </span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        variant={card.status === "KNOWN" ? "subtle" : "outline"}
                        size="xs"
                        disabled={setStatus.isPending}
                        aria-label={
                          card.status === "KNOWN"
                            ? m.action_mark_learning_item({ item: card.displayForm })
                            : m.action_mark_known_item({ item: card.displayForm })
                        }
                        onClick={() => {
                          setStatus.mutate({
                            cardIds: [card.id],
                            status: card.status === "KNOWN" ? "LEARNING" : "KNOWN",
                          });
                        }}
                      >
                        {card.status === "KNOWN" ? <RotateCcw /> : <Check />}
                        <span className="hidden xl:inline">
                          {card.status === "KNOWN"
                            ? m.action_mark_learning()
                            : m.action_mark_known()}
                        </span>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={m.more_actions_item({ item: card.displayForm })}
                            />
                          }
                        >
                          <MoreHorizontal />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem
                            onClick={() => {
                              setEditing(card);
                            }}
                          >
                            <Pencil />
                            {m.action_edit()}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setVideoCard(card);
                            }}
                          >
                            <Clapperboard />
                            {m.video_watch_scene()}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setStatus.mutate({ cardIds: [card.id], status: "NEW" });
                            }}
                          >
                            <RotateCcw />
                            {m.action_reset_to_new()}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => {
                              setDeleting([card.id]);
                            }}
                          >
                            <Trash2 />
                            {m.delete()}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {visibleSelected.length > 0 ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 flex justify-center px-3">
          <div
            role="toolbar"
            aria-label={m.bulk_actions()}
            className="pointer-events-auto flex w-full max-w-2xl animate-rise flex-wrap items-center justify-between gap-2 rounded-2xl border border-app-border bg-app-ink p-2 text-app-canvas shadow-(--app-shadow-floating)"
          >
            <span className="flex items-center gap-2 px-3 text-sm font-medium">
              <span className="rounded-md bg-app-highlight px-1.5 py-0.5 font-mono text-xs text-app-ink">
                {visibleSelected.length}
              </span>
              {m.bulk_selected()}
            </span>
            <div className="flex flex-wrap items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedIds(new Set());
                }}
              >
                <X />
                {m.clear_selection()}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={setStatus.isPending}
                onClick={() => {
                  markSelected("LEARNING");
                }}
              >
                <RotateCcw />
                {m.action_mark_learning()}
              </Button>
              <Button
                type="button"
                variant="success"
                size="sm"
                disabled={setStatus.isPending}
                onClick={() => {
                  markSelected("KNOWN");
                }}
              >
                <Check />
                {m.action_mark_known()}
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => {
                  setDeleting(visibleSelected);
                }}
              >
                <Trash2 />
                {m.delete()}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <EditCardDialog
        card={editing}
        bookLanguage={bookLanguage}
        nativeLanguage={nativeLanguage}
        onClose={() => {
          setEditing(null);
        }}
      />
      <DeleteCardsDialog
        cardIds={deleting}
        singleLabel={
          deleting.length === 1
            ? (cards.find((card) => card.id === deleting[0])?.displayForm ?? null)
            : null
        }
        onClose={() => {
          setDeleting([]);
        }}
        onDeleted={() => {
          setSelectedIds(new Set());
        }}
      />
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
    </>
  );
}
