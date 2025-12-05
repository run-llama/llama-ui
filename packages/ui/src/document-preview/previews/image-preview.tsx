import { useState } from "react";
import { FileToolbar } from "../file-tool-bar";

export const ImagePreview = ({
  fileName,
  contentUrl,
  onRemove,
}: {
  fileName?: string | null;
  contentUrl: string;
  onRemove?: () => void;
}) => {
  const [scale, setScale] = useState(1);

  const toggleFullscreen = () => {
    window.open(contentUrl, "_blank");
  };

  const onFullscreen = () => {
    toggleFullscreen();
  };

  const handleScaleChange = (newScale: number) => {
    setScale(newScale);
  };

  return (
    <div className="relative flex h-full flex-col">
      <FileToolbar
        fileName={fileName}
        onFullscreen={onFullscreen}
        scale={scale}
        onScaleChange={handleScaleChange}
        onRemove={onRemove}
      />
      <div className="h-full flex-1 overflow-auto bg-gray-50">
        <img
          src={contentUrl}
          alt={fileName ?? "uploaded_file"}
          className="h-full w-full rounded-none object-contain p-4"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        />
      </div>
    </div>
  );
};
