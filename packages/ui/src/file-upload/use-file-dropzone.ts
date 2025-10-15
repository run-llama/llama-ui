import type { ChangeEvent, DragEvent } from "react";
import { useCallback, useRef, useState } from "react";

interface UseFileDropzoneOptions {
  onFilesSelected: (files: File[]) => void;
  multiple?: boolean;
}

export function useFileDropzone({
  onFilesSelected,
  multiple = false,
}: UseFileDropzoneOptions) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const selectFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.isArray(files) ? files : Array.from(files);
      if (fileArray.length === 0) {
        return;
      }

      if (multiple) {
        onFilesSelected(fileArray);
        return;
      }

      onFilesSelected([fileArray[0]]);
    },
    [multiple, onFilesSelected],
  );

  const handleDragEnter = useCallback(
    (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragging(true);
    },
    [],
  );

  const handleDragOver = useCallback(
    (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragging(true);
    },
    [],
  );

  const handleDragLeave = useCallback(
    (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragging(false);
    },
    [],
  );

  const handleDrop = useCallback(
    (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragging(false);

      if (event.dataTransfer?.files?.length) {
        selectFiles(event.dataTransfer.files);
      }
    },
    [selectFiles],
  );

  const handleFileInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const { files } = event.target;
      if (files?.length) {
        selectFiles(files);
        event.target.value = "";
      }
    },
    [selectFiles],
  );

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  return {
    inputRef,
    isDragging,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileInputChange,
    handleClick,
  };
}
