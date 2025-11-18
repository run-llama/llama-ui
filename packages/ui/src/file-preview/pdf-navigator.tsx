import { File, Trash2 } from "lucide-react";
import { Button } from "@/base/button";
import { cn } from "@/lib/utils";
import {
  FileToolbar,
  type FileToolbarProps,
} from "../document-preview/file-tool-bar";

type PdfNavigatorPropsBase = {
  fileName: string;
  onRemove?: () => void;
  className?: string;
};

type PdfNavigatorPropsLoading = PdfNavigatorPropsBase & {
  isLoading: true;
};

type PdfNavigatorPropsLoaded = PdfNavigatorPropsBase &
  FileToolbarProps & {
    isLoading?: false | undefined;
  };

/**
 * @deprecated Use `FileToolbar` from `@llamaindex/ui/document-preview` directly instead.
 * This component is kept for backward compatibility and will be removed in a future version.
 *
 * PdfNavigator is now a wrapper around FileToolbar. For new code, use FileToolbar directly:
 *
 * ```tsx
 * import { FileToolbar } from "@llamaindex/ui/document-preview";
 *
 * <FileToolbar
 *   fileName="document.pdf"
 *   currentPage={1}
 *   totalPages={10}
 *   scale={1.0}
 *   onPageChange={handlePageChange}
 *   onScaleChange={handleScaleChange}
 *   onFullscreen={handleFullscreen}
 *   onRemove={handleRemove}
 * />
 * ```
 */
export type PdfNavigatorProps =
  | PdfNavigatorPropsLoading
  | PdfNavigatorPropsLoaded;

/**
 * @deprecated Use `FileToolbar` from `@llamaindex/ui/document-preview` directly instead.
 * This component is kept for backward compatibility and will be removed in a future version.
 */
export const PdfNavigator = (props: PdfNavigatorProps) => {
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.warn(
      "PdfNavigator is deprecated. Use FileToolbar from @llamaindex/ui/document-preview directly instead."
    );
  }

  const { fileName, onRemove, className } = props;

  const toolbarProps: FileToolbarProps | null =
    props.isLoading === true
      ? null
      : (() => {
          // remove non-toolbar props from props
          // and return the remaining props as toolbarProps
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { fileName, onRemove, className, isLoading, ...rest } =
            props satisfies PdfNavigatorPropsLoaded;
          return rest;
        })();

  return (
    <div className={cn("sticky top-0 w-full z-50 text-xs", className)}>
      <div className="bg-white border px-6 flex items-center justify-between gap-3 h-10">
        <div className="flex items-center gap-2">
          <File className="size-4" />
          <span className="text-xs text-muted-foreground">{fileName}</span>
          {onRemove && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="size-6 p-0"
              title="Remove PDF"
            >
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
        {toolbarProps && <FileToolbar {...toolbarProps} />}
      </div>
    </div>
  );
};
