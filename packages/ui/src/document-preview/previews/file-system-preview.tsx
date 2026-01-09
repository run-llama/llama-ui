import { File, Folder, Plus, Trash2 } from "lucide-react";
import { Button } from "@/base/button";
import { ScrollArea } from "@/base/scroll-area";
import { ToolTipper } from "@/base/tooltipper";

export type FileSystemType = "file" | "directory";

export interface FileSystemItem {
  fileName: string | null;
  type: FileSystemType;
  index: number;
}

interface FileSystemPreviewProps {
  files: FileSystemItem[];
  onRemove?: (index: number) => void;
  onAddFiles?: () => void;
}

export function FileSystemPreview({
  files,
  onRemove,
  onAddFiles,
}: FileSystemPreviewProps) {
  if (files.length === 0) {
    return null;
  }

  if (files.length === 1 && files[0].type === "directory") {
    const file = files[0];
    return (
      <div className="flex h-full flex-1 flex-col items-center justify-center gap-4 bg-muted/30">
        <div className="flex size-24 items-center justify-center rounded-2xl bg-muted">
          <Folder className="size-12 text-muted-foreground" />
        </div>
        <div className="flex flex-col items-center gap-1 px-8 text-center">
          <span className="text-sm font-medium text-foreground">
            {file.fileName ?? "Untitled Directory"}
          </span>
          <span className="text-xs text-muted-foreground">
            This directory has been selected from your file system
          </span>
        </div>
        {onRemove && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRemove(file.index)}
            startIcon={<Trash2 />}
            label="Remove"
          />
        )}
      </div>
    );
  }

  const fileCount = files.length;
  const label = fileCount === 1 ? "file" : "files";

  return (
    <div className="flex h-full flex-col bg-muted/30">
      <div className="flex items-center gap-3 border-b px-6 py-3">
        {onAddFiles && (
          <Button
            size="sm"
            onClick={onAddFiles}
            startIcon={<Plus />}
            label="Add files"
          />
        )}
        <span className="text-sm text-muted-foreground">
          {fileCount} {label} selected from your file system
        </span>
      </div>
      <ScrollArea className="flex-1" viewportClassName="[&>div]:!block">
        <div className="flex flex-col gap-1 p-4">
          {files.map((file) => (
            <div
              key={file.index}
              className="flex items-center gap-3 rounded-lg border bg-background px-4 py-3"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                {file.type === "directory" ? (
                  <Folder className="size-5 text-muted-foreground" />
                ) : (
                  <File className="size-5 text-muted-foreground" />
                )}
              </div>
              <span className="flex-1 truncate text-sm font-medium text-foreground">
                {file.fileName ??
                  `Untitled ${file.type === "directory" ? "Directory" : "File"}`}
              </span>
              {onRemove && (
                <ToolTipper content="Remove">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemove(file.index)}
                    startIcon={<Trash2 />}
                  />
                </ToolTipper>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
