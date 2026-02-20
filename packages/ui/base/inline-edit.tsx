"use client";

import * as React from "react";
import { Check, X, AlertTriangle } from "lucide-react";
import { Button } from "./button";
import { Input, type InputProps } from "./input";
import { Tooltip } from "./tooltip";

export interface InlineEditProps
  extends Omit<InputProps, "value" | "onChange" | "onBlur"> {
  /**
   * Current value to display and edit
   */
  value: string;
  /**
   * Callback when the value is saved
   */
  onSave: (value: string) => void | Promise<void>;
  /**
   * Callback when edit is cancelled
   */
  onCancel?: () => void;
  /**
   * Whether the component is in a loading/saving state
   */
  isLoading?: boolean;
  /**
   * Whether the input is editable
   */
  editable?: boolean;
  /**
   * Error message to display
   */
  error?: string | null;
}

/**
 * InlineEdit - An inline editable input component with save/cancel buttons.
 *
 * Features:
 * - Click to edit mode with save/cancel buttons
 * - Loading state support during save operations
 * - Keyboard shortcuts (Enter to save, Escape to cancel)
 * - Buttons hide on blur (when focus leaves the component)
 * - Error display support
 * - Accessible focus states
 *
 * Example:
 * ```tsx
 * <InlineEdit
 *   value={name}
 *   onSave={async (newName) => {
 *     await updateName(newName);
 *   }}
 *   isLoading={isPending}
 *   editable={hasPermission}
 * />
 * ```
 */
function InlineEdit({
  value,
  onSave,
  onCancel,
  isLoading = false,
  editable = true,
  error,
  ...inputProps
}: InlineEditProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(value);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const prevValueRef = React.useRef(value);

  // Sync editValue when value prop changes from external source (not editing)
  if (prevValueRef.current !== value) {
    prevValueRef.current = value;
    if (!isEditing) {
      setEditValue(value);
    }
  }

  const handleFocus = () => {
    if (editable && !isEditing) {
      setIsEditing(true);
      setEditValue(value);
    }
  };

  const handleSave = () => {
    if (editValue !== value) {
      void onSave(editValue);
    }
    setIsEditing(false);
  };

  const handleCancel = React.useCallback(() => {
    setEditValue(value);
    setIsEditing(false);
    onCancel?.();
  }, [value, onCancel]);

  const handleBlur = React.useCallback(
    (e: React.FocusEvent) => {
      // Check if the new focus target is within the container
      if (
        containerRef.current &&
        !containerRef.current.contains(e.relatedTarget as Node)
      ) {
        handleCancel();
      }
    },
    [handleCancel]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isLoading) {
      e.preventDefault();
      handleSave();
      e.currentTarget.blur();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
      e.currentTarget.blur();
    }
  };

  return (
    <div
      ref={containerRef}
      className="flex items-center gap-2"
      onBlur={handleBlur}
    >
      <Input
        value={isEditing ? editValue : value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setEditValue(e.target.value)
        }
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        readOnly={!editable}
        disabled={isLoading}
        variant={error ? "error" : "default"}
        {...inputProps}
      />
      {isEditing && (
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={handleSave}
            label="Save"
            startIcon={<Check className="text-green-500" />}
            isLoading={isLoading}
            disabled={isLoading}
          />
          <Button
            variant="outline"
            size="icon-sm"
            onClick={handleCancel}
            label="Cancel"
            startIcon={<X className="text-red-500" />}
            disabled={isLoading}
          />
        </div>
      )}
      {error && (
        <Tooltip
          content={error}
          trigger={
            <AlertTriangle className="size-4 shrink-0 text-destructive" />
          }
        ></Tooltip>
      )}
    </div>
  );
}

InlineEdit.displayName = "InlineEdit";

export { InlineEdit };
