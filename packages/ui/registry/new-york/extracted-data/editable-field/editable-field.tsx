"use client";
import React, { useState, useRef, useLayoutEffect } from "react";
import { getConfidenceBackgroundClass } from "../confidence-utils";
import { isLowConfidence } from "@/lib";
import { PrimitiveType, convertPrimitiveValue } from "../primitive-validation";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EditableFieldProps {
  value: unknown;
  onSave: (newValue: unknown) => void;
  confidence?: number;
  isChanged?: boolean;
  showBorder?: boolean;
  onConfidenceUpdate?: (newConfidence: number) => void;
  /** Expected primitive type for validation */
  expectedType?: PrimitiveType;
  /** Whether the field is required (prevents empty values for numbers) */
  required?: boolean;
  className?: string;
}

export function EditableField({
  value,
  onSave,
  confidence,
  isChanged,
  showBorder = true,
  onConfidenceUpdate,
  expectedType = PrimitiveType.STRING,
  required = false,
  className,
}: EditableFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editValue, setEditValue] = useState(
    value === null || value === undefined ? "" : String(value),
  );
  const [localConfidence, setLocalConfidence] = useState(confidence ?? 1);

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
      required,
    );

    // Save the converted value
    onSave(convertedValue);

    // Update confidence to 100% after user confirms the edit
    setLocalConfidence(1.0);
    onConfidenceUpdate?.(1.0);
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

  // Use local confidence if available, otherwise use prop confidence
  const currentConfidence = localConfidence ?? confidence;
  const displayValue =
    value === null || value === undefined || value === "" ? "" : String(value);
  const backgroundClass = isChanged
    ? "bg-green-50"
    : getConfidenceBackgroundClass(currentConfidence);
  const hoverClass = backgroundClass.includes("bg-orange-50")
    ? "hover:bg-orange-100"
    : backgroundClass.includes("bg-green-50")
      ? "hover:bg-green-100"
      : "hover:bg-gray-100";
  const defaultBorderClass = showBorder
    ? isLowConfidence(currentConfidence)
      ? "border-b-2 border-orange-300"
      : "border-b border-gray-200"
    : "";
  const paddingClass = "p-2";

  const renderEditInput = () => {
    switch (expectedType) {
      case PrimitiveType.BOOLEAN:
        return (
          <Select onValueChange={handleSelectChange} value={editValue}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a value" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">true</SelectItem>
              <SelectItem value="false">false</SelectItem>
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
            className="w-full min-h-[100px] resize-none"
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
            className="w-full"
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
            className="w-full"
            autoFocus
          />
        );
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <div
          ref={containerRef}
          className={`cursor-pointer ${showBorder ? "min-h-8" : "w-full"} flex items-center ${defaultBorderClass} ${paddingClass} ${backgroundClass} ${hoverClass} ${className}`}
        >
          <span className="text-sm accent-foreground truncate leading-tight block w-full">
            {displayValue}
          </span>
        </div>
      </PopoverTrigger>

      <PopoverContent className="w-80" align="start">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium text-gray-700">Edit Value</div>
          </div>

          {renderEditInput()}

          <div className="flex justify-end space-x-2">
            <Button variant="outline" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
