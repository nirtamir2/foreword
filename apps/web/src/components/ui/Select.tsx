import type * as React from "react";
import { Select as SelectPrimitive } from "@base-ui/react/select";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";

const selectTriggerVariants = cva(
  "flex items-center justify-between gap-1.5 whitespace-nowrap transition-[border-color,background-color,box-shadow,color,transform] duration-150 ease-(--ease-app-out) outline-none select-none active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-1.5 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "w-fit rounded-lg border border-app-border bg-app-surface py-2 ps-3 pe-2 text-sm text-app-text shadow-xs hover:border-app-border-strong focus-visible:border-app-accent focus-visible:ring-3 focus-visible:ring-app-accent/20 aria-invalid:border-app-red aria-invalid:ring-3 aria-invalid:ring-app-red/20 data-placeholder:text-app-text-subtle",
        full: "w-full cursor-pointer appearance-none rounded-lg border border-app-border bg-app-surface ps-3 pe-2 text-sm text-app-text shadow-xs hover:border-app-border-strong focus-visible:border-app-accent focus-visible:ring-3 focus-visible:ring-app-accent/20 data-placeholder:text-app-text-subtle",
        compact:
          "rounded-lg border border-app-border bg-app-surface py-1.5 ps-3 pe-1.5 text-xs font-medium text-app-text shadow-xs hover:border-app-border-strong focus-visible:border-app-accent focus-visible:ring-3 focus-visible:ring-app-accent/20",
      },
      size: {
        sm: "h-8 rounded-md",
        default: "h-10",
        md: "h-11",
        lg: "h-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const Select = SelectPrimitive.Root;

function SelectGroup(props: Omit<SelectPrimitive.Group.Props, "className">) {
  return <SelectPrimitive.Group data-slot="select-group" className="scroll-my-1" {...props} />;
}

function SelectValue(props: Omit<SelectPrimitive.Value.Props, "className">) {
  return (
    <SelectPrimitive.Value data-slot="select-value" className="flex flex-1 text-start" {...props} />
  );
}

function SelectTrigger({
  variant,
  size,
  children,
  ...props
}: Omit<SelectPrimitive.Trigger.Props, "className"> & VariantProps<typeof selectTriggerVariants>) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      className={selectTriggerVariants({ variant, size })}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon
        render={<ChevronDownIcon className="pointer-events-none size-4 text-app-text-subtle" />}
      />
    </SelectPrimitive.Trigger>
  );
}

type SelectContentProps = Omit<
  SelectPrimitive.Popup.Props &
    Pick<
      SelectPrimitive.Positioner.Props,
      "align" | "alignOffset" | "side" | "sideOffset" | "alignItemWithTrigger"
    >,
  "className"
> & {
  header?: React.ReactNode;
};

function SelectContent({
  children,
  header = null,
  side = "bottom",
  sideOffset = 6,
  align = "start",
  alignOffset = 0,
  alignItemWithTrigger = false,
  ...props
}: SelectContentProps) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        alignItemWithTrigger={alignItemWithTrigger}
        className="isolate z-50"
      >
        <SelectPrimitive.Popup
          data-slot="select-content"
          data-align-trigger={alignItemWithTrigger}
          className="relative isolate z-50 max-h-(--available-height) w-(--anchor-width) min-w-40 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-xl border border-app-border bg-app-surface-raised p-1 text-app-text shadow-(--app-shadow-floating) duration-150 ease-(--ease-app-out) data-[align-trigger=true]:animate-none data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
          {...props}
        >
          {header == null ? null : (
            <div className="sticky top-0 z-10 bg-app-surface-raised pb-1">{header}</div>
          )}
          <SelectScrollUpButton />
          <SelectPrimitive.List>{children}</SelectPrimitive.List>
          <SelectScrollDownButton />
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  );
}

function SelectLabel(props: Omit<SelectPrimitive.GroupLabel.Props, "className">) {
  return (
    <SelectPrimitive.GroupLabel
      data-slot="select-label"
      className="p-2 text-xs font-semibold tracking-wide text-app-text-subtle uppercase"
      {...props}
    />
  );
}

function SelectItem({ children, ...props }: Omit<SelectPrimitive.Item.Props, "className">) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className="relative flex w-full cursor-default items-center gap-2 rounded-lg py-2 ps-2.5 pe-8 text-sm text-app-text-muted outline-hidden select-none focus:bg-app-surface-muted focus:text-app-text data-selected:text-app-text data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
      {...props}
    >
      <SelectPrimitive.ItemText className="flex flex-1 shrink-0 gap-2 whitespace-nowrap">
        {children}
      </SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator
        render={
          <span className="pointer-events-none absolute inset-e-2 flex size-4 items-center justify-center text-app-accent" />
        }
      >
        <CheckIcon className="pointer-events-none" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}

function SelectSeparator(props: Omit<SelectPrimitive.Separator.Props, "className">) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className="pointer-events-none -mx-1 my-1 h-px bg-app-border"
      {...props}
    />
  );
}

function SelectScrollUpButton(
  props: Omit<React.ComponentProps<typeof SelectPrimitive.ScrollUpArrow>, "className">,
) {
  return (
    <SelectPrimitive.ScrollUpArrow
      data-slot="select-scroll-up-button"
      className="top-0 z-10 flex w-full cursor-default items-center justify-center bg-transparent py-1 text-app-text-muted [&_svg:not([class*='size-'])]:size-4"
      {...props}
    >
      <ChevronUpIcon />
    </SelectPrimitive.ScrollUpArrow>
  );
}

function SelectScrollDownButton(
  props: Omit<React.ComponentProps<typeof SelectPrimitive.ScrollDownArrow>, "className">,
) {
  return (
    <SelectPrimitive.ScrollDownArrow
      data-slot="select-scroll-down-button"
      className="bottom-0 z-10 flex w-full cursor-default items-center justify-center bg-transparent py-1 text-app-text-muted [&_svg:not([class*='size-'])]:size-4"
      {...props}
    >
      <ChevronDownIcon />
    </SelectPrimitive.ScrollDownArrow>
  );
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
