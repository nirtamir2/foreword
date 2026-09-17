import type * as React from "react";

function Table(props: Omit<React.ComponentProps<"table">, "className">) {
  return (
    <div data-slot="table-container" className="relative w-full overflow-x-auto">
      <table data-slot="table" className="w-full caption-bottom text-sm" {...props} />
    </div>
  );
}

function TableHeader(props: Omit<React.ComponentProps<"thead">, "className">) {
  return (
    <thead
      data-slot="table-header"
      className="bg-app-surface-soft/70 [&_tr]:border-b [&_tr]:border-app-border"
      {...props}
    />
  );
}

function TableBody(props: Omit<React.ComponentProps<"tbody">, "className">) {
  return <tbody data-slot="table-body" className="[&_tr:last-child]:border-0" {...props} />;
}

function TableFooter(props: Omit<React.ComponentProps<"tfoot">, "className">) {
  return (
    <tfoot
      data-slot="table-footer"
      className="border-t border-app-border bg-app-surface-soft font-medium [&>tr]:last:border-b-0"
      {...props}
    />
  );
}

function TableRow(props: Omit<React.ComponentProps<"tr">, "className">) {
  return (
    <tr
      data-slot="table-row"
      className="border-b border-app-border transition-colors hover:bg-app-surface-soft/70 data-[state=selected]:bg-app-accent-soft/60"
      {...props}
    />
  );
}

function TableHead(props: Omit<React.ComponentProps<"th">, "className">) {
  return (
    <th
      data-slot="table-head"
      className="h-10 px-3 text-start align-middle text-xs font-semibold tracking-wide whitespace-nowrap text-app-text-subtle uppercase [&:has([role=checkbox])]:pe-0"
      {...props}
    />
  );
}

function TableCell(props: Omit<React.ComponentProps<"td">, "className">) {
  return (
    <td data-slot="table-cell" className="p-3 align-top [&:has([role=checkbox])]:pe-0" {...props} />
  );
}

function TableCaption(props: Omit<React.ComponentProps<"caption">, "className">) {
  return (
    <caption data-slot="table-caption" className="pt-4 text-xs text-app-text-subtle" {...props} />
  );
}

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
