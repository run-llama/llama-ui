import { EditableField } from "../editable-field";
import { TableRenderer } from "../table-renderer";
import { ListRenderer } from "../list-renderer";
import {
  isPropertyChanged,
  isArrayOfObjects,
  shouldShowKeyOnSeparateLine,
} from "./property-renderer-utils";
import type {
  FieldSchemaMetadata,
  ValidationError,
} from "../schema-reconciliation";
import type { JSONObject, RendererMetadata, PrimitiveValue } from "../types";
import type { ExtractedFieldMetadata } from "llama-cloud-services/beta/agent";
import {
  getFieldDisplayInfo,
  getFieldLabelClasses,
  getFieldLabelText,
} from "../field-display-utils";
import { PrimitiveType, toPrimitiveType } from "../primitive-validation";
import { findFieldSchemaMetadata } from "../metadata-path-utils";
import { findExtractedFieldMetadata } from "../metadata-lookup";

interface PropertyRendererProps<S extends JSONObject> {
  keyPath: string[];
  value: S;
  onUpdate: (path: string[], newValue: S, additionalPaths?: string[][]) => void;

  changedPaths?: Set<string>;
  // Unified metadata
  metadata?: RendererMetadata;
  validationErrors?: ValidationError[];
  // Field click callback
  onClickField?: (args: { value: PrimitiveValue; metadata?: ExtractedFieldMetadata; path: string[] }) => void;
}

export function PropertyRenderer<S extends JSONObject>({
  keyPath,
  value,
  onUpdate,
  changedPaths,
  metadata,
  validationErrors = [],
  onClickField,
}: PropertyRendererProps<S>) {
  const pathString = keyPath.join(".");
  const isChanged = isPropertyChanged(changedPaths, keyPath);
  const effectiveMetadata: RendererMetadata = {
    schema: metadata?.schema ?? ({} as Record<string, FieldSchemaMetadata>),
    extracted: metadata?.extracted ?? {},
  };

  // Get metadata for path
  const getMetadata = (path: string | string[]) => {
    if (effectiveMetadata.extracted) {
      return findExtractedFieldMetadata(path, effectiveMetadata.extracted);
    }
    return undefined;
  };

  // Handle field click
  const handleFieldClick = (args: { value: PrimitiveValue; metadata?: ExtractedFieldMetadata }) => {
    onClickField?.({ value: args.value, metadata: args.metadata, path: keyPath });
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
    const fieldInfo = findFieldSchemaMetadata(
      keyPath,
      effectiveMetadata.schema
    );
    const expectedType = fieldInfo?.schemaType
      ? toPrimitiveType(fieldInfo.schemaType)
      : PrimitiveType.STRING;
    const isRequired = fieldInfo?.isRequired || false;

    return (
      <EditableField
        value="N/A"
        onSave={(newValue) => onUpdate(keyPath, newValue as S)}
        metadata={getMetadata(pathString)}
        isChanged={isChanged}
        expectedType={expectedType}
        required={isRequired}
        onClick={handleFieldClick}
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
            onUpdate(keyPath, newArray as S, [newItemPath]);
          }}
          changedPaths={changedPaths}
          keyPath={keyPath}
          metadata={{ schema: effectiveMetadata.schema, extracted: {} }}
        />
      );
    }

    // Check if it's an array of objects
    if (isArrayOfObjects(value)) {
      // For arrays of objects, we want to show the table below the key
      // This will be handled by the parent component
      return (
        <TableRenderer<Record<string, JSONObject>>
          data={value as Array<Record<string, JSONObject>>}
          onUpdate={(index, key, newValue, affectedPaths) => {
            const newArray = [...(value as Array<Record<string, JSONObject>>)];
            newArray[index] = { ...newArray[index], [key]: newValue };

            // Use the affectedPaths provided by TableRenderer for accurate path tracking
            if (affectedPaths && affectedPaths.length > 0) {
              // Convert relative paths to absolute paths for ExtractedDataDisplay context
              const absolutePaths = affectedPaths.map((path) => {
                // path format: "0.contact.email" -> convert to ["keyPath", "0", "contact", "email"]
                const pathParts = path.split(".");
                return [...keyPath, ...pathParts];
              });
              onUpdate(keyPath, newArray as S, absolutePaths);
            } else {
              // Fallback for backward compatibility
              const cellPath = [...keyPath, String(index), key];
              onUpdate(keyPath, newArray as S, [cellPath]);
            }
          }}
          onAddRow={(newRow) => {
            const newArray = [
              ...(value as Array<Record<string, JSONObject>>),
              newRow,
            ];

            // Track the array change and the new row
            const newRowPath = [...keyPath, String(value.length)];
            onUpdate(keyPath, newArray as S, [newRowPath]);
          }}
          onDeleteRow={(index) => {
            const newArray = (
              value as Array<Record<string, JSONObject>>
            ).filter((_, i) => i !== index);

            // Track the array change - when deleting, we track the entire array as changed
            onUpdate(keyPath, newArray as S, [keyPath]);
          }}
          changedPaths={changedPaths}
          keyPath={keyPath}
          metadata={{
            schema: effectiveMetadata.schema,
            extracted: effectiveMetadata.extracted,
          }}
          validationErrors={validationErrors}
          onClickField={onClickField}
        />
      );
    } else {
      // Array of primitives
      return (
        <ListRenderer<PrimitiveValue>
          data={value as PrimitiveValue[]}
          onUpdate={(index, newValue) => {
            const newArray = [...value];
            newArray[index] = newValue;

            // Track both the array change and the specific item change
            const itemPath = [...keyPath, String(index)];
            onUpdate(keyPath, newArray as S, [itemPath]);
          }}
          onAdd={(newValue) => {
            const newArray = [...value, newValue];

            // Track the array change and the new item
            const newItemPath = [...keyPath, String(value.length)];
            onUpdate(keyPath, newArray as S, [newItemPath]);
          }}
          onDelete={(index) => {
            const newArray = value.filter((_, i) => i !== index);

            // Track the array change - when deleting, we track the entire array as changed
            onUpdate(keyPath, newArray as S, [keyPath]);
          }}
          changedPaths={changedPaths}
          keyPath={keyPath}
          metadata={{
            schema: effectiveMetadata.schema,
            extracted: effectiveMetadata.extracted,
          }}
          onClickField={onClickField}
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
                    <PropertyRenderer<S>
                      keyPath={[...keyPath, key]}
                      value={val as S}
                      onUpdate={onUpdate}
                      changedPaths={changedPaths}
                      metadata={effectiveMetadata}
                      validationErrors={validationErrors}
                      onClickField={onClickField}
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
                      <PropertyRenderer<S>
                        keyPath={[...keyPath, key]}
                        value={val as S}
                        onUpdate={onUpdate}
                        changedPaths={changedPaths}
                        metadata={effectiveMetadata}
                        validationErrors={validationErrors}
                        onClickField={onClickField}
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
  const fieldInfo = findFieldSchemaMetadata(keyPath, effectiveMetadata.schema);
  const expectedType = fieldInfo?.schemaType
    ? toPrimitiveType(fieldInfo.schemaType)
    : PrimitiveType.STRING;
  const isRequired = fieldInfo?.isRequired || false;

  return (
    <EditableField
      value={value}
      onSave={(newValue) => onUpdate(keyPath, newValue as S)}
      metadata={getMetadata(pathString)}
      isChanged={isChanged}
      expectedType={expectedType}
      required={isRequired}
      onClick={handleFieldClick}
    />
  );
}
