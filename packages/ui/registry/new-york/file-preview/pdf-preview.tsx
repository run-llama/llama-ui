"use client";
import { useState, useEffect, type ComponentType } from "react";

interface PdfPreviewProps {
  url: string;
  onDownload?: () => void;
}

// Loading component
const PdfLoadingState = () => (
  <div className="relative h-full flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
      <p className="text-gray-600">Loading PDF viewer...</p>
    </div>
  </div>
);

// Proxy component that dynamically loads the real implementation
export const PdfPreview = ({ url, onDownload }: PdfPreviewProps) => {
  const [PdfComponent, setPdfComponent] =
    useState<ComponentType<PdfPreviewProps> | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Only run on client side
    setIsClient(true);

    // Dynamically import the actual implementation
    import("./pdf-preview-impl")
      .then((module) => {
        setPdfComponent(() => module.PdfPreviewImpl);
      })
      .catch((error) => {
        console.error("Failed to load PDF component:", error);
      });
  }, []);

  // Server-side or still loading
  if (!isClient || !PdfComponent) {
    return <PdfLoadingState />;
  }

  // Render the actual component once loaded
  return <PdfComponent url={url} onDownload={onDownload} />;
};
