import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { BookOverviewHeader } from "@/components/books/BookOverviewHeader";
import { BookUploader } from "@/components/books/BookUploader";
import { DeleteBookDialog } from "@/components/books/DeleteBookDialog";
import { PreparationProgressCard } from "@/components/books/PreparationProgressCard";
import { PreparationStateCard } from "@/components/books/PreparationStateCard";
import { useBookPreparation } from "@/components/books/useBookPreparation";
import { VocabularyTable } from "@/components/books/VocabularyTable";
import { VocabularyToolbar } from "@/components/books/VocabularyToolbar";
import type { CardSort, KnowledgeFilter } from "@/components/books/VocabularyToolbar";
import { AppNavigation } from "@/components/layout/AppNavigation";
import { GlobalHeaderControls } from "@/components/layout/GlobalHeaderControls";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { getUser } from "@/functions/getUser";
import { useLeaveGuard } from "@/hooks/useLeaveGuard";
import { preparationState } from "@/lib/analysis/preparationState";
import { m } from "@/paraglide/messages.js";
import type { VocabularyCardRow } from "@/utils/apiTypes";
import { buildSeo, withAppName } from "@/utils/buildSeo";
import { client, orpc } from "@/utils/orpc";

export const Route = createFileRoute("/books/$bookId")({
  head: () =>
    buildSeo({
      title: withAppName({ title: m.book_page_title() }),
      description: m.book_page_seo_description(),
      pathname: "/books",
      noIndex: true,
    }),
  beforeLoad: async () => {
    const session = await getUser();
    if (session?.user == null) {
      throw redirect({ to: "/auth/login" });
    }
    return { session };
  },
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(
        orpc.books.get.queryOptions({ input: { bookId: params.bookId } }),
      ),
      context.queryClient.ensureQueryData(
        orpc.cards.list.queryOptions({ input: { bookId: params.bookId, sort: "priority" } }),
      ),
    ]);
  },
  component: BookComponent,
});

function filterCards({
  cards,
  filter,
}: {
  cards: ReadonlyArray<VocabularyCardRow>;
  filter: KnowledgeFilter;
}): ReadonlyArray<VocabularyCardRow> {
  switch (filter) {
    case "TO_LEARN": {
      return cards.filter((card) => card.status !== "KNOWN");
    }
    case "ALL": {
      return cards;
    }
    case "NEW":
    case "LEARNING":
    case "KNOWN": {
      return cards.filter((card) => card.status === filter);
    }
  }
}

function toFileSlug(title: string): string {
  const slug = title
    .toLowerCase()
    .replaceAll(/[^\p{L}\p{N}]+/gu, "-")
    .replaceAll(/^-|-$/g, "");
  return slug.length > 0 ? slug : "vocabulary";
}

