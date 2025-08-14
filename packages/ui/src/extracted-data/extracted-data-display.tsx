import { useState, useMemo } from "react";
import type { ExtractedDataDisplayProps } from "./types";
import { PropertyRenderer } from "./property-renderer";
import {
  getFieldDisplayInfo,
  getFieldLabelClasses,
  getFieldLabelText,
} from "./field-display-utils";
import { reconcileDataWithJsonSchema } from "./schema-reconciliation";

export function ExtractedDataDisplay({
  extractedData,
  emptyMessage = "No extracted data available",
  onChange,
  editable = true,
  jsonSchema,
}: ExtractedDataDisplayProps) {
  const [changedPaths, setChangedPaths] = useState<Set<string>>(new Set());

  // Extract data from extractedData
  const { data } = extractedData;

  // Perform schema reconciliation if schema is provided
  const reconciliationResult = useMemo(() => {
    if (!jsonSchema) {
      return null;
    }
    return reconcileDataWithJsonSchema(
      data as Record<string, unknown>,
      jsonSchema
    );
  }, [data, jsonSchema]);

  // Use reconciled data if available, otherwise use original data
  const displayData = reconciliationResult?.data || data;
  const fieldMetadata = reconciliationResult?.metadata || {};
  const validationErrors = reconciliationResult?.validationErrors || [];

  const renderFieldLabel = (key: string, additionalClasses?: string) => {
    const fieldInfo = getFieldDisplayInfo(
      key,
      fieldMetadata,
      validationErrors,
      [key]
    );
    const baseClasses = getFieldLabelClasses(fieldInfo);
    const finalClasses = additionalClasses
      ? `${baseClasses} ${additionalClasses}`
      : baseClasses;

    return <div className={finalClasses}>{getFieldLabelText(fieldInfo)}</div>;
  };

  if (!displayData || Object.keys(displayData).length === 0) {
    return (
      <div className="text-sm text-gray-500 text-center py-4">
        {emptyMessage}
      </div>
    );
  }

  const handleUpdate = (
    path: string[],
    newValue: unknown,
    additionalPaths?: string[][]
  ) => {
    if (!editable || !onChange) return;

    const newData = { ...(data as Record<string, unknown>) };
    let current: Record<string, unknown> = newData;

    // Navigate to the parent of the target property
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]] as Record<string, unknown>;
    }

    // Set the new value
    current[path[path.length - 1]] = newValue;

    // Track changed paths - main path and any additional paths
    const pathsToTrack = [path, ...(additionalPaths || [])];

    setChangedPaths((prev) => {
      const newSet = new Set(prev);
      pathsToTrack.forEach((p) => {
        newSet.add(p.join("."));
      });
      return newSet;
    });

    onChange(newData);
  };

  return (
    <div>
      {Object.keys(jsonSchema?.properties || {}).map((key) => {
        const value = (displayData as Record<string, unknown>)[key];
        // If the value is an array of objects, show key on separate line with table below
        if (
          Array.isArray(value) &&
          value.length > 0 &&
          typeof value[0] === "object" &&
          value[0] !== null
        ) {
          return (
            <div key={key}>
              {renderFieldLabel(key)}
              <div>
                <PropertyRenderer
                  keyPath={[key]}
                  value={value}
                  onUpdate={handleUpdate}
                  changedPaths={changedPaths}
                  metadata={{
                    schema: fieldMetadata,
                    extracted: extractedData.field_metadata,
                  }}
                  validationErrors={validationErrors}
                />
              </div>
            </div>
          );
        }
        // If the value is an object, show key on separate line
        else if (typeof value === "object" && value !== null) {
          return (
            <div key={key}>
              {renderFieldLabel(key)}
              <PropertyRenderer
                keyPath={[key]}
                value={value}
                onUpdate={handleUpdate}
                changedPaths={changedPaths}
                metadata={{
                  schema: fieldMetadata,
                  extracted: extractedData.field_metadata,
                }}
                validationErrors={validationErrors}
              />
            </div>
          );
        } else {
          // For primitive values and primitive arrays, show key and value on same line
          return (
            <div key={key}>
              <div className="flex items-start gap-6">
                {renderFieldLabel(key, "min-w-0 flex-shrink-0")}
                <div className="flex-1 min-w-0">
                  <PropertyRenderer
                    keyPath={[key]}
                    value={value}
                    onUpdate={handleUpdate}
                    changedPaths={changedPaths}
                    metadata={{
                      schema: fieldMetadata,
                      extracted: extractedData.field_metadata,
                    }}
                    validationErrors={validationErrors}
                  />
                </div>
              </div>
            </div>
          );
        }
      })}
    </div>
  );
}
