import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clapperboard, Loader2, RefreshCw, Sparkles } from "lucide-react";
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
import { m } from "@/paraglide/messages.js";
import { orpc } from "@/utils/orpc";

interface VideoCard {
  id: string;
  displayForm: string;
  translation: string;
}

interface Props {
  card: VideoCard | null;
  onClose: () => void;
}

const POLL_INTERVAL_MS = 4000;

export function WordVideoDialog({ card, onClose }: Props) {
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
        {card == null ? null : <WordVideoContent key={card.id} card={card} />}
      </DialogContent>
    </Dialog>
  );
}

type VideoStatus = "QUEUED" | "IN_PROGRESS" | "COMPLETED" | "FAILED" | null;

function placeholderCopy({
  isGenerating,
  status,
  error,
}: {
  isGenerating: boolean;
  status: VideoStatus;
  error: string | null;
}): { title: string; description: string; action: string } {
  if (isGenerating) {
    return {
      title: m.video_generating_title(),
      description: m.video_generating_description(),
      action: m.video_generating_button(),
    };
  }
  if (status === "FAILED") {
    return {
      title: m.video_failed_title(),
      description: error ?? m.video_error(),
      action: m.video_try_again(),
    };
  }
  return {
    title: m.video_idle_title(),
    description: m.video_idle_description(),
    action: m.video_generate(),
  };
}

function WordVideoContent({ card }: { card: VideoCard }) {
  const queryClient = useQueryClient();
  const capabilitiesQuery = useQuery(orpc.analysis.capabilities.queryOptions());
  const videoQuery = useQuery({
    ...orpc.media.cardVideo.queryOptions({ input: { cardId: card.id } }),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "QUEUED" || status === "IN_PROGRESS" ? POLL_INTERVAL_MS : false;
    },
  });
  const requestMutation = useMutation({
    ...orpc.media.requestCardVideo.mutationOptions(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: orpc.media.cardVideo.key() });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : m.video_error());
    },
  });

  const video = videoQuery.data;
  const status = video?.status ?? null;
  const isGenerating = status === "QUEUED" || status === "IN_PROGRESS" || requestMutation.isPending;
  const isConfigured = capabilitiesQuery.data?.videoConfigured ?? true;

  const placeholder = placeholderCopy({ isGenerating, status, error: video?.error ?? null });

  function request({ regenerate }: { regenerate: boolean }) {
    requestMutation.mutate({ cardId: card.id, regenerate });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle dir="auto">{m.video_dialog_title({ word: card.displayForm })}</DialogTitle>
        <DialogDescription dir="auto">
          {m.video_dialog_description({ meaning: card.translation })}
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-4">
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-app-border bg-app-ink">
          {status === "COMPLETED" && video?.videoUrl != null ? (
            // eslint-disable-next-line jsx-a11y/media-has-caption -- generated clips are silent visual scenes with no speech to caption
            <video
              key={video.videoUrl}
              src={video.videoUrl}
              controls
              autoPlay
              loop
              playsInline
              className="size-full object-cover"
              aria-label={m.video_player_label({ word: card.displayForm })}
            />
          ) : (
            <div className="paper-grid absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center text-app-canvas opacity-100 [--tw-paper-grid-color:white]">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-white/10">
                {isGenerating ? (
                  <Loader2 className="size-6 animate-spin text-app-highlight" />
                ) : (
                  <Clapperboard className="size-6 text-app-highlight" />
                )}
              </span>
              <div className="flex flex-col gap-1">
                <p className="text-base font-semibold">{placeholder.title}</p>
                <p className="max-w-sm text-sm text-app-canvas/70">{placeholder.description}</p>
              </div>
              {isGenerating && video?.progress != null ? (
                <span className="font-mono text-xs text-app-canvas/70">
                  {Math.round(video.progress)}%
                </span>
              ) : null}
            </div>
          )}
        </div>

        {video?.prompt == null ? null : (
          <details className="rounded-xl border border-app-border bg-app-surface-soft px-4 py-3 text-sm">
            <summary className="cursor-pointer font-medium text-app-text-muted">
              {m.video_prompt_label()}
            </summary>
            <p className="pt-2 text-app-text-muted" dir="ltr">
              {video.prompt}
            </p>
          </details>
        )}

        {isConfigured ? null : (
          <p className="rounded-xl bg-app-warning-soft px-4 py-3 text-sm text-app-warning">
            {m.video_not_configured()}
          </p>
        )}
      </div>

      <DialogFooter>
        {status === "COMPLETED" ? (
          <Button
            type="button"
            variant="outline"
            disabled={isGenerating || !isConfigured}
            onClick={() => {
              request({ regenerate: true });
            }}
          >
            <RefreshCw />
            {m.video_regenerate()}
          </Button>
        ) : (
          <Button
            type="button"
            disabled={isGenerating || !isConfigured}
            onClick={() => {
              request({ regenerate: status === "FAILED" });
            }}
          >
            {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles />}
            {placeholder.action}
          </Button>
        )}
      </DialogFooter>
    </>
  );
}
