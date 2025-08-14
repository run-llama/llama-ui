import { EditableField } from "../editable-field";
import { TableRenderer } from "../table-renderer";
import { ListRenderer } from "../list-renderer";
import {
  isPropertyChanged,
  filterMetadataForArray,
  isArrayOfObjects,
  shouldShowKeyOnSeparateLine,
} from "./property-renderer-utils";
import type { FieldMetadata, ValidationError } from "../schema-reconciliation";
import type { RendererMetadata } from "../types";
import {
  getFieldDisplayInfo,
  getFieldLabelClasses,
  getFieldLabelText,
} from "../field-display-utils";
import { PrimitiveType, toPrimitiveType } from "../primitive-validation";
import { findFieldMetadata } from "../metadata-path-utils";
import { findExtractedFieldMetadata } from "../metadata-lookup";

interface PropertyRendererProps {
  keyPath: string[];
  value: unknown;
  onUpdate: (
    path: string[],
    newValue: unknown,
    additionalPaths?: string[][]
  ) => void;

  changedPaths?: Set<string>;
  // Unified metadata
  metadata?: RendererMetadata;
  validationErrors?: ValidationError[];
}

export function PropertyRenderer({
  keyPath,
  value,
  onUpdate,
  changedPaths,
  metadata,
  validationErrors = [],
}: PropertyRendererProps) {
  const pathString = keyPath.join(".");
  const isChanged = isPropertyChanged(changedPaths, keyPath);
  const effectiveMetadata: RendererMetadata = {
    schema: metadata?.schema ?? ({} as Record<string, FieldMetadata>),
    extracted: metadata?.extracted ?? {},
  };

  // Get metadata for path
  const getMetadata = (path: string | string[]) => {
    if (effectiveMetadata.extracted) {
      return findExtractedFieldMetadata(path, effectiveMetadata.extracted);
    }
    return undefined;
  };

  // Helper function to render field labels with schema info
  const renderFieldLabel = (
    key: string,
    currentKeyPath: string[],
    additionalClasses?: string
  ) => {
    const fieldInfo = getFieldDisplayInfo(
      key,
      effectiveMetadata.schema,
      validationErrors,
      currentKeyPath
    );
    const baseClasses = getFieldLabelClasses(fieldInfo);
    const finalClasses = additionalClasses
      ? `${baseClasses} ${additionalClasses}`
      : baseClasses;

    return <div className={finalClasses}>{getFieldLabelText(fieldInfo)}</div>;
  };

  if (value === null || value === undefined) {
    const fieldInfo = findFieldMetadata(keyPath, effectiveMetadata.schema);
    const expectedType = fieldInfo?.schemaType
      ? toPrimitiveType(fieldInfo.schemaType)
      : PrimitiveType.STRING;
    const isRequired = fieldInfo?.isRequired || false;

    return (
      <EditableField
        value="N/A"
        onSave={(newValue) => onUpdate(keyPath, newValue)}
        metadata={getMetadata(pathString)}
        isChanged={isChanged}
        expectedType={expectedType}
        required={isRequired}
      />
    );
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      // For empty arrays, still show the ListRenderer so users can add items
      return (
        <ListRenderer
          data={value}
          onUpdate={() => {}} // Empty array has no items to update
          onAdd={(newValue) => {
            const newArray = [newValue];

            // Track the array change and the new item
            const newItemPath = [...keyPath, "0"];
            onUpdate(keyPath, newArray, [newItemPath]);
          }}
          changedPaths={changedPaths}
          keyPath={keyPath}
          metadata={{ schema: effectiveMetadata.schema, extracted: {} }}
        />
      );
    }

    const arrayMetadata = filterMetadataForArray(
      effectiveMetadata.extracted,
      keyPath
    );

    // Check if it's an array of objects
    if (isArrayOfObjects(value)) {
      // For arrays of objects, we want to show the table below the key
      // This will be handled by the parent component
      return (
        <TableRenderer
          data={value as Record<string, unknown>[]}
          onUpdate={(index, key, newValue, affectedPaths) => {
            const newArray = [...value];
            newArray[index] = { ...newArray[index], [key]: newValue };

            // Use the affectedPaths provided by TableRenderer for accurate path tracking
            if (affectedPaths && affectedPaths.length > 0) {
              // Convert relative paths to absolute paths for ExtractedDataDisplay context
              const absolutePaths = affectedPaths.map((path) => {
                // path format: "0.contact.email" -> convert to ["keyPath", "0", "contact", "email"]
                const pathParts = path.split(".");
                return [...keyPath, ...pathParts];
              });
              onUpdate(keyPath, newArray, absolutePaths);
            } else {
              // Fallback for backward compatibility
              const cellPath = [...keyPath, String(index), key];
              onUpdate(keyPath, newArray, [cellPath]);
            }
          }}
          onAddRow={(newRow) => {
            const newArray = [...value, newRow];

            // Track the array change and the new row
            const newRowPath = [...keyPath, String(value.length)];
            onUpdate(keyPath, newArray, [newRowPath]);
          }}
          onDeleteRow={(index) => {
            const newArray = (value as Record<string, unknown>[]).filter(
              (_, i) => i !== index
            );

            // Track the array change - when deleting, we track the entire array as changed
            onUpdate(keyPath, newArray, [keyPath]);
          }}
          changedPaths={changedPaths}
          keyPath={keyPath}
          metadata={{
            schema: effectiveMetadata.schema,
            extracted: arrayMetadata,
          }}
          validationErrors={validationErrors}
        />
      );
    } else {
      // Array of primitives
      return (
        <ListRenderer
          data={value}
          onUpdate={(index, newValue) => {
            const newArray = [...value];
            newArray[index] = newValue;

            // Track both the array change and the specific item change
            const itemPath = [...keyPath, String(index)];
            onUpdate(keyPath, newArray, [itemPath]);
          }}
          onAdd={(newValue) => {
            const newArray = [...value, newValue];

            // Track the array change and the new item
            const newItemPath = [...keyPath, String(value.length)];
            onUpdate(keyPath, newArray, [newItemPath]);
          }}
          onDelete={(index) => {
            const newArray = value.filter((_, i) => i !== index);

            // Track the array change - when deleting, we track the entire array as changed
            onUpdate(keyPath, newArray, [keyPath]);
          }}
          changedPaths={changedPaths}
          keyPath={keyPath}
          metadata={{
            schema: effectiveMetadata.schema,
            extracted: arrayMetadata,
          }}
        />
      );
    }
  }

  if (typeof value === "object") {
    return (
      <div className="relative">
        <div className="pl-4 border-l-2 border-gray-200">
          {Object.entries(value).map(([key, val]) => {
            // If the value is an array of objects or object, show key on separate line
            if (shouldShowKeyOnSeparateLine(val)) {
              return (
                <div key={key}>
                  {renderFieldLabel(key, [...keyPath, key])}
                  <div className="mt-2">
                    <PropertyRenderer
                      keyPath={[...keyPath, key]}
                      value={val}
                      onUpdate={onUpdate}
                      changedPaths={changedPaths}
                      metadata={effectiveMetadata}
                      validationErrors={validationErrors}
                    />
                  </div>
                </div>
              );
            } else {
              // For primitive values and primitive arrays, show key and value on same line
              return (
                <div key={key}>
                  <div className="flex items-start gap-6">
                    {renderFieldLabel(
                      key,
                      [...keyPath, key],
                      "min-w-0 flex-shrink-0"
                    )}
                    <div className="flex-1 min-w-0">
                      <PropertyRenderer
                        keyPath={[...keyPath, key]}
                        value={val}
                        onUpdate={onUpdate}
                        changedPaths={changedPaths}
                        metadata={effectiveMetadata}
                        validationErrors={validationErrors}
                      />
                    </div>
                  </div>
                </div>
              );
            }
          })}
        </div>
      </div>
    );
  }

  // Primitive value
  const fieldInfo = findFieldMetadata(keyPath, effectiveMetadata.schema);
  const expectedType = fieldInfo?.schemaType
    ? toPrimitiveType(fieldInfo.schemaType)
    : PrimitiveType.STRING;
  const isRequired = fieldInfo?.isRequired || false;

  return (
    <EditableField
      value={value}
      onSave={(newValue) => onUpdate(keyPath, newValue)}
      metadata={getMetadata(pathString)}
      isChanged={isChanged}
      expectedType={expectedType}
      required={isRequired}
    />
  );
}
