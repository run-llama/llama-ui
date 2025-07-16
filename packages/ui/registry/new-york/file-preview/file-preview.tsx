"use client";
import { Card } from "@/components/ui/card";
import type { BoundingBox } from "./types";
import { ImagePreview } from "./image-preview";
import { useFileData, type FileData } from "./use-file-data";
import { Clock, XCircle } from "lucide-react";
import { PdfPreview } from "./pdf-preview";

function getFileType(fileType?: string): "image" | "pdf" | "unsupported" {
  if (!fileType) return "unsupported";

  const type = fileType.toLowerCase();

  if (
    type.includes("image/") ||
    type.includes("png") ||
    type.includes("jpg") ||
    type.includes("jpeg") ||
    type.includes("gif") ||
    type.includes("webp")
  ) {
    return "image";
  }

  if (type.includes("pdf")) {
    return "pdf";
  }

  // PDF and all other types are unsupported for now
  return "unsupported";
}

export interface FilePreviewProps {
  onBoundingBoxClick?: (box: BoundingBox, pageNumber?: number) => void;
  fileId: string;
  mockData?: FileData; // For Storybook
}

// Main unified FilePreview component
export function FilePreview({
  onBoundingBoxClick,
  fileId,
  mockData,
}: FilePreviewProps) {
  const { data, loading, error } = useFileData(fileId || "", mockData);

  const fileName = data?.name || "";
  const fileType = getFileType(data?.type) || "unsupported";

  // Show loading state when fetching file data
  if (loading) {
    return (
      <Card>
        <div className="flex h-32 items-center justify-center">
          <div className="text-center">
            <Clock className="h-8 w-8 animate-spin mx-auto mb-2" />
            <div className="text-sm text-muted-foreground">Loading file...</div>
          </div>
        </div>
      </Card>
    );
  }

  // Show error state when file fetch fails
  if (error) {
    return (
      <Card>
        <div className="flex h-32 items-center justify-center">
          <div className="text-center">
            <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <div className="text-sm text-muted-foreground">
              Error loading file: {error}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (fileType === "unsupported") {
    return (
      <Card>
        <div className="p-4">
          <p className="text-sm text-muted-foreground">
            Unsupported file type: {fileName}
          </p>
        </div>
      </Card>
    );
  }

  if (fileType === "image") {
    return (
      <div className="flex flex-col gap-6">
        <ImagePreview
          src={data?.url || ""}
          boundingBoxes={[]}
          onBoundingBoxClick={(box) => onBoundingBoxClick?.(box, 1)}
        />
      </div>
    );
  }

  if (fileType === "pdf") {
    return <PdfPreview url={data?.url || ""} />;
  }

  return null;
}
