import type {
  TypedAgentData,
  ExtractedData,
  FilterOperation,
} from "llama-cloud-services/beta/agent";
import { ItemGrid } from "./item-grid";
import {
  createExtractedDataColumn,
  EXTRACTED_DATA_COLUMN_NAMES,
} from "./extracted-data-columns";
import type { Column, BuiltInColumnConfig } from "./types";
import { useUIConfigStore } from "../store/ui-config-store";

export interface ExtractedDataItemGridProps<T> {
  // Custom columns (displayed first)
  customColumns?: Column<ExtractedData<T>>[];
  // Built-in columns configuration
  builtInColumns?: BuiltInColumnConfig<ExtractedData<T>>;
  // Row click event
  onRowClick?: (item: TypedAgentData<ExtractedData<T>>) => void;
  // Other configurations
  defaultPageSize?: number;
  // Optional base filter to be passed to search API
  filter?: Record<string, FilterOperation>;
  // Styling (forwarded to ItemGrid)
  className?: string;
  style?: React.CSSProperties;
}

export function ExtractedDataItemGrid<T>({
  customColumns = [],
  builtInColumns = {},
  onRowClick,
  defaultPageSize = 20,
  filter,
  className,
  style,
}: ExtractedDataItemGridProps<T>) {
  const confidenceThreshold = useUIConfigStore(
    (state) => state.confidenceThreshold
  );
  // Generate final columns array
  const columns: Column<ExtractedData<T>>[] = [];

  // Add custom columns first
  columns.push(...customColumns);

  // Add built-in columns in defined order
  EXTRACTED_DATA_COLUMN_NAMES.forEach((name) => {
    const config = builtInColumns[name as keyof typeof builtInColumns];
    if (config !== false && config !== undefined) {
      try {
        const builtInColumn = createExtractedDataColumn<T>(
          name,
          config,
          confidenceThreshold
        );
        columns.push(builtInColumn);
      } catch {
        // Skip disabled columns
      }
    }
  });

  return (
    <ItemGrid<ExtractedData<T>>
      customColumns={columns}
      onRowClick={onRowClick}
      defaultPageSize={defaultPageSize}
      filter={filter}
      className={className}
      style={style}
    />
  );
}
