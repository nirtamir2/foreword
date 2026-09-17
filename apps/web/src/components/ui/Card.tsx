import type * as React from "react";
import { clsx } from "clsx";

type CardTone = "default" | "soft" | "accent" | "paper";

function Card({
  size = "default",
  tone = "default",
  ...props
}: Omit<
  React.ComponentProps<"div"> & { size?: "default" | "sm" | "lg"; tone?: CardTone },
  "className"
>) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={clsx(
        "group/card flex flex-col gap-4 overflow-hidden rounded-2xl border text-sm/relaxed text-app-text has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=default]:py-5 data-[size=lg]:gap-6 data-[size=lg]:py-6 data-[size=sm]:gap-2 data-[size=sm]:py-3",
        tone === "default" && "border-app-border bg-app-surface shadow-(--app-shadow-raised)",
        tone === "soft" && "border-app-border bg-app-surface-soft",
        tone === "accent" && "border-app-accent/15 bg-app-accent-soft",
        tone === "paper" && "border-app-border bg-app-paper",
      )}
      {...props}
    />
  );
}

function CardHeader(props: Omit<React.ComponentProps<"div">, "className">) {
  return (
    <div
      data-slot="card-header"
      className="group/card-header @container/card-header grid auto-rows-min items-start gap-1.5 px-5 group-data-[size=lg]/card:px-6 group-data-[size=sm]/card:px-3 has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto]"
      {...props}
    />
  );
}

function CardTitle(props: Omit<React.ComponentProps<"div">, "className">) {
  return (
    <div
      data-slot="card-title"
      className="text-base font-semibold tracking-tight text-app-text group-data-[size=sm]/card:text-sm"
      {...props}
    />
  );
}

function CardDescription(props: Omit<React.ComponentProps<"div">, "className">) {
  return (
    <div data-slot="card-description" className="text-sm/relaxed text-app-text-muted" {...props} />
  );
}

function CardAction(props: Omit<React.ComponentProps<"div">, "className">) {
  return (
    <div
      data-slot="card-action"
      className="col-start-2 row-span-2 row-start-1 self-start justify-self-end"
      {...props}
    />
  );
}

function CardContent(props: Omit<React.ComponentProps<"div">, "className">) {
  return (
    <div
      data-slot="card-content"
      className="px-5 group-data-[size=lg]/card:px-6 group-data-[size=sm]/card:px-3"
      {...props}
    />
  );
}

function CardFooter(props: Omit<React.ComponentProps<"div">, "className">) {
  return (
    <div
      data-slot="card-footer"
      className="flex items-center border-t border-app-border bg-app-surface-soft/60 p-4 group-data-[size=lg]/card:px-6 group-data-[size=sm]/card:p-3"
      {...props}
    />
  );
}

export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent };
