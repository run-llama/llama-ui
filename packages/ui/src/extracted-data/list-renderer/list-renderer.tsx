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
import { DataPagination } from "../data-pagination";
import { useState } from "react";
import { cn } from "@/lib/utils";

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
  onClickField?: (args: {
    value: PrimitiveValue;
    metadata?: ExtractedFieldMetadata;
    path: string[];
  }) => void;
  onHoverField?: (
    args: {
      value: PrimitiveValue;
      metadata?: ExtractedFieldMetadata;
      path: string[];
    } | null
  ) => void;
  editable?: boolean;
  listItemsPerPage?: number;
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
  onHoverField,
  editable = true,
  listItemsPerPage = 10,
}: ListRendererProps<S>) {
  const [currentPage, setCurrentPage] = useState(1);
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
  const handleFieldClick = (
    args: { value: PrimitiveValue; metadata?: ExtractedFieldMetadata },
    index: number
  ) => {
    onClickField?.({
      value: args.value,
      metadata: args.metadata,
      path: [...keyPath, String(index)],
    });
  };

  const handleFieldHover = (
    args: { value: PrimitiveValue; metadata?: ExtractedFieldMetadata } | null,
    index: number
  ) => {
    if (args === null) {
      onHoverField?.(null);
    } else {
      onHoverField?.({
        value: args.value,
        metadata: args.metadata,
        path: [...keyPath, String(index)],
      });
    }
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
            startIcon={<Plus className={cn(
              "size-4",
              "text-blue-600"
            )} />}
          />
        )}
      </div>
    );
  }

  const visibleData = data.slice(
    (currentPage - 1) * listItemsPerPage,
    currentPage * listItemsPerPage
  );

  return (
    <div className="border rounded-md bg-white overflow-auto">
      <DataPagination
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalItems={data.length}
        perPage={listItemsPerPage}
      />
      <Table className="table-auto">
        <TableBody>
          {visibleData.map((item, index) => {
            // Check if this specific array item has been changed
            const isChanged = isArrayItemChanged(changedPaths, keyPath, index);

            // Create field click handler for this specific index
            const handleItemFieldClick = (args: {
              value: PrimitiveValue;
              metadata?: ExtractedFieldMetadata;
            }) => {
              handleFieldClick(args, index);
            };

            const handleItemFieldHover = (
              args: {
                value: PrimitiveValue;
                metadata?: ExtractedFieldMetadata;
              } | null
            ) => {
              handleFieldHover(args, index);
            };

            return (
              <TableRow key={index} className="hover:bg-gray-50 border-0">
                <TableCell className="p-0 border-r border-gray-100 w-12 align-middle h-full">
                  <div className="w-full h-full border-b flex items-center justify-center text-sm text-gray-600 font-medium bg-gray-25 p-2 min-h-10">
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
                    onHover={handleItemFieldHover}
                    editable={editable}
                  />
                </TableCell>
                {onDelete && (
                  <TableCell className="p-0 w-12 align-middle h-full">
                    <div className="flex items-center justify-center border-b min-h-10">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDelete(index)}
                        title="Delete item"
                        startIcon={<Trash2 className={cn(
                          "text-red-500 hover:text-red-700"
                        )} />}
                      />
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
              <TableCell colSpan={onDelete ? 3 : 2} className="text-center p-0 h-10">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAdd}
                  startIcon={<Plus className={cn(
                    "size-4",
                    "text-blue-600"
                  )} />}
                />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
