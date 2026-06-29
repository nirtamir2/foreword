"use client";

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
      className="group/tabs flex gap-2 data-[orientation=horizontal]:flex-col"
      {...props}
    />
  );
}

const tabsListVariants = cva(
  "group/tabs-list inline-flex w-fit items-center justify-center rounded-xl p-1 text-app-text-muted group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col group-data-horizontal/tabs:h-10 data-[variant=line]:rounded-none",
  {
    variants: {
      variant: {
        default: "border border-app-border bg-app-surface-soft",
        line: "gap-1 bg-transparent",
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
    />
  );
}

function TabsTrigger(props: Omit<TabsPrimitive.Tab.Props, "className">) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className="relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-lg border border-transparent px-3 py-1 text-xs font-semibold whitespace-nowrap text-app-text-muted transition-[background-color,color,border-color,transform] duration-150 ease-(--ease-app-out) group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:justify-start group-data-[variant=line]/tabs-list:bg-transparent group-data-vertical/tabs:py-[calc(--spacing(1.25))] after:absolute after:bg-app-accent after:opacity-0 after:transition-opacity group-data-[orientation=horizontal]/tabs:after:inset-x-0 group-data-[orientation=horizontal]/tabs:after:bottom-[-5px] group-data-[orientation=horizontal]/tabs:after:h-0.5 group-data-[orientation=vertical]/tabs:after:inset-y-0 group-data-[orientation=vertical]/tabs:after:-right-1 group-data-[orientation=vertical]/tabs:after:w-0.5 hover:text-app-text focus-visible:ring-2 focus-visible:ring-app-accent/50 focus-visible:outline-none active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-active:bg-app-accent data-active:text-app-canvas group-data-[variant=line]/tabs-list:data-active:bg-transparent group-data-[variant=line]/tabs-list:data-active:text-app-text group-data-[variant=line]/tabs-list:data-active:after:opacity-100 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
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
