import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { CheckIcon, MinusIcon } from "lucide-react";

function Checkbox(props: Omit<CheckboxPrimitive.Root.Props, "className">) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className="group/checkbox peer relative flex size-4.5 shrink-0 items-center justify-center rounded-[5px] border border-app-border-strong bg-app-surface shadow-xs transition-[border-color,background-color,box-shadow] duration-150 ease-(--ease-app-out) outline-none after:absolute after:-inset-2 hover:border-app-accent focus-visible:ring-2 focus-visible:ring-app-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-app-canvas disabled:cursor-not-allowed disabled:opacity-50 data-indeterminate:border-app-accent data-indeterminate:bg-app-accent data-indeterminate:text-app-on-accent data-checked:border-app-accent data-checked:bg-app-accent data-checked:text-app-on-accent"
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none [&>svg]:size-3.5"
      >
        <CheckIcon strokeWidth={3} className="group-data-indeterminate/checkbox:hidden" />
        <MinusIcon strokeWidth={3} className="hidden group-data-indeterminate/checkbox:block" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
