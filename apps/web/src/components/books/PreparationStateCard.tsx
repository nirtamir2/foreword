import { FileUp, PackageOpen, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import type { PreparationState } from "@/lib/analysis/preparationState";
import { m } from "@/paraglide/messages.js";

interface Props {
  state: Exclude<PreparationState, "preparing" | "ready">;
  pendingCandidates: number;
  hasSavedFile: boolean;
  isBusy: boolean;
  onResume: () => void;
  onContinueWithSavedFile: () => void;
  onUploadFile: () => void;
}

export function PreparationStateCard({
  state,
  pendingCandidates,
  hasSavedFile,
  isBusy,
  onResume,
  onContinueWithSavedFile,
  onUploadFile,
}: Props) {
  if (state === "resumable") {
    return (
      <EmptyState
        tone="accent"
        icon={<RefreshCw />}
        title={m.prep_resumable_title()}
        description={m.prep_resumable_description({ count: pendingCandidates })}
        action={
          <Button type="button" size="lg" disabled={isBusy} onClick={onResume}>
            <Sparkles />
            {m.prep_resume_action()}
          </Button>
        }
      />
    );
  }

  if (state === "needs-file") {
    return (
      <EmptyState
        tone="warning"
        icon={<FileUp />}
        title={m.prep_needs_file_title()}
        description={
          hasSavedFile ? m.prep_needs_file_saved_description() : m.prep_needs_file_description()
        }
        action={
          <>
            {hasSavedFile ? (
              <Button type="button" size="lg" disabled={isBusy} onClick={onContinueWithSavedFile}>
                <Sparkles />
                {m.prep_continue_saved_file()}
              </Button>
            ) : null}
            <Button
              type="button"
              size="lg"
              variant={hasSavedFile ? "outline" : "default"}
              disabled={isBusy}
              onClick={onUploadFile}
            >
              <FileUp />
              {m.prep_upload_same_file()}
            </Button>
          </>
        }
      />
    );
  }

  return (
    <EmptyState
      icon={<PackageOpen />}
      title={m.prep_empty_title()}
      description={m.prep_empty_description()}
      action={
        <Button type="button" variant="outline" disabled={isBusy} onClick={onUploadFile}>
          <FileUp />
          {m.prep_upload_same_file()}
        </Button>
      }
    />
  );
}
