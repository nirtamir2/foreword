import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import type { ToasterProps } from "sonner";
import { Toaster as Sonner } from "sonner";
import { getTextDirection } from "@/paraglide/runtime.js";

export const Toaster = (props: Omit<ToasterProps, "className">) => {
  return (
    <Sonner
      theme="light"
      dir={getTextDirection()}
      position="bottom-center"
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      className="group"
      style={
        {
          "--normal-bg": "var(--app-surface-raised)",
          "--normal-text": "var(--app-text)",
          "--normal-border": "var(--app-border)",
          "--border-radius": "0.875rem",
          "--success-bg": "var(--app-success-soft)",
          "--success-text": "var(--app-success)",
          "--success-border": "var(--app-success-soft)",
          "--error-bg": "var(--app-red-soft)",
          "--error-text": "var(--app-red)",
          "--error-border": "var(--app-red-soft)",
          "--warning-bg": "var(--app-warning-soft)",
          "--warning-text": "var(--app-warning)",
          "--warning-border": "var(--app-warning-soft)",
          "--info-bg": "var(--app-accent-soft)",
          "--info-text": "var(--app-accent-strong)",
          "--info-border": "var(--app-accent-soft)",
        } as React.CSSProperties
      }
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      {...props}
    />
  );
};
