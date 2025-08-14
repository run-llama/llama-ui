import { cn } from "@/lib/utils";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/base/pagination";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/base/dropdown-menu";
import type { PaginationState } from "../types";

interface PaginationControlsProps {
  paginationState: PaginationState;
  totalSize: number;
  onPaginationChange: (state: PaginationState) => void;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export function PaginationControls({
  paginationState,
  totalSize,
  onPaginationChange,
}: PaginationControlsProps) {
  const { page, size } = paginationState;
  const totalPages = Math.max(1, Math.ceil(totalSize / size));

  // 页码渲染逻辑（最多显示5个页码，超出用...省略）
  function getPageNumbers() {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i);
    if (page <= 2) return [0, 1, 2, -1, totalPages - 1];
    if (page >= totalPages - 3)
      return [0, -1, totalPages - 3, totalPages - 2, totalPages - 1];
    return [0, -1, page, -1, totalPages - 1];
  }

  return (
    <Pagination>
      <PaginationContent className="flex w-full items-center justify-between">
        {/* Rows per page dropdown (left) */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-base-foreground">Rows per page</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="border rounded px-2 py-1 text-sm min-w-[48px] text-left focus:outline-none cursor-pointer">
                {size}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {PAGE_SIZE_OPTIONS.map((option) => (
                <DropdownMenuItem
                  key={option}
                  onClick={() => onPaginationChange({ page: 0, size: option })}
                  className={cn(
                    "cursor-pointer px-2 py-1 text-sm",
                    size === option && "bg-accent font-bold text-primary"
                  )}
                >
                  {option}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {/* Page navigation (right) */}
        <div className="flex items-center gap-1">
          <PaginationItem>
            <PaginationPrevious
              onClick={() =>
                page > 0 &&
                onPaginationChange({ ...paginationState, page: page - 1 })
              }
              className={cn(
                page === 0 && "pointer-events-none opacity-50",
                "text-base-foreground",
                "cursor-pointer"
              )}
            />
          </PaginationItem>
          {getPageNumbers().map((num, idx) =>
            num === -1 ? (
              <PaginationItem key={"ellipsis-" + idx}>
                <span className="px-2 text-base-foreground text-xs">...</span>
              </PaginationItem>
            ) : (
              <PaginationItem key={num}>
                <PaginationLink
                  isActive={page === num}
                  onClick={() =>
                    onPaginationChange({ ...paginationState, page: num })
                  }
                  className={cn(
                    "text-base-foreground",
                    "size-7",
                    "cursor-pointer"
                  )}
                >
                  {num + 1}
                </PaginationLink>
              </PaginationItem>
            )
          )}
          <PaginationItem>
            <PaginationNext
              onClick={() =>
                page < totalPages - 1 &&
                onPaginationChange({ ...paginationState, page: page + 1 })
              }
              className={cn(
                page >= totalPages - 1 && "pointer-events-none opacity-50",
                "text-base-foreground",
                "cursor-pointer"
              )}
            />
          </PaginationItem>
        </div>
      </PaginationContent>
    </Pagination>
  );
}
