import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { PreparationProgress } from "@/lib/analysis/preparationProgress";
import { progressFor } from "@/lib/analysis/preparationProgress";
import { rankAndSaveCandidates, refinePendingCandidates } from "@/lib/analysis/runPreparation";
import { parseBook } from "@/lib/parsing/parseBook";
import { preparationErrorMessage } from "@/lib/preparationErrorMessage";
import { hasBookFile, loadBookFile, saveBookFile } from "@/lib/storage/bookFileStore";
import { m } from "@/paraglide/messages.js";
import type { BookDetail } from "@/utils/apiTypes";
import { client, orpc } from "@/utils/orpc";

/** Cards to add per "Add more words" click. */
const ADD_MORE_TARGET = 24;

interface Outcome {
  created: number;
  pendingCount: number;
}

function announce({ created, pendingCount }: Outcome) {
  if (created > 0) {
    toast.success(m.prep_added_cards({ count: created }));
    return;
  }
  if (pendingCount > 0) {
    toast.warning(m.prep_no_cards_this_time());
    return;
  }
  toast(m.prep_backlog_empty());
}

/**
 * Orchestrates every follow-up preparation flow on the book page: resuming refinement,
 * adding more words from the backlog, and re-analyzing from the saved or re-uploaded file.
 */
export function useBookPreparation({ book }: { book: BookDetail | undefined }) {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<PreparationProgress | null>(null);
  const [hasSavedFile, setHasSavedFile] = useState(false);
  const [needsUpload, setNeedsUpload] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  /**
   * Set synchronously when a run starts (including loading the saved file from IndexedDB) and
   * cleared when it settles. Render state lags a click, so it cannot be the re-entrancy guard.
   */
  const isRunningRef = useRef(false);
  const contentHash = book?.contentHash ?? null;

  useEffect(() => {
    if (contentHash == null) {
      return;
    }
    let cancelled = false;
    void hasBookFile({ contentHash }).then((exists) => {
      if (!cancelled) {
        setHasSavedFile(exists);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [contentHash]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  async function refreshBookData() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: orpc.books.get.key() }),
      queryClient.invalidateQueries({ queryKey: orpc.books.list.key() }),
      queryClient.invalidateQueries({ queryKey: orpc.cards.list.key() }),
      queryClient.invalidateQueries({ queryKey: orpc.study.session.key() }),
    ]);
  }

  /** `work` resolves null when it stopped before preparing anything (nothing to announce). */
  async function run(work: (signal: AbortSignal) => Promise<Outcome | null>) {
    if (book == null || isRunningRef.current) {
      return;
    }
    isRunningRef.current = true;
    const controller = new AbortController();
    abortRef.current = controller;
    setProgress(progressFor({ stage: "ranking", ratio: 0 }));
    try {
      const outcome = await work(controller.signal);
      if (outcome == null) {
        return;
      }
      if (book.analysisStatus !== "READY" && (outcome.created > 0 || outcome.pendingCount === 0)) {
        await client.analysis.finalize({ bookId: book.id });
      }
      await refreshBookData();
      announce(outcome);
      setNeedsUpload(false);
    } catch (error) {
      if (!(error instanceof Error && error.name === "AbortError")) {
        toast.error(preparationErrorMessage({ error, fallback: m.error_preparing_more() }));
      }
      await refreshBookData();
    } finally {
      isRunningRef.current = false;
      abortRef.current = null;
      setProgress(null);
    }
  }

  /** Continue refining the saved backlog. No file needed. */
  function resumeFromBacklog() {
    void run(async (signal) => {
      if (book == null) {
        return { created: 0, pendingCount: 0 };
      }
      setProgress(
        progressFor({ stage: "writing", ratio: 0, pendingCandidates: book.pendingCandidates }),
      );
      const outcome = await refinePendingCandidates({
        bookId: book.id,
        onProgress: setProgress,
        signal,
        targetCards: ADD_MORE_TARGET,
        initialPending: book.pendingCandidates,
      });
      return outcome;
    });
  }

  async function analyze({ file, signal }: { file: File; signal: AbortSignal }): Promise<Outcome> {
    if (book == null) {
      return { created: 0, pendingCount: 0 };
    }
    setProgress(progressFor({ stage: "reading", ratio: 0 }));
    const parsed = await parseBook({
      file,
      onProgress: (parseProgress) => {
        setProgress(
          progressFor({
            stage: parseProgress.stage === "detecting" ? "detecting" : "reading",
            ratio: parseProgress.ratio ?? 0.5,
          }),
        );
      },
    });
    if (parsed.contentHash !== book.contentHash) {
      throw new Error(m.error_wrong_file());
    }
    const saved = await saveBookFile({ contentHash: parsed.contentHash, file });
    setHasSavedFile(saved);
    const ranked = await rankAndSaveCandidates({
      book: parsed,
      context: {
        bookId: book.id,
        language: book.bookLanguage,
        level: book.level,
        positionType: book.positionType,
        positionValue: book.positionValue,
        onProgress: setProgress,
        signal,
      },
    });
    return await refinePendingCandidates({
      bookId: book.id,
      onProgress: setProgress,
      signal,
      targetCards: ADD_MORE_TARGET,
      initialPending: ranked.pendingCount,
    });
  }

  /** Re-analyze from a file (saved or re-uploaded), then refine the next set. */
  function analyzeFromFile(file: File) {
    void run(async (signal) => await analyze({ file, signal }));
  }

  /** Load the saved file inside the same run, so the IndexedDB read is guarded too. */
  async function continueWithSavedFile() {
    await run(async (signal) => {
      if (book == null) {
        return null;
      }
      setProgress(progressFor({ stage: "reading", ratio: 0 }));
      const file = await loadBookFile({ contentHash: book.contentHash });
      if (file == null) {
        setHasSavedFile(false);
        setNeedsUpload(true);
        toast(m.prep_saved_file_missing());
        return null;
      }
      return await analyze({ file, signal });
    });
  }

  /** The "Add more words" entry point: backlog first, then saved file, then ask for the file. */
  function addMoreWords() {
    if (book == null) {
      return;
    }
    if (book.pendingCandidates > 0) {
      resumeFromBacklog();
      return;
    }
    if (hasSavedFile) {
      void continueWithSavedFile();
      return;
    }
    setNeedsUpload(true);
  }

  return {
    progress,
    isPreparing: progress != null,
    hasSavedFile,
    needsUpload,
    setNeedsUpload,
    addMoreWords,
    resumeFromBacklog,
    continueWithSavedFile,
    analyzeFromFile,
  };
}
