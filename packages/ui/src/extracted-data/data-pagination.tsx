import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/base/pagination";
import { cn } from "@/lib";
import { Dispatch, SetStateAction } from "react";

export function paginate<T>({
  items,
  currentPage,
  perPage,
}: {
  items: T[];
  currentPage: number;
  perPage: number;
}): Array<{ item: T; index: number }> {
  const start = (currentPage - 1) * perPage;
  return items.slice(start, start + perPage).map((item, offset) => ({
    item,
    index: start + offset,
  }));
}

export function DataPagination({
  currentPage,
  setCurrentPage,
  totalItems,
  perPage,
  className,
}: {
  currentPage: number;
  setCurrentPage: Dispatch<SetStateAction<number>>;
  totalItems: number;
  perPage: number;
  className?: string;
}) {
  const totalPages = Math.ceil(totalItems / perPage);
  const shouldShowPagination = totalItems > perPage;

  if (!shouldShowPagination) return null;

  return (
    <Pagination className={cn("justify-end p-2", className)}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            className={cn(
              "cursor-pointer",
              currentPage === 1 && "pointer-events-none opacity-50"
            )}
          />
        </PaginationItem>
        <span className="text-sm text-muted-foreground mx-2">
          Page {currentPage} / {totalPages} - {totalItems} items
        </span>
        <PaginationItem>
          <PaginationNext
            onClick={() =>
              setCurrentPage(Math.min(totalPages, currentPage + 1))
            }
            className={cn(
              "cursor-pointer",
              currentPage === totalPages && "pointer-events-none opacity-50"
            )}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
