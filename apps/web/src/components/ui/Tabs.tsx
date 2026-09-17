import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";

function Tabs({
  orientation = "horizontal",
  ...props
}: Omit<TabsPrimitive.Root.Props, "className">) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className="group/tabs flex gap-3 data-[orientation=horizontal]:flex-col"
      {...props}
    />
  );
}

const tabsListVariants = cva(
  "group/tabs-list relative inline-flex w-fit max-w-full items-center justify-start overflow-x-auto text-app-text-muted group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col",
  {
    variants: {
      variant: {
        default: "h-10 gap-1 rounded-xl border border-app-border bg-app-surface-muted p-1",
        line: "h-10 gap-1 rounded-none border-b border-app-border bg-transparent",
        pills: "h-auto flex-wrap gap-1.5 bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function TabsList({
  variant = "default",
  ...props
}: Omit<TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>, "className">) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={tabsListVariants({ variant })}
      {...props}
    >
      {props.children}
      {variant === "default" ? (
        <TabsPrimitive.Indicator className="absolute top-1/2 left-0 z-0 h-[calc(100%-0.5rem)] w-(--active-tab-width) translate-x-(--active-tab-left) -translate-y-1/2 rounded-lg bg-app-surface shadow-xs transition-[translate,width] duration-200 ease-(--ease-app-out) rtl:translate-x-(--active-tab-left)" />
      ) : null}
      {variant === "line" ? (
        <TabsPrimitive.Indicator className="absolute bottom-0 left-0 z-0 h-0.5 w-(--active-tab-width) translate-x-(--active-tab-left) rounded-full bg-app-accent transition-[translate,width] duration-200 ease-(--ease-app-out)" />
      ) : null}
    </TabsPrimitive.List>
  );
}

function TabsTrigger(props: Omit<TabsPrimitive.Tab.Props, "className">) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className="relative z-10 inline-flex h-full shrink-0 items-center justify-center gap-1.5 rounded-lg border border-transparent px-3 py-1 text-sm font-medium whitespace-nowrap text-app-text-muted transition-[background-color,color,border-color,transform] duration-150 ease-(--ease-app-out) group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:justify-start group-data-[variant=line]/tabs-list:rounded-none group-data-[variant=pills]/tabs-list:h-8 group-data-[variant=pills]/tabs-list:rounded-full group-data-[variant=pills]/tabs-list:border-app-border group-data-[variant=pills]/tabs-list:bg-app-surface group-data-[variant=pills]/tabs-list:text-xs hover:text-app-text focus-visible:ring-2 focus-visible:ring-app-accent/40 focus-visible:outline-none active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 data-active:text-app-text group-data-[variant=pills]/tabs-list:data-active:border-app-ink group-data-[variant=pills]/tabs-list:data-active:bg-app-ink group-data-[variant=pills]/tabs-list:data-active:text-app-canvas [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
      {...props}
    />
  );
}

function TabsContent(props: Omit<TabsPrimitive.Panel.Props, "className">) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className="flex-1 text-sm/relaxed outline-none"
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants };
