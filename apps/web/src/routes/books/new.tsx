import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { clsx } from "clsx";
import { toast } from "sonner";
import { BookSetupForm } from "@/components/books/BookSetupForm";
import type { BookSetupValue } from "@/components/books/BookSetupForm";
import { BookUploader } from "@/components/books/BookUploader";
import { ParsedBookSummary } from "@/components/books/ParsedBookSummary";
import { PreparationProgressCard } from "@/components/books/PreparationProgressCard";
import { AppNavigation } from "@/components/layout/AppNavigation";
import { GlobalHeaderControls } from "@/components/layout/GlobalHeaderControls";
import { PageLayout } from "@/components/layout/PageLayout";
import { getUser } from "@/functions/getUser";
import { useLeaveGuard } from "@/hooks/useLeaveGuard";
import type { PreparationProgress } from "@/lib/analysis/preparationProgress";
import { progressFor } from "@/lib/analysis/preparationProgress";
import { runInitialPreparation } from "@/lib/analysis/runPreparation";
import { parseBook } from "@/lib/parsing/parseBook";
import type { ParseBookProgress } from "@/lib/parsing/parseBook";
import type { ParsedBook } from "@/lib/parsing/types";
import { preparationErrorMessage } from "@/lib/preparationErrorMessage";
import { saveBookFile } from "@/lib/storage/bookFileStore";
import { m } from "@/paraglide/messages.js";
import { buildSeo, withAppName } from "@/utils/buildSeo";
import { client, orpc } from "@/utils/orpc";

export const Route = createFileRoute("/books/new")({
  head: () =>
    buildSeo({
      title: withAppName({ title: m.new_book_title() }),
      description: m.new_book_seo_description(),
      pathname: "/books/new",
      noIndex: true,
    }),
  beforeLoad: async () => {
    const session = await getUser();
    if (session?.user == null) {
      throw redirect({ to: "/auth/login" });
    }
    return { session };
  },
  component: NewBookComponent,
});

type Step = "upload" | "configure" | "prepare";

const BOOK_EXTENSION = /\.(?:epub|pdf)$/i;

function parseStageLabelFor(progress: ParseBookProgress): string {
  if (progress.stage === "hashing") {
    return m.stage_hashing();
  }
  if (progress.stage === "detecting") {
    return m.stage_detecting();
  }
  if (progress.ratio == null) {
    return m.stage_reading();
  }
  return m.stage_reading_pages({ percent: Math.round(progress.ratio * 100) });
}

function stepFor({
  parsedBook,
  progress,
}: {
  parsedBook: ParsedBook | null;
  progress: PreparationProgress | null;
}): Step {
  if (progress != null) {
    return "prepare";
  }
  return parsedBook == null ? "upload" : "configure";
}

function NewBookComponent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [parsedBook, setParsedBook] = useState<ParsedBook | null>(null);
  const [parseStageLabel, setParseStageLabel] = useState<string | null>(null);
  const [progress, setProgress] = useState<PreparationProgress | null>(null);
  const fileRef = useRef<File | null>(null);

  const parseMutation = useMutation({
    mutationFn: async (file: File) => {
      fileRef.current = file;
      return await parseBook({
        file,
        onProgress: (parseProgress) => {
          setParseStageLabel(parseStageLabelFor(parseProgress));
        },
      });
    },
    onSuccess: (book) => {
      setParsedBook(book);
      setParseStageLabel(null);
    },
    onError: (error) => {
      setParseStageLabel(null);
      toast.error(preparationErrorMessage({ error, fallback: m.error_reading_book() }));
    },
  });

  const createMutation = useMutation(orpc.books.create.mutationOptions());
  const isPreparing = progress != null || createMutation.isPending;
  const step = stepFor({ parsedBook, progress });

  useLeaveGuard({ isActive: isPreparing });

  async function startPreparation(setup: BookSetupValue, book: ParsedBook) {
    let bookId: string | null = null;
    try {
      const created = await createMutation.mutateAsync({
        title: book.title ?? book.fileName.replace(BOOK_EXTENSION, ""),
        author: book.author,
        bookLanguage: setup.bookLanguage,
        nativeLanguage: setup.nativeLanguage,
        level: setup.level,
        sourceFormat: book.sourceFormat,
        contentHash: book.contentHash,
        totalChapters: book.chapters.length,
        totalWords: book.totalWords,
        positionType: setup.positionType,
        positionValue: setup.positionValue,
      });
      bookId = created.id;
      if (created.reused) {
        toast(m.new_book_reused());
      }
      if (fileRef.current != null) {
        void saveBookFile({ contentHash: book.contentHash, file: fileRef.current });
      }

      setProgress(progressFor({ stage: "ranking", ratio: 0 }));
      const outcome = await runInitialPreparation({
        book,
        context: {
          bookId,
          language: setup.bookLanguage,
          level: setup.level,
          positionType: setup.positionType,
          positionValue: setup.positionValue,
          onProgress: setProgress,
        },
      });
      await queryClient.invalidateQueries({ queryKey: orpc.books.list.key() });
      if (outcome.created === 0 && outcome.pendingCount === 0) {
        toast.warning(m.new_book_no_cards());
      } else {
        toast.success(m.new_book_ready({ count: outcome.created }));
      }
      setProgress(null);
      void navigate({ to: "/books/$bookId", params: { bookId } });
    } catch (error) {
      setProgress(null);
      toast.error(preparationErrorMessage({ error, fallback: m.error_preparing_book() }));
      if (bookId != null) {
        // Anything saved so far is resumable from the book page.
        await client.analysis.capabilities().catch(() => null);
        void navigate({ to: "/books/$bookId", params: { bookId } });
      }
    }
  }

  const steps: ReadonlyArray<{ id: Step; label: string }> = [
    { id: "upload", label: m.new_book_step_upload() },
    { id: "configure", label: m.new_book_step_configure() },
    { id: "prepare", label: m.new_book_step_prepare() },
  ];
  const stepIndex = steps.findIndex((item) => item.id === step);

  return (
    <PageLayout
      headerControls={<GlobalHeaderControls />}
      navigation={AppNavigation}
      width="narrow"
      onBack={() => {
        if (isPreparing) {
          toast(m.prep_leave_warning());
          return;
        }
        void navigate({ to: "/library" });
      }}
    >
      <div className="flex flex-col gap-8">
        <header className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-app-accent">{m.new_book_kicker()}</p>
            <h1 className="font-display text-4xl/tight tracking-tight sm:text-5xl/tight">
              {m.new_book_title()}
            </h1>
            <p className="max-w-xl text-base text-app-text-muted">{m.new_book_subtitle()}</p>
          </div>
          <ol
            className="flex items-center gap-2 text-xs font-medium"
            aria-label={m.new_book_steps_label()}
          >
            {steps.map((item, index) => (
              <li key={item.id} className="flex items-center gap-2">
                <span
                  aria-current={index === stepIndex ? "step" : undefined}
                  className={clsx(
                    "flex items-center gap-2 rounded-full border px-3 py-1.5 transition-colors",
                    index < stepIndex &&
                      "border-app-success/20 bg-app-success-soft text-app-success",
                    index === stepIndex && "border-app-ink bg-app-ink text-app-canvas",
                    index > stepIndex && "border-app-border bg-app-surface text-app-text-subtle",
                  )}
                >
                  <span className="font-mono">{index + 1}</span>
                  {item.label}
                </span>
                {index < steps.length - 1 ? (
                  <span aria-hidden="true" className="h-px w-4 bg-app-border sm:w-8" />
                ) : null}
              </li>
            ))}
          </ol>
        </header>

        {step === "upload" ? (
          <BookUploader
            intent="new-book"
            isBusy={parseMutation.isPending}
            busyLabel={parseStageLabel}
            onFileSelected={(file) => {
              parseMutation.mutate(file);
            }}
          />
        ) : null}

        {parsedBook != null && step === "configure" ? (
          <div className="flex animate-rise flex-col gap-6">
            <ParsedBookSummary
              book={parsedBook}
              onReplace={() => {
                setParsedBook(null);
                fileRef.current = null;
              }}
            />
            <section className="rounded-2xl border border-app-border bg-app-surface p-5 shadow-(--app-shadow-raised) sm:p-6">
              <BookSetupForm
                book={parsedBook}
                isSubmitting={isPreparing}
                onSubmit={(setup) => {
                  void startPreparation(setup, parsedBook);
                }}
              />
            </section>
            <p className="text-center text-xs text-app-text-subtle">{m.new_book_privacy_note()}</p>
          </div>
        ) : null}

        {parsedBook != null && progress != null ? (
          <div className="flex animate-rise flex-col gap-6">
            <ParsedBookSummary book={parsedBook} onReplace={null} />
            <PreparationProgressCard progress={progress} title={m.prep_title()} />
          </div>
        ) : null}
      </div>
    </PageLayout>
  );
}
