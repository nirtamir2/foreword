import { ArrowUpDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { m } from "@/paraglide/messages.js";

export type KnowledgeFilter = "TO_LEARN" | "NEW" | "LEARNING" | "KNOWN" | "ALL";
export type CardSort = "priority" | "alphabetical" | "recent";

export const CARD_SORTS: ReadonlyArray<CardSort> = ["priority", "alphabetical", "recent"];

export function sortLabel({ sort }: { sort: CardSort }): string {
  switch (sort) {
    case "priority": {
      return m.sort_priority();
    }
    case "alphabetical": {
      return m.sort_alphabetical();
    }
    case "recent": {
      return m.sort_recent();
    }
  }
}

interface FilterOption {
  value: KnowledgeFilter;
  label: string;
  count: number;
}

interface Props {
  filter: KnowledgeFilter;
  filters: ReadonlyArray<FilterOption>;
  onFilterChange: (filter: KnowledgeFilter) => void;
  sort: CardSort;
  onSortChange: (sort: CardSort) => void;
}

export function VocabularyToolbar({ filter, filters, onFilterChange, sort, onSortChange }: Props) {
  const sortLabels = Object.fromEntries(
    CARD_SORTS.map((value) => [value, sortLabel({ sort: value })]),
  );

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Tabs
        value={filter}
        onValueChange={(value) => {
          onFilterChange(value as KnowledgeFilter);
        }}
      >
        <TabsList variant="pills" aria-label={m.filter_label()}>
          {filters.map((option) => (
            <TabsTrigger key={option.value} value={option.value}>
              {option.label}
              <span className="rounded-full bg-app-surface-muted px-1.5 font-mono text-[0.6875rem] text-app-text-muted group-data-[variant=pills]/tabs-list:data-active:bg-white/15 group-data-[variant=pills]/tabs-list:data-active:text-app-canvas">
                {option.count}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Select
        items={sortLabels}
        value={sort}
        onValueChange={(value) => {
          if (value != null) {
            onSortChange(value as CardSort);
          }
        }}
      >
        <SelectTrigger variant="compact" size="sm" aria-label={m.sort_label()}>
          <ArrowUpDown className="size-3.5 text-app-text-subtle" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          {CARD_SORTS.map((value) => (
            <SelectItem key={value} value={value}>
              {sortLabels[value]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
