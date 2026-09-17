import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { directionFor } from "@/lib/languages";
import { m } from "@/paraglide/messages.js";
import type { VocabularyCardRow } from "@/utils/apiTypes";
import { orpc } from "@/utils/orpc";

interface Props {
  card: VocabularyCardRow | null;
  bookLanguage: string;
  nativeLanguage: string;
  onClose: () => void;
}

export function EditCardDialog({ card, bookLanguage, nativeLanguage, onClose }: Props) {
  return (
    <Dialog
      open={card != null}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent size="lg">
        {card == null ? null : (
          <EditCardForm
            key={card.id}
            card={card}
            bookLanguage={bookLanguage}
            nativeLanguage={nativeLanguage}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function EditCardForm({
  card,
  bookLanguage,
  nativeLanguage,
  onClose,
}: {
  card: VocabularyCardRow;
  bookLanguage: string;
  nativeLanguage: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const firstExample = card.examples.at(0);
  const [displayForm, setDisplayForm] = useState(card.displayForm);
  const [translation, setTranslation] = useState(card.translation);
  const [partOfSpeech, setPartOfSpeech] = useState(card.partOfSpeech ?? "");
  const [explanation, setExplanation] = useState(card.explanation);
  const [exampleSource, setExampleSource] = useState(firstExample?.source ?? "");
  const [exampleTranslation, setExampleTranslation] = useState(firstExample?.translation ?? "");

  const updateMutation = useMutation({
    ...orpc.cards.update.mutationOptions(),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: orpc.cards.list.key() }),
        queryClient.invalidateQueries({ queryKey: orpc.study.session.key() }),
      ]);
      toast.success(m.card_saved());
      onClose();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : m.error_saving_card());
    },
  });

  const canSave = displayForm.trim().length > 0 && translation.trim().length > 0;

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSave) {
          return;
        }
        const otherExamples = card.examples.slice(1);
        updateMutation.mutate({
          cardId: card.id,
          displayForm: displayForm.trim(),
          translation: translation.trim(),
          partOfSpeech: partOfSpeech.trim().length > 0 ? partOfSpeech.trim() : null,
          explanation: explanation.trim(),
          examples:
            exampleSource.trim().length > 0
              ? [
                  { source: exampleSource.trim(), translation: exampleTranslation.trim() },
                  ...otherExamples,
                ]
              : otherExamples,
        });
      }}
    >
      <DialogHeader>
        <DialogTitle dir="auto">{m.edit_card_title()}</DialogTitle>
        <DialogDescription>{m.edit_card_description()}</DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={m.field_word()} htmlFor="edit-display-form">
          <Input
            id="edit-display-form"
            dir={directionFor(bookLanguage)}
            lang={bookLanguage}
            value={displayForm}
            required
            onChange={(event) => {
              setDisplayForm(event.target.value);
            }}
          />
        </Field>
        <Field label={m.field_part_of_speech()} htmlFor="edit-part-of-speech">
          <Input
            id="edit-part-of-speech"
            value={partOfSpeech}
            onChange={(event) => {
              setPartOfSpeech(event.target.value);
            }}
          />
        </Field>
      </div>
      <Field label={m.field_translation()} htmlFor="edit-translation">
        <Input
          id="edit-translation"
          dir={directionFor(nativeLanguage)}
          lang={nativeLanguage}
          value={translation}
          required
          onChange={(event) => {
            setTranslation(event.target.value);
          }}
        />
      </Field>
      <Field label={m.field_explanation()} htmlFor="edit-explanation">
        <Textarea
          id="edit-explanation"
          dir={directionFor(nativeLanguage)}
          lang={nativeLanguage}
          rows={3}
          value={explanation}
          onChange={(event) => {
            setExplanation(event.target.value);
          }}
        />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={m.field_example()} htmlFor="edit-example">
          <Textarea
            id="edit-example"
            dir={directionFor(bookLanguage)}
            lang={bookLanguage}
            rows={3}
            value={exampleSource}
            onChange={(event) => {
              setExampleSource(event.target.value);
            }}
          />
        </Field>
        <Field label={m.field_example_translation()} htmlFor="edit-example-translation">
          <Textarea
            id="edit-example-translation"
            dir={directionFor(nativeLanguage)}
            lang={nativeLanguage}
            rows={3}
            value={exampleTranslation}
            onChange={(event) => {
              setExampleTranslation(event.target.value);
            }}
          />
        </Field>
      </div>

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onClose}>
          {m.cancel()}
        </Button>
        <Button type="submit" disabled={!canSave || updateMutation.isPending}>
          {updateMutation.isPending ? m.saving() : m.save_changes()}
        </Button>
      </DialogFooter>
    </form>
  );
}
