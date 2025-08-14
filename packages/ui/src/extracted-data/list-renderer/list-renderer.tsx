import { EditableField } from "../editable-field";
import { Table, TableBody, TableCell, TableRow } from "@/base/table";
import { Button } from "@/base/button";
import {
  isArrayItemChanged,
  getArrayItemDefaultValue,
} from "./list-renderer-utils";
import { Plus, Trash2 } from "lucide-react";
import { PrimitiveType, toPrimitiveType } from "../primitive-validation";
import type { FieldSchemaMetadata } from "../schema-reconciliation";
import type { PrimitiveValue, RendererMetadata } from "../types";
import type { ExtractedFieldMetadata } from "llama-cloud-services/beta/agent";
import { findFieldSchemaMetadata } from "../metadata-path-utils";
import { findExtractedFieldMetadata } from "../metadata-lookup";

interface ListRendererProps<S extends PrimitiveValue> {
  data: S[];
  onUpdate: (index: number, value: S) => void;
  onAdd?: (value: S) => void;
  onDelete?: (index: number) => void;

  changedPaths?: Set<string>;
  keyPath?: string[];
  // Unified metadata
  metadata?: RendererMetadata;
  // Field click callback
  onClickField?: (args: { value: PrimitiveValue; metadata?: ExtractedFieldMetadata; path: string[] }) => void;
}

export function ListRenderer<S extends PrimitiveValue>({
  data,
  onUpdate,
  onAdd,
  onDelete,
  changedPaths,
  keyPath = [],
  metadata,
  onClickField,
}: ListRendererProps<S>) {
  const effectiveSchema: Record<string, FieldSchemaMetadata> =
    metadata?.schema ?? {};
  const effectiveExtracted = metadata?.extracted ?? {};
  const handleAdd = () => {
    // Get smart default value based on field metadata
    const defaultValue = getArrayItemDefaultValue(keyPath, effectiveSchema);
    onAdd?.(defaultValue as S);
  };

  const handleDelete = (index: number) => {
    onDelete?.(index);
  };

  // UNIFIED LIST RENDERER FIELD TYPE LOOKUP
  // =======================================
  // Use the same normalized path lookup as table-renderer.
  // For list items, we look up the schema using "*" wildcard syntax.
  // Example: ["tags"] → ["tags", "*"] → "tags.*"
  const getExpectedType = (): PrimitiveType => {
    const itemFieldPath = [...keyPath, "*"];
    const itemMetadata = findFieldSchemaMetadata(
      itemFieldPath,
      effectiveSchema
    );

    if (itemMetadata?.schemaType) {
      return toPrimitiveType(itemMetadata.schemaType);
    }

    return PrimitiveType.STRING; // Default fallback
  };

  const expectedType = getExpectedType();

  // Handle field click
  const handleFieldClick = (args: { value: PrimitiveValue; metadata?: ExtractedFieldMetadata }, index: number) => {
    onClickField?.({ value: args.value, metadata: args.metadata, path: [...keyPath, String(index)] });
  };

  if (!data || data.length === 0) {
    return (
      <div className="border rounded-md bg-white p-4">
        <div className="text-gray-500 text-sm mb-3">Empty array</div>
        {onAdd && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleAdd}
            className="text-blue-600 border-blue-200 hover:bg-blue-50 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="border rounded-md bg-white overflow-auto">
      <Table className="table-auto">
        <TableBody>
          {data.map((item, index) => {
            // Check if this specific array item has been changed
            const isChanged = isArrayItemChanged(changedPaths, keyPath, index);

            // Create field click handler for this specific index
            const handleItemFieldClick = (args: { value: PrimitiveValue; metadata?: ExtractedFieldMetadata }) => {
              handleFieldClick(args, index);
            };

            return (
              <TableRow key={index} className="hover:bg-gray-50 border-0">
                <TableCell className="p-0 border-r border-gray-100 w-12 align-middle h-full">
                  <div className="w-full h-full border-b flex items-center justify-center text-sm text-gray-600 font-medium bg-gray-25 p-2">
                    {index + 1}
                  </div>
                </TableCell>
                <TableCell className="p-0 min-w-[120px] align-top h-full">
                  <EditableField<S>
                    value={item}
                    onSave={(newValue) => onUpdate(index, newValue)}
                    metadata={findExtractedFieldMetadata(
                      [...keyPath, String(index)],
                      effectiveExtracted
                    )}
                    isChanged={isChanged}
                    showBorder={true}
                    expectedType={expectedType}
                    required={
                      expectedType === PrimitiveType.NUMBER ||
                      expectedType === PrimitiveType.BOOLEAN
                    }
                    onClick={handleItemFieldClick}
                  />
                </TableCell>
                {onDelete && (
                  <TableCell className="p-0 w-12 align-middle h-full">
                    <div className="flex items-center justify-center border-b">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(index)}
                        className="h-9 w-9 text-red-500 hover:text-red-700 hover:bg-transparent cursor-pointer rounded-none"
                        title="Delete item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
          {onAdd && (
            <TableRow className="hover:bg-gray-50 border-0">
              <TableCell className="p-0 border-r border-gray-100 w-12 align-middle h-full"></TableCell>
              <TableCell className="p-0 min-w-[120px] align-top h-full"></TableCell>
              <TableCell colSpan={onDelete ? 3 : 2} className="text-center p-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAdd}
                  className="h-9 w-9 text-blue-600 border-blue-200 hover:bg-transparent cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
