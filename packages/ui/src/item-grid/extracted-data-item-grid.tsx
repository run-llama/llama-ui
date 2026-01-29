import type { FilterOperation, AgentDataItem } from "@/src/lib/agent-data";
import { ItemGrid } from "./item-grid";
import {
  createExtractedDataColumn,
  EXTRACTED_DATA_COLUMN_NAMES,
} from "./extracted-data-columns";
import type { Column, BuiltInColumnConfig } from "./types";
import { useUIConfigStore } from "../store/ui-config-store";

export interface ExtractedDataItemGridProps {
  // Custom columns (displayed first)
  customColumns?: Column[];
  // Built-in columns configuration
  builtInColumns?: BuiltInColumnConfig;
  // Row click event
  onRowClick?: (item: AgentDataItem) => void;
  // Other configurations
  defaultPageSize?: number;
  // Optional base filter to be passed to search API
  filter?: Record<string, FilterOperation>;
  // Styling (forwarded to ItemGrid)
  className?: string;
  style?: React.CSSProperties;
}

export function ExtractedDataItemGrid({
  customColumns = [],
  builtInColumns = {},
  onRowClick,
  defaultPageSize = 20,
  filter,
  className,
  style,
}: ExtractedDataItemGridProps) {
  const confidenceThreshold = useUIConfigStore(
    (state) => state.confidenceThreshold
  );
  // Generate final columns array
  const columns: Column[] = [];

  // Add custom columns first
  columns.push(...customColumns);

  // Add built-in columns in defined order
  EXTRACTED_DATA_COLUMN_NAMES.forEach((name) => {
    const config = builtInColumns[name as keyof typeof builtInColumns];
    if (config !== false && config !== undefined) {
      try {
        const builtInColumn = createExtractedDataColumn(
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
    <ItemGrid
      customColumns={columns}
      onRowClick={onRowClick}
      defaultPageSize={defaultPageSize}
      filter={filter}
      className={className}
      style={style}
    />
  );
}
