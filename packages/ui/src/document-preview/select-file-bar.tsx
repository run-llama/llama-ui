import { File, Folder, Minus, Trash2 } from "lucide-react";
import type { MouseEvent, KeyboardEvent } from "react";
import { Button, buttonVariants } from "@/base/button";
import { ScrollArea, ScrollBar } from "@/base/scroll-area";
import { ToolTipper } from "@/base/tooltipper";
import { cn } from "@/lib/utils";
import type { FileItemType } from "./files";

interface SelectFileBarProps {
  files: Array<{ fileName: string | null; index: number; type?: FileItemType }>;
  currentIndex: number;
  onSelect: (index: number) => void;
  onRemove: (index: number) => void;
  onToggleFileUpload?: () => void;
  isFileUploadExpanded?: boolean;
}

export const SelectFileBar = ({
  files,
  currentIndex,
  onSelect,
  onRemove,
  onToggleFileUpload,
  isFileUploadExpanded = false,
}: SelectFileBarProps) => {
  const makeButtonHandler =
    (handler: () => void) => (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      handler();
    };

  return (
    <ScrollArea className="h-10 border-b" viewportClassName="flex items-center">
      <div className="flex items-center gap-3 px-6">
        {onToggleFileUpload && (
          <Button size="xs" onClick={onToggleFileUpload}>
            {isFileUploadExpanded ? (
              <>
                <Minus className="size-4" />
                Hide upload
              </>
            ) : (
              <>
                <File className="size-4" />
                Add files
              </>
            )}
          </Button>
        )}
        {files.length > 0 && (
          <span className="text-xs text-muted-foreground shrink-0">
            {files.length} {files.length === 1 ? "file" : "files"}
          </span>
        )}
        {files.map(({ fileName, index, type }) => {
          const displayName = fileName ?? `File ${index + 1}`;
          // Use composite key for stability
          const key = `${index}-${fileName ?? `file-${index}`}`;
          const isCurrent = index === currentIndex;

          const renderIcon = () => {
            if (type === "directory") {
              return <Folder className="size-3 shrink-0" />;
            }
            if (type === "file") {
              return <File className="size-3 shrink-0" />;
            }
            return null;
          };

          return (
            <div
              key={key}
              role="button"
              tabIndex={0}
              className={cn(
                buttonVariants({ variant: "outline", size: "xs" }),
                "flex shrink-0 items-center gap-2 border-border px-3 hover:bg-muted cursor-pointer",
                isCurrent ? "bg-accent" : "bg-white"
              )}
              onClick={() => onSelect(index)}
              onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(index);
                }
              }}
            >
              {renderIcon()}
              <span
                className={`whitespace-nowrap text-xs ${
                  isCurrent ? "text-accent-foreground" : "text-muted-foreground"
                }`}
              >
                {displayName}
              </span>
              <ToolTipper content="Remove file">
                <Button
                  variant="ghost"
                  onClick={makeButtonHandler(() => onRemove(index))}
                  className="size-5 shrink-0 p-0"
                >
                  <Trash2 className="size-3" />
                </Button>
              </ToolTipper>
            </div>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};
