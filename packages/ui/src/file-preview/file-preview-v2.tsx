import { PdfPreview } from "./pdf-preview";
import type { Highlight } from "./types";
import { FilePreviewToolbar } from "./file-preview-toolbar";
import { useRef } from "react";
import { cn } from "@/lib/utils";

export interface FilePreviewV2Props {
  fileData: {
    url: string;
    name: string;
  };
  fileOptions?: {
    pdf?: {
      highlight?: Highlight;
    };
  };
  style?: {
    containerClassName?: string;
    toolbarClassName?: string;
  };
}

export function FilePreviewV2({
  fileData,
  fileOptions,
  style,
}: FilePreviewV2Props) {
  const { name: fileName, url: fileUrl } = fileData;
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  if (fileName.toLowerCase().endsWith(".pdf")) {
    return (
      <PdfPreview
        url={fileUrl}
        fileName={fileName}
        highlight={fileOptions?.pdf?.highlight}
      />
    );
  }

  return (
    <div
      className={cn("flex flex-col gap-4 h-full", style?.containerClassName)}
    >
      <FilePreviewToolbar
        fileName={fileName}
        onDownload={() => {
          window.open(fileUrl, "_blank");
        }}
        onFullscreen={() => {
          toggleFullscreen();
        }}
        className={style?.toolbarClassName}
      />
      <div
        className="flex-1 min-h-0 bg-[#F3F3F3] overflow-auto p-6"
        ref={containerRef}
      >
        <object data={fileUrl} className="size-full">
          <p>
            Cannot display preview for this file.{" "}
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Download File
            </a>
          </p>
        </object>
      </div>
    </div>
  );
}
