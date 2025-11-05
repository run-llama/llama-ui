import { File, Trash2 } from "lucide-react";
import { Button } from "@/base/button";
import { cn } from "@/lib/utils";
import { PdfToolbar, type PdfToolbarProps } from "./pdf-toolbar";

type PdfNavigatorPropsBase = {
  fileName: string;
  onRemove?: () => void;
  className?: string;
};

type PdfNavigatorPropsLoading = PdfNavigatorPropsBase & {
  isLoading: true;
};

type PdfNavigatorPropsLoaded = PdfNavigatorPropsBase &
  PdfToolbarProps & {
    isLoading?: false | undefined;
  };

export type PdfNavigatorProps =
  | PdfNavigatorPropsLoading
  | PdfNavigatorPropsLoaded;

export const PdfNavigator = (props: PdfNavigatorProps) => {
  const { fileName, onRemove, className } = props;

  const toolbarProps: PdfToolbarProps | null =
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
        {toolbarProps && <PdfToolbar {...toolbarProps} />}
      </div>
    </div>
  );
};
