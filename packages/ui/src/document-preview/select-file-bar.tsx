import { File, Minus, Trash2 } from "lucide-react";
import type { MouseEvent } from "react";
import { Button } from "@/base/button";
import { ScrollArea, ScrollBar } from "@/base/scroll-area";
import { ToolTipper } from "@/base/tooltipper";

interface SelectFileBarProps {
  files: Array<{ fileName: string | null; index: number }>;
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
      <div className="flex gap-2 px-6">
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
        {files.map(({ fileName, index }) => {
          const displayName = fileName ?? `File ${index + 1}`;
          // Use composite key for stability
          const key = `${index}-${fileName ?? `file-${index}`}`;
          const isCurrent = index === currentIndex;

          return (
            <Button
              key={key}
              type="button"
              variant="outline"
              className={`flex shrink-0 items-center gap-2 border-border px-3 hover:bg-muted ${
                isCurrent ? "bg-accent text-accent-foreground" : "bg-white"
              }`}
              onClick={() => onSelect(index)}
              size="xs"
            >
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
            </Button>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};
