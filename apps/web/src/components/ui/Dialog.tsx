import type * as React from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";
import type { OmitClassName } from "@/components/ui/OmitClassName";
import { m } from "@/paraglide/messages.js";

function Dialog(props: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger(props: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal(props: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose(props: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay(props: Omit<DialogPrimitive.Backdrop.Props, "className">) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className="fixed inset-0 isolate z-50 bg-black/70 backdrop-blur-sm transition-opacity duration-200 ease-(--ease-app-out) data-open:opacity-100 data-closed:opacity-0"
      {...props}
    />
  );
}

function DialogContent({
  children,
  showCloseButton = true,
  ...props
}: OmitClassName<
  DialogPrimitive.Popup.Props & {
    showCloseButton?: boolean;
  }
>) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className="fixed top-[max(1rem,env(safe-area-inset-top))] left-1/2 z-50 grid max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 gap-4 overflow-y-auto overscroll-contain rounded-xl border border-app-border bg-app-surface-raised p-5 pt-14 text-app-text shadow-(--app-shadow-raised) transition-[transform,opacity] duration-200 ease-(--ease-app-out) outline-none sm:top-1/2 sm:w-full sm:-translate-y-1/2 sm:p-6 data-open:scale-100 data-open:opacity-100 data-closed:scale-95 data-closed:opacity-0"
        {...props}
      >
        {children}
        {showCloseButton ? (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="absolute inset-e-3 top-2 flex size-11 items-center justify-center rounded-xl text-app-text-subtle transition-[transform,background-color,color] duration-150 ease-(--ease-app-out) hover:bg-app-surface-muted hover:text-app-text focus-visible:ring-2 focus-visible:ring-app-blue/50 focus-visible:outline-none active:scale-[0.97] sm:inset-e-4 sm:top-4 sm:size-8 sm:rounded-lg"
          >
            <XIcon className="size-4" />
            <span className="sr-only">{m.dialog_close()}</span>
          </DialogPrimitive.Close>
        ) : null}
      </DialogPrimitive.Popup>
    </DialogPortal>
  );
}

function DialogHeader(props: Omit<React.ComponentProps<"div">, "className">) {
  return <div data-slot="dialog-header" className="flex flex-col gap-1 text-start" {...props} />;
}

function DialogFooter(props: Omit<React.ComponentProps<"div">, "className">) {
  return <div data-slot="dialog-footer" className="mt-2 flex justify-end gap-3" {...props} />;
}

function DialogTitle(props: Omit<DialogPrimitive.Title.Props, "className">) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className="text-lg font-bold text-app-text"
      {...props}
    />
  );
}

function DialogDescription(props: Omit<DialogPrimitive.Description.Props, "className">) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className="text-sm text-app-text-muted"
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
