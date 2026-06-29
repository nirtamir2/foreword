import type * as React from "react";

function Table(props: Omit<React.ComponentProps<"table">, "className">) {
  return (
    <div data-slot="table-container" className="relative w-full overflow-x-auto">
      <table data-slot="table" className="w-full caption-bottom text-xs" {...props} />
    </div>
  );
}

function TableHeader(props: Omit<React.ComponentProps<"thead">, "className">) {
  return <thead data-slot="table-header" className="[&_tr]:border-b" {...props} />;
}

function TableBody(props: Omit<React.ComponentProps<"tbody">, "className">) {
  return <tbody data-slot="table-body" className="[&_tr:last-child]:border-0" {...props} />;
}

function TableFooter(props: Omit<React.ComponentProps<"tfoot">, "className">) {
  return (
    <tfoot
      data-slot="table-footer"
      className="border-t bg-muted/50 font-medium [&>tr]:last:border-b-0"
      {...props}
    />
  );
}

function TableRow(props: Omit<React.ComponentProps<"tr">, "className">) {
  return (
    <tr
      data-slot="table-row"
      className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
      {...props}
    />
  );
}

function TableHead(props: Omit<React.ComponentProps<"th">, "className">) {
  return (
    <th
      data-slot="table-head"
      className="h-10 px-2 text-start align-middle font-medium whitespace-nowrap text-foreground [&:has([role=checkbox])]:pr-0"
      {...props}
    />
  );
}

function TableCell(props: Omit<React.ComponentProps<"td">, "className">) {
  return (
    <td
      data-slot="table-cell"
      className="p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0"
      {...props}
    />
  );
}

function TableCaption(props: Omit<React.ComponentProps<"caption">, "className">) {
  return (
    <caption data-slot="table-caption" className="mt-4 text-xs text-muted-foreground" {...props} />
  );
}

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
