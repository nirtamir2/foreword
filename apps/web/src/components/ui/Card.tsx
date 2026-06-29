import type * as React from "react";

function Card({
  size = "default",
  ...props
}: Omit<React.ComponentProps<"div"> & { size?: "default" | "sm" }, "className">) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className="group/card flex flex-col gap-4 overflow-hidden rounded-lg border border-app-border bg-app-surface-soft py-4 text-sm/relaxed text-app-text shadow-(--app-shadow-raised) has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:gap-2 data-[size=sm]:py-3 data-[size=sm]:has-data-[slot=card-footer]:pb-0 *:[img:first-child]:rounded-t-lg *:[img:last-child]:rounded-b-lg"
      {...props}
    />
  );
}

function CardHeader(props: Omit<React.ComponentProps<"div">, "className">) {
  return (
    <div
      data-slot="card-header"
      className="group/card-header @container/card-header grid auto-rows-min items-start gap-1 px-4 group-data-[size=sm]/card:px-3 has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-4 group-data-[size=sm]/card:[.border-b]:pb-3"
      {...props}
    />
  );
}

function CardTitle(props: Omit<React.ComponentProps<"div">, "className">) {
  return (
    <div
      data-slot="card-title"
      className="text-sm font-semibold text-app-text group-data-[size=sm]/card:text-sm"
      {...props}
    />
  );
}

function CardDescription(props: Omit<React.ComponentProps<"div">, "className">) {
  return (
    <div data-slot="card-description" className="text-xs/relaxed text-app-text-muted" {...props} />
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
    <div data-slot="card-content" className="px-4 group-data-[size=sm]/card:px-3" {...props} />
  );
}

function CardFooter(props: Omit<React.ComponentProps<"div">, "className">) {
  return (
    <div
      data-slot="card-footer"
      className="flex items-center border-t border-app-border p-4 group-data-[size=sm]/card:p-3"
      {...props}
    />
  );
}

export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent };
