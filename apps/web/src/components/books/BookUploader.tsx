import type * as React from "react";
import { useId, useRef, useState } from "react";
import clsx from "clsx";
import { FileText, Loader2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ACCEPTED_BOOK_TYPES, MAX_BOOK_FILE_BYTES } from "@/lib/parsing/parseBook";
import { m } from "@/paraglide/messages.js";

type UploaderIntent = "new-book" | "same-book";

interface Props {
  intent: UploaderIntent;
  isBusy: boolean;
  busyLabel: string | null;
  onFileSelected: (file: File) => void;
}

export function BookUploader({ intent, isBusy, busyLabel, onFileSelected }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const [isDragging, setIsDragging] = useState(false);

  function selectFirst(files: FileList | null) {
    const file = files?.[0];
    if (file != null && !isBusy) {
      onFileSelected(file);
    }
  }

  function handleDrop(event: React.DragEvent<HTMLElement>) {
    event.preventDefault();
    setIsDragging(false);
    selectFirst(event.dataTransfer.files);
  }

  const title = intent === "same-book" ? m.upload_same_title() : m.upload_title();
  const description = intent === "same-book" ? m.upload_same_description() : m.upload_description();
  const maxMegabytes = Math.round(MAX_BOOK_FILE_BYTES / (1024 * 1024));

  return (
    <section
      aria-labelledby={`${inputId}-title`}
      onDragOver={(event) => {
        event.preventDefault();
        if (!isBusy) {
          setIsDragging(true);
        }
      }}
      onDragLeave={() => {
        setIsDragging(false);
      }}
      onDrop={handleDrop}
      className={clsx(
        "relative flex flex-col items-center justify-center gap-6 overflow-hidden rounded-3xl border-2 border-dashed px-6 py-14 text-center transition-[border-color,background-color,transform] duration-200 ease-(--ease-app-out)",
        isDragging
          ? "scale-[1.01] border-app-accent bg-app-accent-soft"
          : "border-app-border-strong bg-app-surface hover:border-app-accent/60",
        isBusy && "pointer-events-none",
      )}
    >
      <div className="paper-grid absolute inset-0 -z-10 mask-[radial-gradient(ellipse_at_center,black,transparent_80%)] opacity-60" />
      <span
        className={clsx(
          "flex size-16 items-center justify-center rounded-2xl transition-colors",
          isDragging ? "bg-app-accent text-app-on-accent" : "bg-app-accent-soft text-app-accent",
        )}
      >
        {isBusy ? <Loader2 className="size-7 animate-spin" /> : <UploadCloud className="size-7" />}
      </span>

      <div className="flex max-w-md flex-col gap-2">
        <h2 id={`${inputId}-title`} className="text-xl font-semibold tracking-tight text-app-text">
          {isBusy && busyLabel != null ? busyLabel : title}
        </h2>
        <p className="text-sm/relaxed text-app-text-muted">{description}</p>
      </div>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={ACCEPTED_BOOK_TYPES}
        className="sr-only"
        disabled={isBusy}
        aria-describedby={`${inputId}-hint`}
        onChange={(event) => {
          selectFirst(event.target.files);
          event.target.value = "";
        }}
      />
      <div className="flex flex-col items-center gap-3">
        <Button
          type="button"
          size="lg"
          disabled={isBusy}
          onClick={() => {
            inputRef.current?.click();
          }}
        >
          <FileText />
          {intent === "same-book" ? m.upload_same_choose() : m.upload_choose()}
        </Button>
        <p id={`${inputId}-hint`} className="text-xs text-app-text-subtle">
          {m.upload_hint({ size: maxMegabytes })}
        </p>
      </div>
    </section>
  );
}
