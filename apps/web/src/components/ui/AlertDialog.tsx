import type * as React from "react";
import { AlertDialog as AlertDialogPrimitive } from "@base-ui/react/alert-dialog";

function AlertDialog(props: AlertDialogPrimitive.Root.Props) {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />;
}

function AlertDialogTrigger(props: AlertDialogPrimitive.Trigger.Props) {
  return <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />;
}

function AlertDialogPortal(props: AlertDialogPrimitive.Portal.Props) {
  return <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />;
}

function AlertDialogBackdrop(props: Omit<AlertDialogPrimitive.Backdrop.Props, "className">) {
  return (
    <AlertDialogPrimitive.Backdrop
      data-slot="alert-dialog-backdrop"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm transition-opacity duration-200 ease-(--ease-app-out) data-ending-style:opacity-0 data-starting-style:opacity-0"
      {...props}
    />
  );
}

function AlertDialogPopup({
  children,
  ...props
}: Omit<AlertDialogPrimitive.Popup.Props, "className">) {
  return (
    <AlertDialogPrimitive.Portal>
      <AlertDialogBackdrop />
      <AlertDialogPrimitive.Popup
        data-slot="alert-dialog-popup"
        className="fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-1/2 rounded-xl border border-app-border bg-app-surface-raised p-6 text-app-text shadow-(--app-shadow-raised) transition-[transform,opacity] duration-200 ease-(--ease-app-out) data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0"
        {...props}
      >
        {children}
      </AlertDialogPrimitive.Popup>
    </AlertDialogPrimitive.Portal>
  );
}

function AlertDialogTitle(props: Omit<AlertDialogPrimitive.Title.Props, "className">) {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className="text-lg font-bold text-app-text"
      {...props}
    />
  );
}

function AlertDialogDescription(props: Omit<AlertDialogPrimitive.Description.Props, "className">) {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className="mt-2 text-sm text-app-text-muted"
      {...props}
    />
  );
}

function AlertDialogClose(props: AlertDialogPrimitive.Close.Props) {
  return <AlertDialogPrimitive.Close data-slot="alert-dialog-close" {...props} />;
}

function AlertDialogFooter(props: Omit<React.HTMLAttributes<HTMLDivElement>, "className">) {
  return <div data-slot="alert-dialog-footer" className="mt-6 flex justify-end gap-3" {...props} />;
}

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogPortal,
  AlertDialogBackdrop,
  AlertDialogPopup,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogClose,
  AlertDialogFooter,
};
