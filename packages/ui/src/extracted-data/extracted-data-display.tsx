import { useState, useMemo } from "react";
import type {
  ExtractedDataDisplayProps,
  JsonObject,
  JsonShape,
  JsonValue,
} from "./types";
import { PropertyRenderer } from "./property-renderer";
import {
  getFieldDisplayInfo,
  getFieldLabelClasses,
  getFieldLabelText,
} from "./field-display-utils";
import { reconcileDataWithJsonSchema } from "./schema-reconciliation";

export function ExtractedDataDisplay<S extends JsonShape<S>>({
  extractedData,
  emptyMessage = "No extracted data available",
  onChange,
  editable = true,
  jsonSchema,
  onClickField,
  tableRowsPerPage = 10,
  listItemsPerPage = 10,
}: ExtractedDataDisplayProps<S>) {
  const [changedPaths, setChangedPaths] = useState<Set<string>>(new Set());

  // Extract data from extractedData
  const { data, field_metadata } = extractedData;

  // Perform schema reconciliation if schema is provided
  const reconciliationResult = useMemo(() => {
    if (!jsonSchema) {
      return null;
    }
    return reconcileDataWithJsonSchema<S>(data, jsonSchema);
  }, [data, jsonSchema]);

  // Use reconciled data if available, otherwise use original data
  const displayData = reconciliationResult?.data || data;
  const schemaMetadata = reconciliationResult?.schemaMetadata || {};
  const validationErrors = reconciliationResult?.validationErrors || [];

  const renderFieldLabel = (key: string, additionalClasses?: string) => {
    const fieldInfo = getFieldDisplayInfo(
      key,
      schemaMetadata,
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
    newValue: JsonValue,
    additionalPaths?: string[][]
  ) => {
    if (!editable || !onChange) return;

    const newData = { ...(data as JsonObject) };
    let current = newData;

    // Navigate to the parent of the target property
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]] as JsonObject;
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

    onChange(newData as S);
  };

  return (
    <div>
      {Object.keys(jsonSchema?.properties || {}).map((key) => {
        const value = (displayData as JsonObject)[key];
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
                <PropertyRenderer<JsonValue>
                  keyPath={[key]}
                  value={value}
                  onUpdate={handleUpdate}
                  changedPaths={changedPaths}
                  metadata={{
                    schema: schemaMetadata,
                    extracted: field_metadata,
                  }}
                  validationErrors={validationErrors}
                  onClickField={onClickField}
                  editable={editable}
                  tableRowsPerPage={tableRowsPerPage}
                  listItemsPerPage={listItemsPerPage}
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
              <PropertyRenderer<S>
                keyPath={[key]}
                value={value as S}
                onUpdate={handleUpdate}
                changedPaths={changedPaths}
                metadata={{
                  schema: schemaMetadata,
                  extracted: field_metadata,
                }}
                validationErrors={validationErrors}
                onClickField={onClickField}
                editable={editable}
                tableRowsPerPage={tableRowsPerPage}
                listItemsPerPage={listItemsPerPage}
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
                  <PropertyRenderer<S>
                    keyPath={[key]}
                    value={value}
                    onUpdate={handleUpdate}
                    changedPaths={changedPaths}
                    metadata={{
                      schema: schemaMetadata,
                      extracted: field_metadata,
                    }}
                    validationErrors={validationErrors}
                    onClickField={onClickField}
                    editable={editable}
                    tableRowsPerPage={tableRowsPerPage}
                    listItemsPerPage={listItemsPerPage}
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
