"use client";

import { logger } from "@shared/logger";
import { Loader2, TriangleAlert } from "lucide-react";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { Button } from "@/base/button";
import { cn } from "@/lib/utils";
import { FileToolbar } from "../file-tool-bar";

type SheetRow = Array<string | number | boolean | Date | null>;

type SheetData = {
  name: string;
  rows: SheetRow[];
};

export interface SheetPreviewProps {
  fileName?: string | null;
  contentUrl: string;
  onRemove?: () => void;
  className?: string;
}

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const columnIndexToLabel = (index: number) => {
  let n = index + 1;
  let label = "";
  while (n > 0) {
    const remainder = (n - 1) % 26;
    label = `${LETTERS[remainder]}${label}`;
    n = Math.floor((n - 1) / 26);
  }
  return label;
};

const formatCellValue = (value: SheetRow[number]): string => {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toLocaleString();
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  return String(value);
};

const downloadFile = (url: string, fileName?: string | null) => {
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  if (fileName) {
    link.download = fileName;
  }
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export function SheetPreview({
  fileName,
  contentUrl,
  onRemove,
  className,
}: SheetPreviewProps) {
  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [activeSheetIndex, setActiveSheetIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    let isMounted = true;

    const loadWorkbook = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(contentUrl);
        if (!response.ok) {
          throw new Error(
            `Failed to fetch XLSX file (status ${response.status})`
          );
        }
        const arrayBuffer = await response.arrayBuffer();
        const XLSX = await import("xlsx");
        const workbook = XLSX.read(arrayBuffer, { type: "array" });

        const parsedSheets: SheetData[] = workbook.SheetNames.map((name) => {
          const sheet = workbook.Sheets[name];
          if (!sheet) {
            return {
              name,
              rows: [],
            };
          }
          const rows = XLSX.utils.sheet_to_json<SheetRow>(sheet, {
            header: 1,
            raw: false,
            defval: "",
            blankrows: false,
          });
          return {
            name,
            rows,
          };
        });

        if (!parsedSheets.length) {
          parsedSheets.push({
            name: "Sheet1",
            rows: [],
          });
        }

        if (isMounted) {
          setSheets(parsedSheets);
          setActiveSheetIndex(0);
        }
      } catch (err) {
        if (isMounted) {
          logger.error("[XlsxPreview] Failed to load workbook", err);
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load spreadsheet preview."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadWorkbook();

    return () => {
      isMounted = false;
    };
  }, [contentUrl]);

  const activeSheet = sheets[activeSheetIndex];

  const columnCount = useMemo(() => {
    if (!activeSheet?.rows?.length) return 0;
    return activeSheet.rows.reduce(
      (count, row) => Math.max(count, row.length),
      0
    );
  }, [activeSheet]);

  const handleScaleChange = (newScale: number) => {
    setScale(newScale);
  };

  const sheetTabs = sheets.map((sheet, index) => (
    <button
      key={sheet.name}
      type="button"
      className={cn(
        "rounded-md border px-3 py-1 text-xs transition-colors",
        index === activeSheetIndex
          ? "bg-primary/10 border-primary text-primary"
          : "hover:bg-muted/80 border-border bg-muted text-muted-foreground"
      )}
      onClick={() => setActiveSheetIndex(index)}
    >
      {sheet.name}
    </button>
  ));

  return (
    <div className={cn("relative flex h-full flex-col", className)}>
      <FileToolbar
        fileName={fileName}
        onDownload={() => downloadFile(contentUrl, fileName)}
        scale={scale}
        onScaleChange={handleScaleChange}
        onRemove={onRemove}
        isOverlay
      />
      {sheets.length > 1 && (
        <div className="flex items-center justify-between gap-2 border-b px-4 py-2">
          <div className="flex flex-wrap gap-2">{sheetTabs}</div>
        </div>
      )}
      <div className="relative flex-1 overflow-auto bg-gray-50">
        {loading ? (
          <LoadingState>Loading spreadsheet…</LoadingState>
        ) : error ? (
          <ErrorState onDownload={() => downloadFile(contentUrl, fileName)}>
            {error}
          </ErrorState>
        ) : !activeSheet || columnCount === 0 ? (
          <EmptyState onDownload={() => downloadFile(contentUrl, fileName)} />
        ) : (
          <div
            className="inline-block origin-top-left p-4"
            style={{ transform: `scale(${scale})` }}
          >
            <table className="border-collapse rounded-md bg-white text-xs shadow-sm">
              <thead>
                <tr>
                  <th className="bg-muted/60 sticky left-0 top-0 border border-border p-2 font-medium text-muted-foreground">
                    #
                  </th>
                  {Array.from({ length: columnCount }).map((_, columnIndex) => (
                    <th
                      key={columnIndex}
                      className="bg-muted/60 border border-border px-3 py-2 font-medium text-muted-foreground"
                    >
                      {columnIndexToLabel(columnIndex)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeSheet.rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    <th className="bg-muted/40 sticky left-0 border border-border px-2 py-1 text-right font-medium text-muted-foreground">
                      {rowIndex + 1}
                    </th>
                    {Array.from({ length: columnCount }).map(
                      (_, columnIndex) => (
                        <td
                          key={columnIndex}
                          className="border border-border px-3 py-1 text-left align-top text-slate-700"
                        >
                          {formatCellValue(row[columnIndex] ?? "")}
                        </td>
                      )
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const LoadingState = ({ children }: { children: ReactNode }) => (
  <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-xs text-muted-foreground">
    <Loader2 className="size-4 animate-spin" />
    <span>{children}</span>
  </div>
);

const ErrorState = ({
  children,
  onDownload,
}: {
  children: ReactNode;
  onDownload: () => void;
}) => (
  <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
    <TriangleAlert className="size-6 text-amber-500" />
    <p className="text-xs text-muted-foreground">{children}</p>
    <Button variant="outline" size="xs" onClick={onDownload}>
      Download to view
    </Button>
  </div>
);

const EmptyState = ({ onDownload }: { onDownload: () => void }) => (
  <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
    <p className="text-xs text-muted-foreground">
      This spreadsheet is empty or could not be parsed.
    </p>
    <Button variant="outline" size="xs" onClick={onDownload}>
      Download to view
    </Button>
  </div>
);
