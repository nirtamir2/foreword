import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
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
import { deleteBookFile } from "@/lib/storage/bookFileStore";
import { m } from "@/paraglide/messages.js";
import { orpc } from "@/utils/orpc";

interface Props {
  book: { id: string; title: string; contentHash: string } | null;
  onClose: () => void;
}

export function DeleteBookDialog({ book, onClose }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    ...orpc.books.delete.mutationOptions(),
    onSuccess: async (_result, variables) => {
      if (book != null) {
        await deleteBookFile({ contentHash: book.contentHash });
      }
      await queryClient.invalidateQueries({ queryKey: orpc.books.list.key() });
      queryClient.removeQueries({
        queryKey: orpc.books.get.key({ input: { bookId: variables.bookId } }),
      });
      toast.success(m.book_deleted());
      onClose();
      void navigate({ to: "/library" });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : m.error_deleting_book());
    },
  });

  return (
    <AlertDialog
      open={book != null}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <AlertDialogPopup>
        <AlertDialogTitle dir="auto">
          {m.delete_book_title({ title: book?.title ?? "" })}
        </AlertDialogTitle>
        <AlertDialogDescription>{m.delete_book_description()}</AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogClose render={<Button variant="ghost" />}>{m.cancel()}</AlertDialogClose>
          <Button
            variant="destructive"
            disabled={deleteMutation.isPending || book == null}
            onClick={() => {
              if (book != null) {
                deleteMutation.mutate({ bookId: book.id });
              }
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
