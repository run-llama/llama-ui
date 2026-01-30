import type { Table } from "@tanstack/react-table";
import { Button } from "../button";

export type PaginationProps<T> = {
  table: Table<T>;
  totalRows: number;
  selectedCount?: number;
};

export function Pagination<T>({
  table,
  totalRows = 0,
  selectedCount = 0,
}: PaginationProps<T>) {
  const canPreviousPage = table.getCanPreviousPage();
  const canNextPage = table.getCanNextPage();

  return (
    <div className="flex w-full items-center justify-between py-4">
      <p className="text-sm text-muted-foreground">
        {selectedCount} of {totalRows} row(s) selected.
      </p>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => table.previousPage()}
          disabled={!canPreviousPage}
          label="Previous"
        />
        <Button
          size="sm"
          variant="outline"
          onClick={() => table.nextPage()}
          disabled={!canNextPage}
          label="Next"
        />
      </div>
    </div>
  );
}
