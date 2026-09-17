import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute, redirect } from "@tanstack/react-router";
import { BookMarked, Plus } from "lucide-react";
import { BookCard } from "@/components/books/BookCard";
import { AppNavigation } from "@/components/layout/AppNavigation";
import { GlobalHeaderControls } from "@/components/layout/GlobalHeaderControls";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button, buttonVariants } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { getUser } from "@/functions/getUser";
import { m } from "@/paraglide/messages.js";
import { buildSeo, withAppName } from "@/utils/buildSeo";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/library")({
  head: () =>
    buildSeo({
      title: withAppName({ title: m.library_title() }),
      description: m.library_seo_description(),
      pathname: "/library",
      noIndex: true,
    }),
  beforeLoad: async () => {
    const session = await getUser();
    if (session?.user == null) {
      throw redirect({ to: "/auth/login" });
    }
    return { session };
  },
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(orpc.books.list.queryOptions());
  },
  component: LibraryComponent,
});

function LibraryComponent() {
  const booksQuery = useQuery(orpc.books.list.queryOptions());
  const books = booksQuery.data ?? [];
  const totals = { cards: 0, known: 0 };
  for (const book of books) {
    totals.cards += book.cardCount;
    totals.known += book.knownCount;
  }

  return (
    <PageLayout
      headerControls={<GlobalHeaderControls />}
      navigation={AppNavigation}
      headerAction={
        <Link to="/books/new" className={buttonVariants({ size: "sm" })}>
          <Plus data-icon="inline-start" />
          {m.nav_add_book()}
        </Link>
      }
    >
      <div className="flex flex-col gap-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-app-accent">{m.library_kicker()}</p>
            <h1 className="font-display text-4xl/tight tracking-tight sm:text-5xl/tight">
              {m.library_title()}
            </h1>
            <p className="max-w-xl text-base text-app-text-muted">
              {books.length === 0
                ? m.library_subtitle_empty()
                : m.library_subtitle({
                    books: books.length,
                    known: totals.known,
                    cards: totals.cards,
                  })}
            </p>
          </div>
          {books.length > 0 ? (
            <Link to="/books/new" className={buttonVariants({ size: "lg" })}>
              <Plus data-icon="inline-start" />
              {m.nav_add_book()}
            </Link>
          ) : null}
        </header>

        {booksQuery.isLoading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Skeleton style={{ height: "18rem" }} />
            <Skeleton style={{ height: "18rem" }} />
            <Skeleton style={{ height: "18rem" }} />
          </div>
        ) : null}

        {booksQuery.isSuccess && books.length === 0 ? (
          <EmptyState
            tone="accent"
            icon={<BookMarked />}
            title={m.library_empty_title()}
            description={m.library_empty_description()}
            action={
              <Link to="/books/new" className={buttonVariants({ size: "lg" })}>
                <Plus data-icon="inline-start" />
                {m.library_add_first_book()}
              </Link>
            }
          />
        ) : null}

        {booksQuery.isSuccess && books.length > 0 ? (
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {books.map((book) => (
              <li key={book.id} className="flex">
                <BookCard book={book} />
              </li>
            ))}
            <li className="flex">
              <Link
                to="/books/new"
                className="flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-app-border-strong p-8 text-center text-app-text-muted transition-colors hover:border-app-accent hover:bg-app-accent-soft/40 hover:text-app-accent-strong focus-visible:ring-2 focus-visible:ring-app-accent/40 focus-visible:outline-none"
              >
                <span className="flex size-12 items-center justify-center rounded-2xl bg-app-surface-muted">
                  <Plus className="size-5" />
                </span>
                <span className="text-sm font-semibold">{m.library_add_another()}</span>
              </Link>
            </li>
          </ul>
        ) : null}

        {booksQuery.isError ? (
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => {
                void booksQuery.refetch();
              }}
            >
              {m.try_again()}
            </Button>
          </div>
        ) : null}
      </div>
    </PageLayout>
  );
}
