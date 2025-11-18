import type React from "react";
import {
  FileToolbar,
  type FileToolbarProps,
} from "../document-preview/file-tool-bar";

/**
 * @deprecated Use `FileToolbar` from `../document-preview/file-tool-bar` instead.
 * This component is kept for backward compatibility and will be removed in a future version.
 */
export type PdfToolbarProps = Required<
  Pick<
    FileToolbarProps,
    | "currentPage"
    | "totalPages"
    | "scale"
    | "onPageChange"
    | "onScaleChange"
    | "onFullscreen"
  >
> &
  Pick<FileToolbarProps, "onDownload" | "onReset">;

/**
 * @deprecated Use `FileToolbar` from `../document-preview/file-tool-bar` instead.
 * This component is kept for backward compatibility and will be removed in a future version.
 *
 * PdfToolbar is now an alias for FileToolbar. Use FileToolbar directly for new code.
 */
export const PdfToolbar: React.ComponentType<PdfToolbarProps> = (props) => {
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.warn(
      "PdfToolbar is deprecated. Use FileToolbar from ../document-preview/file-tool-bar instead."
    );
  }
  return <FileToolbar {...props} />;
};
