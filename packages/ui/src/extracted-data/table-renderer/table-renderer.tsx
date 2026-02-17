import type { ExtractedFieldMetadata } from "@/src/lib/agent-data";
import { Plus, Trash2 } from "lucide-react";
import React, { useMemo, useState } from "react";
import { Button } from "@/base/button";
import {
  Table,
  TableBody,
  CustomTableCell,
  TableHeader,
  TableRow,
  TableHead,
  TableCell,
} from "@/base/table";
import { Badge } from "@/base/badge";
import { DataPagination } from "../data-pagination";
import { EditableField } from "../editable-field";
import { getFieldDisplayInfo } from "../field-display-utils";
import { getConfidenceBorderClass } from "../confidence-utils";
import { findExtractedFieldMetadata } from "../metadata-lookup";
import {
  buildTableHeaderMetadataPath,
  findFieldSchemaMetadata,
} from "../metadata-path-utils";
import { useUIConfigStore } from "@/src/store/ui-config-store";
import { PrimitiveType, toPrimitiveType } from "../primitive-validation";
import { isArrayOfObjects } from "../property-renderer/property-renderer-utils";
import type {
  FieldSchemaMetadata,
  ValidationError,
} from "../schema-reconciliation";
import type {
  JsonObject,
  JsonValue,
  PrimitiveValue,
  RendererMetadata,
} from "../types";
import {
  type ColumnDef,
  flattenObject,
  getTableRowDefaultValue,
  getValue,
  handleUpdate,
  isTableCellChanged,
} from "./table-renderer-utils";

export interface TableRendererProps<Row extends JsonObject> {
  data: Row[];
  onUpdate?: (
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
  onHoverField?: (
    args: {
      value: PrimitiveValue;
      metadata?: ExtractedFieldMetadata;
      path: string[];
    } | null
  ) => void;
  editable?: boolean;
  tableRowsPerPage?: number;
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
  onHoverField,
  editable = true,
  tableRowsPerPage = 10,
}: TableRendererProps<Row>) {
  const [currentPage, setCurrentPage] = useState(1);
  const confidenceThreshold = useUIConfigStore(
    (state) => state.confidenceThreshold
  );
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
            result[key] = fillEmptyValues(value as JsonObject);
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
              style={rowSpan > 1 ? { height: `${rowSpan * 32}px` } : undefined}
              label={fieldInfo.name}
              badge={
                fieldInfo.isRequired ? <Badge label="Required" /> : undefined
              }
            />
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
      const firstRow = rows[0] as React.ReactElement<React.PropsWithChildren>;
      const modifiedFirstRow = React.cloneElement(firstRow, {
        children: [
          ...React.Children.toArray(firstRow.props.children),
          <TableHead
            key="delete-header"
            rowSpan={maxDepth}
            alignment="center"
            style={{ height: `${maxDepth * 32}px` }}
          />,
        ],
      });
      rows[0] = modifiedFirstRow;
    }

    return rows;
  };

  const visibleData = data.slice(
    (currentPage - 1) * tableRowsPerPage,
    currentPage * tableRowsPerPage
  );

  return (
    <>
      <DataPagination
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalItems={data.length}
        perPage={tableRowsPerPage}
      />
      <Table>
        <TableHeader>{generateHeaderRows()}</TableHeader>
        <TableBody>
          {visibleData.map((item, rowIndex) => (
            <TableRow key={rowIndex} state="hover">
              {columns.map((column, colIndex) => {
                const value = getValue(item, column) as
                  | PrimitiveValue
                  | JsonValue;
                const cellPath = [...keyPath, String(rowIndex), ...column.path];
                const isChanged = isTableCellChanged(
                  changedPaths,
                  keyPath,
                  rowIndex,
                  column.key
                );

                if (editable && Array.isArray(value)) {
                  return (
                    <TableCell
                      key={colIndex}
                      label="Editing nested lists/tables is not supported."
                    />
                  );
                }

                // If the value is an array of objects, render it recursively as a nested table
                if (Array.isArray(value) && isArrayOfObjects(value)) {
                  return (
                    <CustomTableCell key={colIndex}>
                      <TableRenderer<JsonObject>
                        data={value as JsonObject[]}
                        editable={false}
                        tableRowsPerPage={tableRowsPerPage}
                      />
                    </CustomTableCell>
                  );
                }

                // If the value is an array but not of objects, render each item individually
                if (Array.isArray(value)) {
                  return (
                    <CustomTableCell key={colIndex}>
                      <span className="text-sm">
                        {(value as PrimitiveValue[]).map((item, itemIdx) => {
                          const itemPath = [...cellPath, String(itemIdx)];
                          const itemMetadata = getMetadata(itemPath);
                          return (
                            <React.Fragment key={itemIdx}>
                              {itemIdx > 0 && ", "}
                              <span
                                className={`cursor-pointer hover:bg-gray-100 rounded px-0.5 ${getConfidenceBorderClass(confidenceThreshold, itemMetadata?.confidence)}`}
                                onClick={() =>
                                  onClickField?.({
                                    value: item,
                                    metadata: itemMetadata,
                                    path: itemPath,
                                  })
                                }
                                onMouseEnter={() =>
                                  onHoverField?.({
                                    value: item,
                                    metadata: itemMetadata,
                                    path: itemPath,
                                  })
                                }
                                onMouseLeave={() => onHoverField?.(null)}
                              >
                                {String(item ?? "")}
                              </span>
                            </React.Fragment>
                          );
                        })}
                      </span>
                    </CustomTableCell>
                  );
                }

                // Primitive or object leaf -> EditableField as before
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
                  <CustomTableCell key={colIndex}>
                    <EditableField<PrimitiveValue>
                      value={value as PrimitiveValue}
                      onSave={(newValue) =>
                        handleUpdate(
                          rowIndex,
                          column,
                          newValue,
                          data,
                          (idx, key, val, paths) =>
                            onUpdate?.(idx, key, val as JsonObject, paths)
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
                      onHover={(args) =>
                        args === null
                          ? onHoverField?.(null)
                          : onHoverField?.({
                              value: args.value,
                              metadata: args.metadata,
                              path: cellPath,
                            })
                      }
                      editable={editable}
                    />
                  </CustomTableCell>
                );
              })}
              {onDeleteRow && (
                <CustomTableCell>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDeleteRow(rowIndex)}
                    title="Delete row"
                    startIcon={<Trash2 className="text-destructive" />}
                  />
                </CustomTableCell>
              )}
            </TableRow>
          ))}
          {onAddRow && (
            <TableRow>
              {Array.from({ length: columns.length }).map((_, colIndex) => (
                <CustomTableCell key={colIndex} />
              ))}
              <CustomTableCell colSpan={columns.length + (onDeleteRow ? 1 : 0)}>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleAddRow}
                  startIcon={<Plus className="text-primary" />}
                />
              </CustomTableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </>
  );
}
