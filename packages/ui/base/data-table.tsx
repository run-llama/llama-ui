"use client";

import type {
  Column,
  ColumnDef,
  OnChangeFn,
  PaginationState,
  Row,
  RowSelectionState,
  SortingState,
} from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import * as React from "react";
import type { MouseEvent, ReactNode } from "react";
import { Suspense, useCallback, useMemo, useRef, useState } from "react";
import { Button } from "./button";
import { LoadingStatus } from "./loading";
import {
  Table,
  TableBody,
  CustomTableCell,
  tableHeadVariants,
  TableHeader,
  TableRow,
} from "./table";
import { Pagination } from "./table/pagination";

/**
 * DataTableColumnHeader - A sortable header component for DataTable columns.
 *
 * Usage in column definitions:
 * ```tsx
 * {
 *   accessorKey: "email",
 *   header: ({ column }) => (
 *     <DataTableColumnHeader column={column} title="Email" />
 *   ),
 * }
 * ```
 */
interface DataTableColumnHeaderProps<TData, TValue> {
  column: Column<TData, TValue>;
  title: string;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div>{title}</div>;
  }

  const sorted = column.getIsSorted();

  return (
    <Button
      variant="ghost"
      label={title}
      endIcon={
        sorted === "asc" ? (
          <ArrowUp className="size-4" />
        ) : sorted === "desc" ? (
          <ArrowDown className="size-4" />
        ) : (
          <ArrowUpDown className="size-4 opacity-30" />
        )
      }
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    />
  );
}

export type ManualPaginationProps = {
  pageIndex: number;
  pageSize: number;
  rowCount: number;
  onChange: OnChangeFn<PaginationState>;
};

interface BaseDataTableProps<TData> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<TData, any>[];
  data: TData[];
  getDataId: (row: TData) => string;
  hiddenColumns?: string[];
  onRowClick?: (event: MouseEvent<HTMLTableRowElement>) => void;
  empty?: ReactNode;
  isLoading?: boolean;
  pagination?: boolean;
  manualPaginationProps?: Partial<ManualPaginationProps>;
}

interface DataTablePropsSelectable<TData> extends BaseDataTableProps<TData> {
  rowSelection: Record<string, boolean>;
  onRowSelectionChange: OnChangeFn<RowSelectionState>;
  enableExpanding?: never;
  getSubRows?: never;
  expandDefault?: never;
}

interface DataTablePropsNonSelectable<TData> extends BaseDataTableProps<TData> {
  rowSelection?: false;
  onRowSelectionChange?: never;
  enableExpanding?: never;
  getSubRows?: never;
  expandDefault?: never;
}

interface DataTablePropsExpandable<TData> extends BaseDataTableProps<TData> {
  rowSelection?: false;
  onRowSelectionChange?: never;
  enableExpanding: true;
  expandDefault?: boolean;
  getSubRows: (row: TData, index: number) => TData[] | undefined;
}

export type DataTableProps<TData> =
  | DataTablePropsSelectable<TData>
  | DataTablePropsNonSelectable<TData>
  | DataTablePropsExpandable<TData>;

const emptyRowSelection = {};

const dateRegex =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/;

function useCompareFn(key: string) {
  return useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (a: Row<any>, b: Row<any>) => {
      const valueA = a.getValue(key);
      const valueB = b.getValue(key);
      if (valueA instanceof Date && valueB instanceof Date) {
        return valueA.getTime() - valueB.getTime();
      } else if (
        typeof valueA === "string" &&
        typeof valueB === "string" &&
        dateRegex.test(valueA) &&
        dateRegex.test(valueB)
      ) {
        return new Date(valueA).getTime() - new Date(valueB).getTime();
      } else if (typeof valueA === "string" && typeof valueB === "string") {
        return valueA.localeCompare(valueB);
      } else if (typeof valueA === "number" && typeof valueB === "number") {
        return valueA - valueB;
      } else if (typeof valueA === "boolean" && typeof valueB === "boolean") {
        return valueA === valueB ? 0 : valueA ? 1 : -1;
      } else {
        return 0;
      }
    },
    [key],
  );
}

