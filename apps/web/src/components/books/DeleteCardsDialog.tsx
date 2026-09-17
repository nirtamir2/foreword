import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogPopup,
  AlertDialogTitle,
} from "@/components/ui/AlertDialog";
import { Button } from "@/components/ui/Button";
import { m } from "@/paraglide/messages.js";
import { orpc } from "@/utils/orpc";

interface Props {
  cardIds: ReadonlyArray<string>;
  /** Display form of the single card when exactly one is being deleted. */
  singleLabel: string | null;
  onClose: () => void;
  onDeleted: () => void;
}

export function DeleteCardsDialog({ cardIds, singleLabel, onClose, onDeleted }: Props) {
  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    ...orpc.cards.delete.mutationOptions(),
    onSuccess: async (result) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: orpc.cards.list.key() }),
        queryClient.invalidateQueries({ queryKey: orpc.books.get.key() }),
        queryClient.invalidateQueries({ queryKey: orpc.books.list.key() }),
        queryClient.invalidateQueries({ queryKey: orpc.study.session.key() }),
      ]);
      toast.success(m.cards_deleted({ count: result.deleted }));
      onDeleted();
      onClose();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : m.error_deleting_cards());
    },
  });

  return (
    <AlertDialog
      open={cardIds.length > 0}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <AlertDialogPopup>
        <AlertDialogTitle>
          {singleLabel == null
            ? m.delete_cards_title({ count: cardIds.length })
            : m.delete_card_title({ word: singleLabel })}
        </AlertDialogTitle>
        <AlertDialogDescription>{m.delete_cards_description()}</AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogClose render={<Button variant="ghost" />}>{m.cancel()}</AlertDialogClose>
          <Button
            variant="destructive"
            disabled={deleteMutation.isPending}
            onClick={() => {
              deleteMutation.mutate({ cardIds: [...cardIds] });
            }}
          >
            <Trash2 />
            {deleteMutation.isPending ? m.deleting() : m.delete()}
          </Button>
        </AlertDialogFooter>
      </AlertDialogPopup>
    </AlertDialog>
  );
}