function BookComponent() {
  const { bookId } = Route.useParams();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<KnowledgeFilter>("TO_LEARN");
  const [sort, setSort] = useState<CardSort>("priority");
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const bookQuery = useQuery(orpc.books.get.queryOptions({ input: { bookId } }));
  const cardsQuery = useQuery(orpc.cards.list.queryOptions({ input: { bookId, sort } }));
  const book = bookQuery.data;
  const preparation = useBookPreparation({ book });

  useLeaveGuard({ isActive: preparation.isPreparing });

  const cards = cardsQuery.data ?? [];
  const counts = {
    total: cards.length,
    known: cards.filter((card) => card.status === "KNOWN").length,
    learning: cards.filter((card) => card.status === "LEARNING").length,
    fresh: cards.filter((card) => card.status === "NEW").length,
  };
  const filtered = filterCards({ cards, filter });
  const filters: ReadonlyArray<{ value: KnowledgeFilter; label: string; count: number }> = [
    { value: "TO_LEARN", label: m.filter_to_learn(), count: counts.fresh + counts.learning },
    { value: "NEW", label: m.filter_new(), count: counts.fresh },
    { value: "LEARNING", label: m.filter_learning(), count: counts.learning },
    { value: "KNOWN", label: m.filter_known(), count: counts.known },
    { value: "ALL", label: m.filter_all(), count: counts.total },
  ];

  const state =
    book == null
      ? null
      : preparationState({
          analysisStatus: book.analysisStatus,
          cardCount: book.cardCount,
          pendingCandidates: book.pendingCandidates,
          isPreparing: preparation.isPreparing,
        });

  async function exportCsv() {
    if (book == null) {
      return;
    }
    try {
      const { csv } = await client.export.csv({ bookId });
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${toFileSlug(book.title)}-vocabulary.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(m.export_ready());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : m.error_export());
    }
  }

  return (
    <PageLayout
      title={book?.title ?? m.book_page_title()}
      subtitle={book?.author ?? undefined}
      headerControls={<GlobalHeaderControls />}
      navigation={AppNavigation}
      onBack={() => {
        if (preparation.isPreparing) {
          toast(m.prep_leave_warning());
          return;
        }
        void navigate({ to: "/library" });
      }}
    >
      <div className="flex flex-col gap-6">
        {bookQuery.isLoading || cardsQuery.isLoading ? (
          <>
            <Skeleton style={{ height: "20rem" }} />
            <Skeleton style={{ height: "3rem" }} />
            <Skeleton style={{ height: "24rem" }} />
          </>
        ) : null}

        {book != null && cardsQuery.isSuccess ? (
          <BookOverviewHeader
            book={book}
            counts={counts}
            isPreparing={preparation.isPreparing}
            canAddMore={!preparation.isPreparing}
            onAddMore={preparation.addMoreWords}
            onExport={() => {
              void exportCsv();
            }}
            onDelete={() => {
              setIsDeleteOpen(true);
            }}
          />
        ) : null}

        {preparation.progress == null ? null : (
          <PreparationProgressCard progress={preparation.progress} title={m.prep_adding_title()} />
        )}

        {book != null && preparation.needsUpload && preparation.progress == null ? (
          <section className="flex animate-rise flex-col gap-4">
            <BookUploader
              intent="same-book"
              isBusy={false}
              busyLabel={null}
              onFileSelected={(file) => {
                preparation.analyzeFromFile(file);
              }}
            />
            <div className="flex justify-center">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  preparation.setNeedsUpload(false);
                }}
              >
                {m.cancel()}
              </Button>
            </div>
          </section>
        ) : null}

        {book != null &&
        cardsQuery.isSuccess &&
        cards.length === 0 &&
        state != null &&
        state !== "preparing" &&
        state !== "ready" &&
        !preparation.needsUpload ? (
          <PreparationStateCard
            state={state}
            pendingCandidates={book.pendingCandidates}
            hasSavedFile={preparation.hasSavedFile}
            isBusy={preparation.isPreparing}
            onResume={preparation.resumeFromBacklog}
            onContinueWithSavedFile={() => {
              void preparation.continueWithSavedFile();
            }}
            onUploadFile={() => {
              preparation.setNeedsUpload(true);
            }}
          />
        ) : null}

        {book != null && cardsQuery.isSuccess && cards.length > 0 ? (
          <section className="flex flex-col gap-4" aria-labelledby="vocabulary-title">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="flex flex-col gap-1">
                <h2 id="vocabulary-title" className="font-display text-3xl/tight tracking-tight">
                  {m.vocabulary_title()}
                </h2>
                <p className="text-sm text-app-text-muted">
                  {m.vocabulary_showing({ count: filtered.length, total: cards.length })}
                  {state === "resumable"
                    ? ` · ${m.vocabulary_more_pending({ count: book.pendingCandidates })}`
                    : ""}
                </p>
              </div>
            </div>
            <VocabularyToolbar
              filter={filter}
              filters={filters}
              onFilterChange={setFilter}
              sort={sort}
              onSortChange={setSort}
            />
            {filtered.length > 0 ? (
              <VocabularyTable
                cards={filtered}
                bookLanguage={book.bookLanguage}
                nativeLanguage={book.nativeLanguage}
              />
            ) : (
              <EmptyState
                icon={<Search />}
                title={m.vocabulary_empty_filter_title()}
                description={m.vocabulary_empty_filter_description()}
                action={
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setFilter("ALL");
                    }}
                  >
                    {m.vocabulary_show_all()}
                  </Button>
                }
              />
            )}
          </section>
        ) : null}
      </div>

      <DeleteBookDialog
        book={
          isDeleteOpen && book != null
            ? { id: book.id, title: book.title, contentHash: book.contentHash }
            : null
        }
        onClose={() => {
          setIsDeleteOpen(false);
        }}
      />
    </PageLayout>
  );
}
