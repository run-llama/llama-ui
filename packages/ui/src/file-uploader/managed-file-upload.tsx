import type { ComponentProps } from "react";

import { FileUpload } from "./file-upload";
import { FileUploader } from "./file-uploader";
import type { FileUploaderProps } from "./types";

type FileUploadProps = ComponentProps<typeof FileUpload>;

type BaseManagedProps = {
  variant?: "inline" | "modal";
};

type InlineVariantProps = BaseManagedProps & {
  variant?: "inline";
} & FileUploadProps;

type ModalVariantProps = BaseManagedProps & {
  variant: "modal";
} & FileUploaderProps;

export type ManagedFileUploadProps = InlineVariantProps | ModalVariantProps;

function isModalVariant(
  props: ManagedFileUploadProps
): props is ModalVariantProps {
  return props.variant === "modal";
}

export function ManagedFileUpload(props: ManagedFileUploadProps) {
  if (isModalVariant(props)) {
    const modalProps = (({ variant: _variant, ...rest }: ModalVariantProps) =>
      rest)(props);
    return <FileUploader {...modalProps} />;
  }

  const inlineProps = (({ variant: _variant, ...rest }: InlineVariantProps) =>
    rest)(props);
  return <FileUpload {...inlineProps} />;
}
