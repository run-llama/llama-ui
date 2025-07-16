import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ColumnFilter } from "@/components/ui/column-filter";
import type { Column, SortState } from "../types";

export function ColumnHeader<T = unknown>({
  column,
  sortState,
  onSort,
  filterOptions,
  selectedFilters,
  onFilterChange,
}: {
  column: Column<T>;
  sortState?: SortState;
  onSort?: (columnKey: string) => void;
  filterOptions?: string[];
  selectedFilters?: string[];
  onFilterChange?: (columnKey: string, values: string[]) => void;
}) {
  const sortKey = column.sortKey ?? column.key;
  const sortDirection =
    sortState?.column === sortKey ? sortState.direction : null;

  return (
    <div className="flex items-center">
      <div
        className={cn(
          "flex items-center justify-center space-x-1",
          column.sortable && "cursor-pointer hover:text-primary",
        )}
        onClick={() => column.sortable && onSort?.(sortKey)}
      >
        <span className="text-base-muted-foreground text-sm font-medium">
          {column.header}
        </span>
        {column.sortable && (
          <div className="flex flex-col">
            {sortDirection === "asc" ? (
              <ArrowDown size={16} />
            ) : sortDirection === "desc" ? (
              <ArrowUp size={16} />
            ) : (
              <ArrowUpDown size={16} className="opacity-40" />
            )}
          </div>
        )}
      </div>

      {filterOptions && filterOptions.length > 0 && (
        <ColumnFilter
          options={filterOptions}
          selectedValues={selectedFilters || []}
          onFilterChange={(values) => onFilterChange?.(column.key, values)}
        />
      )}
    </div>
  );
}
