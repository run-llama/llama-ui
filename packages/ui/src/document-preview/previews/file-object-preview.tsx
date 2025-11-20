import { useRef, useState } from "react";
import { FileToolbar } from "../file-tool-bar";
import { downloadFile } from "../files";

export const FileObjectPreview = ({
  fileName,
  contentUrl,
  onRemove,
}: {
  fileName?: string | null;
  contentUrl: string;
  onRemove?: () => void;
}) => {
  const containerRef = useRef<HTMLObjectElement>(null);
  const [scale, setScale] = useState(1);

  const onDownload = () => {
    downloadFile(contentUrl, fileName);
  };

  const handleScaleChange = (newScale: number) => {
    setScale(newScale);
  };

  return (
    <div className="relative flex h-full flex-col">
      <FileToolbar
        fileName={fileName}
        onDownload={onDownload}
        scale={scale}
        onScaleChange={handleScaleChange}
        onRemove={onRemove}
      />
      <div className="h-full flex-1 overflow-auto bg-gray-50">
        <object
          ref={containerRef}
          data={contentUrl}
          className="h-full w-full bg-white"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          <p className="p-4 text-center text-xs text-muted-foreground">
            Your browser doesn&apos;t support file object preview.{" "}
            <a
              href={contentUrl}
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
};
