import { describe, it, expect, vi } from "vitest";
import {
  createExtractedDataColumn,
  EXTRACTED_DATA_COLUMN_NAMES,
  getExtractedDataItemsToReviewCount,
} from "../../src/item-grid/extracted-data-columns";
import type {
  ExtractedData,
  TypedAgentData,
} from "llama-cloud-services/beta/agent";
import { JSONObject } from "@/src";

// Mock the components
vi.mock("../../src/item-grid/components/status-components", () => ({
  ReviewStatusBadge: vi.fn(({ value }) => (
    <span data-testid="status-badge">{value}</span>
  )),
  FormattedDate: vi.fn(({ value }) => (
    <span data-testid="formatted-date">{value}</span>
  )),
}));

vi.mock("../../src/item-grid/components/action-button", () => ({
  ActionButton: vi.fn(({ onDelete }) => (
    <button data-testid="action-button" onClick={onDelete}>
      Delete
    </button>
  )),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
  },
}));

vi.mock("../../src/item-grid/built-in-columns", () => ({
  getItemsToReviewCount: vi.fn(() => 5),
  STATUS_OPTIONS: [
    { value: "pending_review", label: "In Review" },
    { value: "approved", label: "Accepted" },
    { value: "rejected", label: "Rejected" },
  ],
}));

describe("extracted-data-columns", () => {
  const mockItem: TypedAgentData<ExtractedData<Record<string, unknown>>> = {
    id: "test-id",
    deploymentName: "test-agent",
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-01T00:00:00Z"),
    data: {
      file_name: "test-document.pdf",
      status: "pending_review",
      field_metadata: {},
      original_data: {},
      data: {},
    } as any,
  };

  describe("EXTRACTED_DATA_COLUMN_NAMES", () => {
    it("contains all expected column names", () => {
      expect(EXTRACTED_DATA_COLUMN_NAMES).toEqual([
        "fileName",
        "status",
        "itemsToReview",
        "createdAt",
        "actions",
      ]);
    });
  });

  describe("createExtractedDataColumn", () => {
    it("creates fileName column correctly", () => {
      const column = createExtractedDataColumn("fileName", true);

      expect(column.key).toBe("file_name");
      expect(column.header).toBe("File Name");
      expect(column.sortable).toBe(true);
      expect(typeof column.getValue).toBe("function");
    });

    it("creates status column correctly", () => {
      const column = createExtractedDataColumn("status", true);

      expect(column.key).toBe("status");
      expect(column.header).toBe("Status");
      expect(column.filterable).toBe(true);
      expect(column.sortable).toBe(true);
      expect(column.filterOptions).toEqual([
        "pending_review",
        "approved",
        "rejected",
      ]);
      expect(typeof column.renderCell).toBe("function");
    });

    it("creates itemsToReview column correctly", () => {
      const column = createExtractedDataColumn("itemsToReview", true);

      expect(column.key).toBe("items_to_review");
      expect(column.header).toBe("Items to Review");
      expect(column.sortable).toBe(false);
      expect(typeof column.getValue).toBe("function");
      expect(typeof column.renderCell).toBe("function");
    });

    it("creates createdAt column correctly", () => {
      const column = createExtractedDataColumn("createdAt", true);

      expect(column.key).toBe("created_at");
      expect(column.header).toBe("Created At");
      expect(column.sortable).toBe(true);
      expect(typeof column.getValue).toBe("function");
      expect(typeof column.renderCell).toBe("function");
    });

    it("creates actions column correctly", () => {
      const column = createExtractedDataColumn("actions", true);

      expect(column.key).toBe("actions");
      expect(column.header).toBe("");
      expect(typeof column.getValue).toBe("function");
      expect(typeof column.renderCell).toBe("function");
    });

    it("applies custom configuration overrides", () => {
      const customConfig = {
        header: "Custom Header",
        sortable: false,
      };

      const column = createExtractedDataColumn("fileName", customConfig);

      expect(column.header).toBe("Custom Header");
      expect(column.sortable).toBe(false);
    });

    it("throws error for unknown column name", () => {
      expect(() => {
        createExtractedDataColumn("unknownColumn" as any, true);
      }).toThrow("Unknown extracted-data column: unknownColumn");
    });

    it("throws error when column is disabled", () => {
      expect(() => {
        createExtractedDataColumn("fileName", false);
      }).toThrow("Column fileName is disabled");
    });
  });

  describe("column functionality", () => {
    it("fileName column getValue returns file_name from data", () => {
      const column = createExtractedDataColumn("fileName", true);
      const value = column.getValue(mockItem);

      expect(value).toBe("test-document.pdf");
    });

    it("status column getValue returns status from data", () => {
      const column = createExtractedDataColumn("status", true);
      const value = column.getValue(mockItem);

      expect(value).toBe("pending_review");
    });

    it("createdAt column getValue returns createdAt from item", () => {
      const column = createExtractedDataColumn("createdAt", true);
      const value = column.getValue(mockItem);

      // Check that it's a valid ISO string format
      expect(value).toMatch(/^2024-01-01T00:00:00\.\d{3}Z$/);
      expect(value).toContain("2024-01-01T00:00:00");
      expect(value).toContain("Z");
    });

    it("actions column getValue returns the entire item", () => {
      const column = createExtractedDataColumn("actions", true);
      const value = column.getValue(mockItem);

      expect(value).toBe(mockItem);
    });
  });

  describe("getItemsToReviewCount", () => {
    it("returns 0 when no field_metadata", () => {
      const item = { data: {}, status: "completed" } as unknown as any;
      expect(getExtractedDataItemsToReviewCount(item)).toBe(0);
    });

    it("counts only leaf confidence values below threshold", () => {
      const item: TypedAgentData<ExtractedData<JSONObject>> = {
        id: "test-id",
        deploymentName: "test-agent",
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
        data: {
          data: {},
          original_data: {},
          status: "pending_review",
          field_metadata: {
            a: { confidence: 0.85 }, // leaf, low
            b: { confidence: 0.95 }, // leaf, high
            c: {
              // not leaf due to nested object
              confidence: 0.2,
              nested: { x: 1 },
            },
            d: {
              // nested structure with a leaf
              inner: { confidence: 0.1 },
            },
            e: [
              { confidence: 0.5 }, // leaf in array, low
              { confidence: 0.99 }, // leaf in array, high
            ],
          },
        },
      };

      expect(getExtractedDataItemsToReviewCount(item)).toBe(3);
    });
  });
});
