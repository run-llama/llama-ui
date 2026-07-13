import type { ExtractedFieldMetadata } from "@/src/lib/agent-data";
import type React from "react";
import { useLayoutEffect, useRef, useState } from "react";
import { Button } from "@/base/button";
import { Input } from "@/base/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/base/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/base/select";
import { Textarea } from "@/base/textarea";
import { Tooltip } from "@/base/tooltip";
import { useUIConfigStore } from "@/src/store/ui-config-store";
import {
  getConfidenceBackgroundClass,
  getConfidenceBorderClass,
} from "../confidence-utils";
import { convertPrimitiveValue, PrimitiveType } from "../primitive-validation";
import type { PrimitiveValue } from "../types";

interface EditableFieldProps<S extends PrimitiveValue> {
  value: S;
  onSave: (newValue: S) => void;

  // UI/state
  expectedType?: PrimitiveType;
  required?: boolean;
  isChanged?: boolean;
  showBorder?: boolean;
  className?: string;
  editable?: boolean;
  // metadata and click/hover callbacks
  metadata?: ExtractedFieldMetadata;
  onClick?: (args: { value: S; metadata?: ExtractedFieldMetadata }) => void;
  onHover?: (
    args: { value: S; metadata?: ExtractedFieldMetadata } | null
  ) => void;
}

export function EditableField<S extends PrimitiveValue>({
  value,
  onSave,
  isChanged,
  showBorder = true,
  expectedType = PrimitiveType.STRING,
  required = false,
  className,
  metadata,
  onClick,
  onHover,
  editable = true,
}: EditableFieldProps<S>) {
  const confidenceThreshold = useUIConfigStore(
    (state) => state.confidenceThreshold
  );
  const [isOpen, setIsOpen] = useState(false);
  const [editValue, setEditValue] = useState(
    value === null || value === undefined ? "" : String(value)
  );
  const [localConfidence, setLocalConfidence] = useState(
    metadata?.confidence ?? 1
  );

  // Removed noisy debug log for low confidence fields to avoid confusing onClick payload structure

  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (containerRef.current) {
      const parent = containerRef.current.parentElement;
      if (parent) {
        const contentHeight = parent.clientHeight;
        containerRef.current.style.height = `${contentHeight}px`;
      }
    }
  }, [value]);

  const handleSave = () => {
    // Check if required number field is empty
    if (
      required &&
      expectedType === PrimitiveType.NUMBER &&
      editValue.trim() === ""
    ) {
      // Don't save if required number field is empty
      return;
    }

    // Convert the input value to the correct type
    const convertedValue = convertPrimitiveValue(
      editValue,
      expectedType,
      required
    );

    // Save the converted value
    onSave(convertedValue as S);

    // Update confidence to 100% after user confirms the edit
    setLocalConfidence(1.0);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setEditValue(value === null || value === undefined ? "" : String(value));
    setIsOpen(false);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      setEditValue(value === null || value === undefined ? "" : String(value));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      // Enter alone saves (for all types)
      e.preventDefault();
      handleSave();
    }
    // Cmd/Shift/Ctrl + Enter allows newline (default behavior for textarea)
    if (e.key === "Escape") {
      handleCancel();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditValue(e.target.value);
  };

  const handleSelectChange = (value: string) => {
    setEditValue(value);
  };

  // Use local confidence if available, otherwise use metadata confidence
  const currentConfidence = localConfidence ?? metadata?.confidence;
  const displayValue =
    value === null || value === undefined || value === "" ? "" : String(value);
  const backgroundClass = isChanged
    ? "bg-success-muted"
    : getConfidenceBackgroundClass(confidenceThreshold, currentConfidence);
  const hoverClass = backgroundClass.includes("bg-warning-muted")
    ? "hover:bg-warning/20"
    : backgroundClass.includes("bg-success-muted")
      ? "hover:bg-success/20"
      : "hover:bg-muted";
  const defaultBorderClass = showBorder
    ? getConfidenceBorderClass(confidenceThreshold, currentConfidence)
    : "";
  const paddingClass = "p-2";

  const renderEditInput = () => {
    switch (expectedType) {
      case PrimitiveType.BOOLEAN:
        return (
          <Select onValueChange={handleSelectChange} value={editValue}>
            <SelectTrigger placeholder="Select a value" />
            <SelectContent>
              <SelectItem value="true" label="true" />
              <SelectItem value="false" label="false" />
            </SelectContent>
          </Select>
        );
      case PrimitiveType.STRING:
        // Use textarea for string inputs to allow multiline text
        return (
          <Textarea
            value={editValue}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Enter value"
            autoFocus
          />
        );
      case PrimitiveType.NUMBER:
        return (
          <Input
            type="number"
            value={editValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Enter a number"
            autoFocus
            required={required}
          />
        );
      default:
        return (
          <Input
            value={editValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Enter value"
            autoFocus
          />
        );
    }
  };

  if (!editable) {
    return (
      <Tooltip
        trigger={
          <div
            ref={containerRef}
            onClick={() => onClick?.({ value, metadata })}
            onMouseEnter={() => onHover?.({ value, metadata })}
            onMouseLeave={() => onHover?.(null)}
            className={`cursor-pointer ${showBorder ? "min-h-8" : "w-full"} flex items-center ${defaultBorderClass} ${paddingClass} ${backgroundClass} ${hoverClass} ${className}`}
            data-testid="editable-field-trigger"
          >
            <span className="text-sm accent-foreground truncate leading-tight block w-full">
              {displayValue}
            </span>
          </div>
        }
        content={<p>{displayValue}</p>}
      />
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <div
          ref={containerRef}
          onClick={() => onClick?.({ value, metadata })}
          onMouseEnter={() => onHover?.({ value, metadata })}
          onMouseLeave={() => onHover?.(null)}
          className={`cursor-pointer ${showBorder ? "min-h-8" : "w-full"} flex items-center ${defaultBorderClass} ${paddingClass} ${backgroundClass} ${hoverClass} ${className}`}
          data-testid="editable-field-trigger"
        >
          <span className="text-sm accent-foreground truncate leading-tight block w-full">
            {displayValue}
          </span>
        </div>
      </PopoverTrigger>

      <PopoverContent className="w-80" align="start">
        <div className="space-y-3" data-testid="editable-field-popover">
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium text-foreground">
              Edit Value
            </div>
          </div>

          {renderEditInput()}

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              label="Cancel"
            />
            <Button size="sm" onClick={handleSave} label="Save" />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
