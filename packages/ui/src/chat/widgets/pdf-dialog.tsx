import { Button } from "@/base/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/base/drawer";
import { PdfPreview } from "../../file-preview/pdf-preview";

export interface PdfDialogProps {
  documentId: string;
  url: string;
  trigger: React.ReactNode;
}

export function PdfDialog(props: PdfDialogProps) {
  return (
    <Drawer direction="left">
      <DrawerTrigger asChild>{props.trigger}</DrawerTrigger>
      <DrawerContent className="mt-24 h-full max-h-[96%] w-full md:w-3/5">
        <DrawerHeader className="flex flex-col gap-4 sm:flex-row sm:justify-between">
          <div className="space-y-2">
            <DrawerTitle>PDF Content</DrawerTitle>
            <DrawerDescription className="break-all">
              File URL:{" "}
              <a
                className="hover:text-primary"
                href={props.url}
                target="_blank"
                rel="noopener"
              >
                {props.url}
              </a>
            </DrawerDescription>
          </div>
          <DrawerClose asChild>
            <Button variant="outline" className="w-full sm:w-auto">
              Close
            </Button>
          </DrawerClose>
        </DrawerHeader>
        <div className="m-4">
          <PdfPreview url={props.url} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
