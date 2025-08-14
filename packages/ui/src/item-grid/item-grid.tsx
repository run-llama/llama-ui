

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/base/table";

// Types and config
import type {
  SortState,
  SortDirection,
  PaginationState,
  Column,
  BuiltInColumnConfig,
} from "./types";
import type {
  AgentClient,
  ExtractedData,
  FilterOperation,
  TypedAgentData,
} from "llama-cloud-services/beta/agent";
import { createBuiltInColumn, BUILT_IN_COLUMNS } from "./built-in-columns";

// Hooks
import { useItemGridData } from "./hooks/use-item-grid-data";

// Components
import { ColumnHeader } from "./components/column-header";
import { PaginationControls } from "./components/pagination-controls";

export interface ItemGridProp<T = unknown> {
  // Custom columns (displayed first)
  customColumns?: Column<T>[];
  // Built-in columns configuration
  builtInColumns?: BuiltInColumnConfig<T>;
  // Row click event
  onRowClick?: (item: TypedAgentData<ExtractedData<T>>) => void;
  // Other configurations
  useMockData?: boolean;
  defaultPageSize?: number;
  client: AgentClient<ExtractedData<T>>;
}

// Main Business Component
export function ItemGrid<T = unknown>({
  customColumns = [],
  builtInColumns = {},
  onRowClick,
  useMockData = false,
  defaultPageSize = 20,
  client,
}: ItemGridProp<T>) {
  const [paginationState, setPaginationState] = useState<PaginationState>({
    page: 0,
    size: defaultPageSize,
  });

  // Initialize sort state with default created_at desc
  const [sortState, setSortState] = useState<SortState>({
    column: "created_at",
    direction: "desc",
  });

  const [filters, setFilters] = useState<Record<string, string[]>>({});

  // Generate final columns array
  const columns = useMemo(() => {
    const finalColumns: Column<T>[] = [];

    // Add custom columns first
    finalColumns.push(...customColumns);

    // Add built-in columns in defined order
    BUILT_IN_COLUMNS.forEach(({ name }) => {
      const config = builtInColumns[name as keyof typeof builtInColumns];
      if (config !== false && config !== undefined) {
        try {
          const builtInColumn = createBuiltInColumn<T>(name, config);
          finalColumns.push(builtInColumn);
        } catch {
          // Skip disabled columns
        }
      }
    });

    return finalColumns;
  }, [customColumns, builtInColumns]);

  // Convert frontend filter state to API format
  const apiFilters = useMemo(() => {
    const result: Record<string, FilterOperation> = {};

    Object.entries(filters).forEach(([columnKey, filterValues]) => {
      if (filterValues.length > 0) {
        result[columnKey] = { includes: filterValues };
      }
    });

    return result;
  }, [filters]);

  // Convert frontend sort state to API format
  const apiSort = useMemo(() => {
    let result: string | undefined = undefined;

    if (sortState.column && sortState.direction) {
      result = `${sortState.column} ${sortState.direction}`;
    }

    return result;
  }, [sortState]);

  const { data, loading, error, totalSize, deleteItem } = useItemGridData<T>(
    paginationState,
    useMockData,
    apiFilters,
    apiSort,
    client,
  );

  // Create hooks object for passing to renderCell
  const hooks = useMemo(
    () => ({
      deleteItem,
    }),
    [deleteItem],
  );

  // Handle sorting
  const handleSort = (columnKey: string) => {
    setSortState((prev) => {
      if (prev.column === columnKey) {
        // Cycle through: asc -> desc -> null -> asc
        const newDirection: SortDirection =
          prev.direction === "asc"
            ? "desc"
            : prev.direction === "desc"
              ? null
              : "asc";
        return { column: columnKey, direction: newDirection };
      } else {
        return { column: columnKey, direction: "asc" };
      }
    });
  };

  // Handle filtering
  const handleFilterChange = (columnKey: string, values: string[]) => {
    setFilters((prev) => ({
      ...prev,
      [columnKey]: values,
    }));
  };

  // Get unique values for filtering
  const getFilterOptions = (columnKey: string): string[] => {
    const column = columns.find((col) => col.key === columnKey);
    if (!column || !column.filterable) return [];

    // Use predefined filter options if available (for enum-like fields)
    if (column.filterOptions) {
      return column.filterOptions;
    }

    // Otherwise, extract unique values from data (for dynamic fields)
    const values = data
      .map((item) => {
        const value = column.getValue(item);
        return String(value || "");
      })
      .filter(Boolean);

    return [...new Set(values)].sort() as string[];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-sm text-muted-foreground">Loading items...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <div className="text-sm text-destructive">
          Error loading items: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="rounded-md border">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={cn(
                    "font-medium",
                    column.key === "actions" && "w-15",
                  )}
                >
                  <ColumnHeader
                    column={column}
                    sortState={sortState}
                    onSort={handleSort}
                    filterOptions={getFilterOptions(column.key)}
                    selectedFilters={filters[column.key]}
                    onFilterChange={handleFilterChange}
                  />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <>
                {/* Hidden row to maintain column widths */}
                <TableRow className="sr-only">
                  {columns.map((column) => (
                    <TableCell
                      key={column.key}
                      className={column.key === "actions" ? "w-15" : undefined}
                    >
                      <div className="h-0 overflow-hidden">placeholder</div>
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No items found.
                  </TableCell>
                </TableRow>
              </>
            ) : (
              data.map((item, rowIndex) => (
                <TableRow
                  key={item.id || rowIndex}
                  className={cn(
                    "transition-colors hover:bg-muted/50",
                    onRowClick && "cursor-pointer",
                  )}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((column) => {
                    const value = column.getValue(item);
                    return (
                      <TableCell
                        key={column.key}
                        className={
                          column.key === "actions" ? "w-15" : undefined
                        }
                      >
                        {column.renderCell ? (
                          column.renderCell(value, hooks)
                        ) : (
                          <span className="text-base-foreground text-sm font-normal leading-none">
                            {String(value || "-")}
                          </span>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PaginationControls
        paginationState={paginationState}
        totalSize={totalSize}
        onPaginationChange={setPaginationState}
      />
    </div>
  );
}