export const getRowId = (row: { id: string }) => row.id;

export function DataTable<TData>({
  columns,
  data,
  hiddenColumns,
  rowSelection,
  onRowSelectionChange,
  onRowClick,
  enableExpanding,
  getSubRows,
  expandDefault,
  empty,
  isLoading = false,
  manualPaginationProps,
  pagination,
  ...props
}: DataTableProps<TData>) {
  const { getDataId, ...restProps } = props;
  const [sorting, setSorting] = useState<SortingState>([]);
  const [page, setPage] = useState<PaginationState>({
    pageIndex: manualPaginationProps?.pageIndex ?? 0,
    pageSize: manualPaginationProps?.pageSize ?? 10,
  });
  const memoizedColumns = useMemo(() => {
    if (!rowSelection) {
      return columns.filter((column) => column.id !== "select");
    }
    return columns;
  }, [columns, rowSelection]);

  const onPaginationChange: OnChangeFn<PaginationState> = useCallback(
    (updater) => {
      setPage((prevPage) => {
        const newState =
          typeof updater === "function" ? updater(prevPage) : updater;
        manualPaginationProps?.onChange?.(newState);
        return newState;
      });
    },
    [manualPaginationProps],
  );

  const initialVisibility = {};
  const columnVisibility = hiddenColumns
    ? hiddenColumns.reduce(
        (acc, columnId) => ({
          ...acc,
          [columnId]: false,
        }),
        initialVisibility,
      )
    : {};

  const table = useReactTable<TData>({
    data,
    columns: memoizedColumns,
    enableExpanding,
    getSubRows,
    getRowId: getDataId,
    getExpandedRowModel: getExpandedRowModel(),
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    enableRowSelection: !!rowSelection,
    ...(pagination
      ? {
          getPaginationRowModel: getPaginationRowModel(),
          onPaginationChange,
        }
      : {}),
    sortingFns: {
      created_at: useCompareFn("created_at"),
      updated_at: useCompareFn("updated_at"),
    },
    state: {
      rowSelection: rowSelection || emptyRowSelection,
      sorting,
      columnVisibility,
      ...(pagination ? { pagination: page } : {}),
    },
    manualPagination: !!manualPaginationProps,
    rowCount: manualPaginationProps?.rowCount,
    onRowSelectionChange,
  });

  const onceRef = useRef(false);
  if (expandDefault && !onceRef.current) {
    table.toggleAllRowsExpanded(true);
    onceRef.current = true;
  }

  if (isLoading) {
    return (
      <div className="flex flex-col" {...restProps}>
        <div className="flex h-64 items-center justify-center rounded-md border bg-background">
          <LoadingStatus />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col" {...restProps}>
      <div className="rounded-md border border-slate-200 bg-white">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={`${headerGroup.id}-${JSON.stringify(sorting)}`}>
                {headerGroup.headers.map((header) => {
                  return (
                    <th
                      key={header.id}
                      className={tableHeadVariants({ alignment: "left" })}
                    >
                      <div>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </div>
                    </th>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  data-row-id={row.id}
                  onClick={onRowClick}
                  state="hover"
                  style={{ cursor: onRowClick ? "pointer" : undefined }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <CustomTableCell
                      key={cell.id}
                      style={{
                        width: cell.column.columnDef.size
                          ? `${cell.column.columnDef.size}`
                          : `100%`,
                      }}
                    >
                      <Suspense fallback={<LoadingStatus />}>
                        {flexRender(cell.column.columnDef.cell, {
                          ...cell.getContext(),
                          id: cell.id,
                        })}
                      </Suspense>
                    </CustomTableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <CustomTableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {empty ?? "No results."}
                </CustomTableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {pagination && (
        <Pagination
          table={table}
          totalRows={data.length}
          selectedCount={rowSelection ? Object.keys(rowSelection).length : 0}
        />
      )}
    </div>
  );
}
