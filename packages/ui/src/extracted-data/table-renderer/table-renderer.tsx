import React, { useMemo } from "react";
import { EditableField } from "../editable-field";
import { Button } from "@/base/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/base/table";
import {
  type ColumnDef,
  flattenObject,
  getValue,
  handleUpdate,
  isTableCellChanged,
  getTableRowDefaultValue,
} from "./table-renderer-utils";
import type {
  FieldSchemaMetadata,
  ValidationError,
} from "../schema-reconciliation";
import type { RendererMetadata } from "../types";
import type { ExtractedFieldMetadata } from "llama-cloud-services/beta/agent";
import { getFieldDisplayInfo, getFieldLabelText } from "../field-display-utils";
import {
  buildTableHeaderMetadataPath,
  findFieldSchemaMetadata,
} from "../metadata-path-utils";
import { findExtractedFieldMetadata } from "../metadata-lookup";
import { Plus, Trash2 } from "lucide-react";
import { PrimitiveType, toPrimitiveType } from "../primitive-validation";
import type { PrimitiveValue, JsonValue, JsonObject } from "../types";

export interface TableRendererProps<Row extends JsonObject> {
  data: Row[];
  onUpdate: (
    index: number,
    key: string,
    value: JsonObject,
    affectedPaths?: string[]
  ) => void;
  onAddRow?: (newRow: Row) => void;
  onDeleteRow?: (index: number) => void;

  changedPaths?: Set<string>;
  keyPath?: string[];
  // Unified metadata
  metadata?: RendererMetadata;
  validationErrors?: ValidationError[];
  // Field click callback
  onClickField?: (args: {
    value: PrimitiveValue;
    metadata?: ExtractedFieldMetadata;
    path: string[];
  }) => void;
}

