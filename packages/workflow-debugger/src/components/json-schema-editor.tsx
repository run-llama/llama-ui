import { useEffect, useMemo, useState } from "react";
import {
  Input,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@llamaindex/ui";
import type { JSONValue } from "./workflow-config-panel";

export interface SimpleSchemaProperty {
  type?: string;
  title?: string;
  description?: string;
}

export interface SimpleSchema {
  properties?: Record<string, SimpleSchemaProperty>;
  required?: string[];
}

export interface JsonSchemaEditorProps {
  schema: SimpleSchema | null;
  values: Record<string, JSONValue>;
  onChange: (values: Record<string, JSONValue>) => void;
  onErrorsChange?: (errors: Record<string, string | null>) => void;
  className?: string;
}

function isComplexType(type?: string): boolean {
  if (!type) return false;
  const lower = type.toLowerCase();
  return (
    lower.includes("object") ||
    lower.includes("array") ||
    lower.includes("map") ||
    lower.includes("dict") ||
    /\w+\s*\[.*\]/.test(type)
  );
}

function getTypeHintAndPlaceholder(type?: string): {
  hint: string;
  placeholder: string;
} {
  const lower = (type || "").toLowerCase();
  const looksLikeArray =
    lower.includes("array") ||
    lower.includes("list") ||
    /\w+\s*\[.*\]/.test(type || "");
  const looksLikeObject =
    lower.includes("object") || lower.includes("map") || lower.includes("dict");
  if (looksLikeArray) {
    return {
      hint: 'Expected: JSON array (e.g., ["a", "b"])',
      placeholder: '["item1", "item2"]',
    };
  }
  if (looksLikeObject) {
    return {
      hint: 'Expected: JSON object (e.g., {"key": "value"})',
      placeholder: '{"key": "value"}',
    };
  }
  return {
    hint: "Expected: valid JSON (object or array)",
    placeholder: "Enter value as JSON",
  };
}

export function JsonSchemaEditor({
  schema,
  values,
  onChange,
  onErrorsChange,
  className,
}: JsonSchemaEditorProps) {
  const properties = schema?.properties || {};
  const required = new Set(schema?.required || []);

  const [rawJsonValues, setRawJsonValues] = useState<Record<string, string>>(
    {},
  );
  const [rawJsonErrors, setRawJsonErrors] = useState<
    Record<string, string | null>
  >({});

  useEffect(() => {
    onErrorsChange?.(rawJsonErrors);
  }, [rawJsonErrors, onErrorsChange]);

  // Initialize raw values for complex fields when schema or values change
  useEffect(() => {
    const nextRaw: Record<string, string> = { ...rawJsonValues };
    for (const [key, def] of Object.entries(properties)) {
      if (!isComplexType(def.type)) continue;
      if (nextRaw[key] === undefined) {
        const v = values[key];
        nextRaw[key] = v !== undefined ? JSON.stringify(v, null, 2) : "";
      }
    }
    setRawJsonValues(nextRaw);
  }, [properties, values]);

  const handleValueChange = (key: string, newValue: JSONValue) => {
    onChange({ ...values, [key]: newValue });
  };

  const items = useMemo(() => Object.entries(properties), [properties]);

  if (items.length === 0) return null;

  return (
    <div className={className}>
      {items.map(([fieldName, fieldSchema]) => {
        const fieldId = `field-${fieldName}`;
        const fieldTitle = fieldSchema.title || fieldName;
        const fieldType = fieldSchema.type || "string";
        const fieldDescription = fieldSchema.description || "";

        if (fieldType === "string") {
          return (
            <div key={fieldName} className="space-y-2">
              <label htmlFor={fieldId} className="text-sm font-medium">
                {fieldTitle}
                {required.has(fieldName) && (
                  <span className="text-destructive ml-1">*</span>
                )}
              </label>
              <Textarea
                id={fieldId}
                value={(values[fieldName] as string) || ""}
                onChange={(e) => handleValueChange(fieldName, e.target.value)}
                placeholder={
                  fieldDescription || `Enter ${fieldTitle.toLowerCase()}`
                }
                rows={3}
              />
              {fieldDescription && (
                <p className="text-xs text-muted-foreground">
                  {fieldDescription}
                </p>
              )}
            </div>
          );
        }

        if (fieldType === "number" || fieldType === "integer") {
          return (
            <div key={fieldName} className="space-y-2">
              <label htmlFor={fieldId} className="text-sm font-medium">
                {fieldTitle}
                {required.has(fieldName) && (
                  <span className="text-destructive ml-1">*</span>
                )}
              </label>
              <Input
                id={fieldId}
                type="number"
                value={
                  ((values[fieldName] as number) ?? "") as unknown as string
                }
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "") {
                    handleValueChange(fieldName, null);
                    return;
                  }
                  const parsed =
                    fieldType === "integer"
                      ? parseInt(val, 10)
                      : parseFloat(val);
                  handleValueChange(
                    fieldName,
                    Number.isNaN(parsed)
                      ? null
                      : (parsed as unknown as JSONValue),
                  );
                }}
                placeholder={
                  fieldDescription || `Enter ${fieldTitle.toLowerCase()}`
                }
                step={fieldType === "integer" ? "1" : "any"}
              />
              {fieldDescription && (
                <p className="text-xs text-muted-foreground">
                  {fieldDescription}
                </p>
              )}
            </div>
          );
        }

        if (fieldType === "boolean") {
          return (
            <div key={fieldName} className="space-y-2">
              <label htmlFor={fieldId} className="text-sm font-medium">
                {fieldTitle}
                {required.has(fieldName) && (
                  <span className="text-destructive ml-1">*</span>
                )}
              </label>
              <Select
                onValueChange={(value) =>
                  handleValueChange(fieldName, value === "true")
                }
                value={String(Boolean(values[fieldName]))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">True</SelectItem>
                  <SelectItem value="false">False</SelectItem>
                </SelectContent>
              </Select>
              {fieldDescription && (
                <p className="text-xs text-muted-foreground">
                  {fieldDescription}
                </p>
              )}
            </div>
          );
        }

        // Complex types: object / array / list[...] / map
        const { hint, placeholder } = getTypeHintAndPlaceholder(fieldType);
        const raw =
          rawJsonValues[fieldName] ??
          (values[fieldName] !== undefined
            ? JSON.stringify(values[fieldName], null, 2)
            : "");
        const hasError = Boolean(rawJsonErrors[fieldName]);

        return (
          <div key={fieldName} className="space-y-2">
            <label htmlFor={fieldId} className="text-sm font-medium">
              {fieldTitle} (JSON)
              {required.has(fieldName) && (
                <span className="text-destructive ml-1">*</span>
              )}
            </label>
            <Textarea
              id={fieldId}
              value={raw}
              onChange={(e) => {
                const text = e.target.value;
                setRawJsonValues((prev) => ({ ...prev, [fieldName]: text }));
                if (text.trim() === "") {
                  setRawJsonErrors((prev) => ({ ...prev, [fieldName]: null }));
                  // Clear value when empty
                  const next = { ...values };
                  delete next[fieldName];
                  onChange(next);
                  return;
                }
                try {
                  const parsed = JSON.parse(text);
                  setRawJsonErrors((prev) => ({ ...prev, [fieldName]: null }));
                  handleValueChange(fieldName, parsed);
                } catch {
                  setRawJsonErrors((prev) => ({
                    ...prev,
                    [fieldName]: "Invalid JSON",
                  }));
                }
              }}
              placeholder={fieldDescription || placeholder}
              className={`font-mono ${hasError ? "border-destructive focus-visible:ring-destructive" : ""}`}
              rows={3}
            />
            {hasError ? (
              <p className="text-xs text-destructive mt-1">
                {rawJsonErrors[fieldName]}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">{hint}</p>
            )}
            {fieldDescription && (
              <p className="text-xs text-muted-foreground">
                {fieldDescription}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