export function TableRenderer<Row extends JsonObject>({
  data,
  onUpdate,
  onAddRow,
  onDeleteRow,
  changedPaths,
  keyPath = [],
  metadata,
  validationErrors = [],
  onClickField,
}: TableRendererProps<Row>) {
  const effectiveMetadata: RendererMetadata = {
    schema: metadata?.schema ?? ({} as Record<string, FieldSchemaMetadata>),
    extracted: metadata?.extracted ?? {},
  };
  // Get metadata from extracted field metadata
  const getMetadata = (path: string | string[]) => {
    if (effectiveMetadata.extracted) {
      return findExtractedFieldMetadata(path, effectiveMetadata.extracted);
    }
    return undefined;
  };
  const handleAddRow = () => {
    // Try to get schema-based default values first
    const schemaBasedRow = getTableRowDefaultValue(
      keyPath,
      effectiveMetadata.schema
    );

    // If we got schema-based defaults and they're not empty, use them
    if (Object.keys(schemaBasedRow).length > 0) {
      onAddRow?.(schemaBasedRow as Row);
      return;
    }

    // Fallback to structure-based approach if no schema metadata available
    const newRow: Row = {} as Row;

    if (data.length > 0) {
      // If we have existing data, use the structure of the first row
      const firstRow = data[0];
      const fillEmptyValues = (obj: JsonObject): JsonObject => {
        const result: JsonObject = {};
        Object.keys(obj).forEach((key) => {
          const value = obj[key];
          if (
            value !== null &&
            typeof value === "object" &&
            !Array.isArray(value)
          ) {
            result[key] = fillEmptyValues(value);
          } else {
            result[key] = "";
          }
        });
        return result;
      };
      Object.assign(newRow, fillEmptyValues(firstRow) as Row);
    } else {
      // If no existing data, create structure based on columns
      columns.forEach((column) => {
        const setNestedValue = (
          obj: JsonObject,
          path: string[],
          value: JsonValue
        ) => {
          if (path.length === 1) {
            obj[path[0]] = value;
          } else {
            if (
              !obj[path[0]] ||
              typeof obj[path[0]] !== "object" ||
              Array.isArray(obj[path[0]])
            ) {
              obj[path[0]] = {};
            }
            setNestedValue(obj[path[0]] as JsonObject, path.slice(1), value);
          }
        };
        setNestedValue(newRow as JsonObject, column.path, "");
      });
    }

    onAddRow?.(newRow);
  };

  const handleDeleteRow = (index: number) => {
    onDeleteRow?.(index);
  };

  const { columns, maxDepth } = useMemo(() => {
    // Get all unique column definitions while preserving order
    const allColumns = new Map<string, ColumnDef>();
    const columnOrder: string[] = [];

    if (data && data.length > 0) {
      // If we have data, use the data to generate columns
      data.forEach((item) => {
        const itemColumns = flattenObject(item);
        itemColumns.forEach((col) => {
          if (!allColumns.has(col.key)) {
            allColumns.set(col.key, col);
            columnOrder.push(col.key);
          }
        });
      });
    } else if (
      effectiveMetadata.schema &&
      Object.keys(effectiveMetadata.schema).length > 0
    ) {
      // If no data but we have schema metadata, generate columns from schema
      Object.keys(effectiveMetadata.schema).forEach((path) => {
        // Only include paths that are for the current level (array items)
        // For array items, paths should start with keyPath followed by array index
        const pathParts = path.split(".");

        // Check if this field is for array items at our level
        if (pathParts.length > keyPath.length + 1) {
          // This is a field within array items (e.g., "items.0.name" where keyPath is ["items"])
          const fieldPath = pathParts.slice(keyPath.length + 1); // Remove keyPath and array index
          const fieldKey = fieldPath.join(".");

          if (!allColumns.has(fieldKey)) {
            const columnDef: ColumnDef = {
              key: fieldKey,
              header: fieldPath[fieldPath.length - 1], // Use the last part as header
              path: fieldPath,
              isLeaf: true, // Schema-generated columns are always leaf nodes
            };
            allColumns.set(fieldKey, columnDef);
            columnOrder.push(fieldKey);
          }
        }
      });
    }

    // If still no columns, return empty
    if (columnOrder.length === 0) {
      return { columns: [], maxDepth: 0 };
    }

    // Preserve the original order from the data or schema
    const columns = columnOrder.map((key) => allColumns.get(key)!);
    const maxDepth = Math.max(...columns.map((col) => col.path.length));

    return { columns, maxDepth };
  }, [data, effectiveMetadata.schema, keyPath]);

  // Generate header rows for each depth level
  const generateHeaderRows = (): React.ReactNode[] => {
    const rows: React.ReactNode[] = [];

    // If no columns or maxDepth is 0, return empty array
    if (maxDepth === 0 || columns.length === 0) {
      return rows;
    }

    // Track which cells are occupied by rowSpan from previous rows
    const occupiedCells: boolean[][] = Array(maxDepth)
      .fill(null)
      .map(() => Array(columns.length).fill(false));

    // For each depth level, create a row
    for (let depth = 0; depth < maxDepth; depth++) {
      const rowCells: React.ReactNode[] = [];
      let colIndex = 0;

      while (colIndex < columns.length) {
        // Skip cells that are occupied by rowSpan from previous rows
        if (occupiedCells[depth][colIndex]) {
          colIndex++;
          continue;
        }

        const column = columns[colIndex];

        if (depth < column.path.length) {
          // This column has a header at this depth
          const fieldKey = column.path[depth];
          const fieldKeyPath = buildTableHeaderMetadataPath(
            keyPath,
            column.path,
            depth
          );
          const fieldInfo = getFieldDisplayInfo(
            fieldKey,
            effectiveMetadata.schema,
            validationErrors,
            fieldKeyPath
          );
          const headerText = getFieldLabelText(fieldInfo);
          const isLeaf = depth === column.path.length - 1;

          // Calculate colSpan (how many columns this header should span horizontally)
          let colSpan = 1;
          let nextColIndex = colIndex + 1;

          // Count consecutive columns that have the same header at this depth
          while (nextColIndex < columns.length) {
            const nextColumn = columns[nextColIndex];

            if (
              depth < nextColumn.path.length &&
              nextColumn.path[depth] === column.path[depth]
            ) {
              // For depth > 0, also check if they have the same parent path
              if (
                depth === 0 ||
                column.path.slice(0, depth).join(".") ===
                  nextColumn.path.slice(0, depth).join(".")
              ) {
                colSpan++;
                nextColIndex++;
              } else {
                break;
              }
            } else {
              break;
            }
          }

          // Calculate rowSpan for leaf nodes (span down to the bottom)
          const rowSpan = isLeaf ? maxDepth - depth : 1;

          // Mark cells as occupied by this rowSpan
          if (rowSpan > 1) {
            for (let r = depth + 1; r < depth + rowSpan; r++) {
              for (let c = colIndex; c < colIndex + colSpan; c++) {
                occupiedCells[r][c] = true;
              }
            }
          }

          rowCells.push(
            <TableHead
              key={`${depth}-${colIndex}`}
              colSpan={colSpan}
              rowSpan={rowSpan}
              className="px-2 py-2 text-center border-r border-gray-200 border-b min-w-[80px] max-w-[200px] bg-gray-50"
              style={rowSpan > 1 ? { height: `${rowSpan * 32}px` } : undefined}
            >
              <div className="break-words text-zinc-900 font-semibold">
                {headerText}
              </div>
            </TableHead>
          );

          colIndex = nextColIndex;
        } else {
          // This column doesn't have a header at this depth
          // This should not happen with proper rowSpan implementation
          colIndex++;
        }
      }

      rows.push(<TableRow key={depth}>{rowCells}</TableRow>);
    }

    // Add delete column header to the first row if onDeleteRow is provided
    if (onDeleteRow && rows.length > 0) {
      const firstRow = rows[0] as React.ReactElement;
      const modifiedFirstRow = React.cloneElement(firstRow, {
        children: [
          ...React.Children.toArray(firstRow.props.children),
          <TableHead
            key="delete-header"
            rowSpan={maxDepth}
            className="px-2 py-2 text-center border-r border-gray-200 border-b w-12 bg-gray-50"
            style={{ height: `${maxDepth * 32}px` }}
          ></TableHead>,
        ],
      });
      rows[0] = modifiedFirstRow;
    }

    return rows;
  };

  return (
    <div className="border border-b-0 rounded-md bg-white">
      <Table className="table-auto">
        <TableHeader>{generateHeaderRows()}</TableHeader>
        <TableBody>
          {data.map((item, rowIndex) => (
            <TableRow key={rowIndex} className="hover:bg-gray-50 border-0">
              {columns.map((column, colIndex) => {
                const value = getValue(item, column) as PrimitiveValue;
                const cellPath = [...keyPath, String(rowIndex), ...column.path];
                const isChanged = isTableCellChanged(
                  changedPaths,
                  keyPath,
                  rowIndex,
                  column.key
                );

                // UNIFIED TABLE RENDERER FIELD TYPE LOOKUP
                // ========================================
                // Use normalized path lookup with "*" wildcard for all rows.
                // This ensures consistent type detection regardless of row index.
                // Example: ["users", "2", "name"] → ["users", "*", "name"] → "users.*.name"
                const fieldKeyPath = [...keyPath, "*", ...column.path];
                const fieldInfo = findFieldSchemaMetadata(
                  fieldKeyPath,
                  effectiveMetadata.schema
                );
                const expectedType = fieldInfo?.schemaType
                  ? toPrimitiveType(fieldInfo.schemaType)
                  : PrimitiveType.STRING;
                const isRequired = fieldInfo?.isRequired || false;

                return (
                  <TableCell
                    key={colIndex}
                    className="p-0 border-r border-gray-100 min-w-[80px] max-w-[200px]"
                  >
                    <EditableField<PrimitiveValue>
                      value={value}
                      onSave={(newValue) =>
                        handleUpdate(
                          rowIndex,
                          column,
                          newValue,
                          data,
                          (idx, key, val, paths) =>
                            onUpdate(idx, key, val as JsonObject, paths)
                        )
                      }
                      metadata={getMetadata(cellPath)}
                      isChanged={isChanged}
                      showBorder={true}
                      expectedType={expectedType}
                      required={isRequired}
                      onClick={(args) =>
                        onClickField?.({
                          value: args.value,
                          metadata: args.metadata,
                          path: cellPath,
                        })
                      }
                    />
                  </TableCell>
                );
              })}
              {onDeleteRow && (
                <TableCell className="p-0 border-r border-gray-100 border-b w-12">
                  <div className="w-full h-full flex items-center justify-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteRow(rowIndex)}
                      className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-transparent cursor-pointer"
                      title="Delete row"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
          {onAddRow && (
            <TableRow className="hover:bg-gray-50">
              {Array.from({ length: columns.length }).map((_, colIndex) => (
                <TableCell
                  key={colIndex}
                  className="p-0 border-b min-w-[80px] max-w-[200px]"
                ></TableCell>
              ))}
              <TableCell
                colSpan={columns.length + (onDeleteRow ? 1 : 0)}
                className="border-b text-center p-0"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAddRow}
                  className="text-blue-600 border-blue-200 hover:bg-transparent cursor-pointer"
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
