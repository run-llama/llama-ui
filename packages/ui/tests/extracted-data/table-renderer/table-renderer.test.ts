import { describe, expect, it, vi } from "vitest";
import {
  formatFieldName,
  flattenObject,
  getValue,
  handleUpdate,
  isTableCellChanged,
  getTableRowDefaultValue,
  type ColumnDef,
} from "@/src/extracted-data/table-renderer/table-renderer-utils";

describe("TableRenderer Utilities", () => {
  describe("formatFieldName", () => {
    it("should format simple field names", () => {
      expect(formatFieldName("name")).toBe("Name");
      expect(formatFieldName("price")).toBe("Price");
    });

    it("should format field names with underscores", () => {
      expect(formatFieldName("first_name")).toBe("First Name");
      expect(formatFieldName("shipping_address")).toBe("Shipping Address");
    });

    it("should handle mixed case", () => {
      expect(formatFieldName("userName")).toBe("User Name");
      expect(formatFieldName("API_key")).toBe("API Key");
    });
  });

  describe("isTableCellChanged", () => {
    it("should return false when changedPaths is undefined", () => {
      const result = isTableCellChanged(undefined, [], 0, "name");
      expect(result).toBe(false);
    });

    it("should return false when changedPaths is empty", () => {
      const result = isTableCellChanged(new Set(), [], 0, "name");
      expect(result).toBe(false);
    });

    it("should return true when cell is changed", () => {
      const changedPaths = new Set(["0.name", "1.price"]);
      const result = isTableCellChanged(changedPaths, [], 0, "name");
      expect(result).toBe(true);
    });

    it("should return false when cell is not changed", () => {
      const changedPaths = new Set(["0.name", "1.price"]);
      const result = isTableCellChanged(changedPaths, [], 0, "description");
      expect(result).toBe(false);
    });

    it("should work with nested paths", () => {
      const changedPaths = new Set(["0.customer.name", "1.order.total"]);
      const result = isTableCellChanged(changedPaths, [], 0, "customer.name");
      expect(result).toBe(true);
    });

    it("should handle different row indices", () => {
      const changedPaths = new Set(["0.name", "2.name"]);

      expect(isTableCellChanged(changedPaths, [], 0, "name")).toBe(true);
      expect(isTableCellChanged(changedPaths, [], 1, "name")).toBe(false);
      expect(isTableCellChanged(changedPaths, [], 2, "name")).toBe(true);
    });

    it("should work with absolute paths (ExtractedDataDisplay context)", () => {
      const changedPaths = new Set(["items.0.description", "items.1.amount"]);

      expect(
        isTableCellChanged(changedPaths, ["items"], 0, "description"),
      ).toBe(true);
      expect(isTableCellChanged(changedPaths, ["items"], 1, "amount")).toBe(
        true,
      );
      expect(isTableCellChanged(changedPaths, ["items"], 0, "amount")).toBe(
        false,
      );
    });
  });

  describe("flattenObject", () => {
    it("should flatten simple object", () => {
      const obj = { name: "John", age: 30 };
      const result = flattenObject(obj);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        key: "name",
        header: "Name",
        path: ["name"],
        isLeaf: true,
      });
      expect(result[1]).toEqual({
        key: "age",
        header: "Age",
        path: ["age"],
        isLeaf: true,
      });
    });

    it("should flatten nested object", () => {
      const obj = {
        name: "John",
        address: {
          street: "123 Main St",
          city: "New York",
        },
      };
      const result = flattenObject(obj);

      expect(result).toHaveLength(3);
      expect(result.find((col) => col.key === "name")).toEqual({
        key: "name",
        header: "Name",
        path: ["name"],
        isLeaf: true,
      });
      expect(result.find((col) => col.key === "address.street")).toEqual({
        key: "address.street",
        header: "Street",
        path: ["address", "street"],
        isLeaf: true,
      });
      expect(result.find((col) => col.key === "address.city")).toEqual({
        key: "address.city",
        header: "City",
        path: ["address", "city"],
        isLeaf: true,
      });
    });

    it("should handle deep nested objects", () => {
      const obj = {
        user: {
          profile: {
            personal: {
              name: "John",
              age: 30,
            },
          },
        },
      };
      const result = flattenObject(obj);

      expect(result).toHaveLength(2);
      expect(
        result.find((col) => col.key === "user.profile.personal.name"),
      ).toEqual({
        key: "user.profile.personal.name",
        header: "Name",
        path: ["user", "profile", "personal", "name"],
        isLeaf: true,
      });
    });

    it("should skip null and undefined values", () => {
      const obj = {
        name: "John",
        age: null,
        email: undefined,
        address: {
          street: "123 Main St",
          city: null,
        },
      };
      const result = flattenObject(obj);

      expect(result).toHaveLength(2);
      expect(result.find((col) => col.key === "name")).toBeDefined();
      expect(result.find((col) => col.key === "address.street")).toBeDefined();
    });

    it("should skip arrays", () => {
      const obj = {
        name: "John",
        tags: ["tag1", "tag2"],
        items: [{ id: 1 }, { id: 2 }],
      };
      const result = flattenObject(obj);

      expect(result).toHaveLength(1);
      expect(result[0].key).toBe("name");
    });
  });

  describe("getValue", () => {
    it("should get simple field value", () => {
      const item = { name: "John", age: 30 };
      const column: ColumnDef = {
        key: "name",
        header: "Name",
        path: ["name"],
        isLeaf: true,
      };

      expect(getValue(item, column)).toBe("John");
    });

    it("should get nested field value", () => {
      const item = {
        name: "John",
        address: {
          street: "123 Main St",
          city: "New York",
        },
      };
      const column: ColumnDef = {
        key: "address.street",
        header: "Street",
        path: ["address", "street"],
        isLeaf: true,
      };

      expect(getValue(item, column)).toBe("123 Main St");
    });

    it("should return undefined for non-existent path", () => {
      const item = { name: "John" };
      const column: ColumnDef = {
        key: "address.street",
        header: "Street",
        path: ["address", "street"],
        isLeaf: true,
      };

      expect(getValue(item, column)).toBeUndefined();
    });

    it("should handle deep nested paths", () => {
      const item = {
        user: {
          profile: {
            personal: {
              name: "John",
            },
          },
        },
      };
      const column: ColumnDef = {
        key: "user.profile.personal.name",
        header: "Name",
        path: ["user", "profile", "personal", "name"],
        isLeaf: true,
      };

      expect(getValue(item, column)).toBe("John");
    });
  });

  describe("handleUpdate", () => {
    it("should handle simple field update", () => {
      const data = [{ name: "John", age: 30 }];
      const column: ColumnDef = {
        key: "name",
        header: "Name",
        path: ["name"],
        isLeaf: true,
      };
      const onUpdate = vi.fn();

      handleUpdate(0, column, "Jane", data, onUpdate);

      expect(onUpdate).toHaveBeenCalledWith(0, "name", "Jane", ["0.name"]);
    });

    it("should handle nested field update", () => {
      const data = [
        {
          name: "John",
          address: {
            street: "123 Main St",
            city: "New York",
          },
        },
      ];
      const column: ColumnDef = {
        key: "address.street",
        header: "Street",
        path: ["address", "street"],
        isLeaf: true,
      };
      const onUpdate = vi.fn();

      handleUpdate(0, column, "456 Oak Ave", data, onUpdate);

      expect(onUpdate).toHaveBeenCalledWith(
        0,
        "address",
        {
          street: "456 Oak Ave",
          city: "New York",
        },
        ["0.address.street"],
      );
    });

    it("should handle deep nested field update", () => {
      const data = [
        {
          user: {
            profile: {
              personal: {
                name: "John",
                age: 30,
              },
            },
          },
        },
      ];
      const column: ColumnDef = {
        key: "user.profile.personal.name",
        header: "Name",
        path: ["user", "profile", "personal", "name"],
        isLeaf: true,
      };
      const onUpdate = vi.fn();

      handleUpdate(0, column, "Jane", data, onUpdate);

      expect(onUpdate).toHaveBeenCalledWith(
        0,
        "user",
        {
          profile: {
            personal: {
              name: "Jane",
              age: 30,
            },
          },
        },
        ["0.user.profile.personal.name"],
      );
    });

    it("should create missing nested objects", () => {
      const data = [{ name: "John" }];
      const column: ColumnDef = {
        key: "address.street",
        header: "Street",
        path: ["address", "street"],
        isLeaf: true,
      };
      const onUpdate = vi.fn();

      handleUpdate(0, column, "123 Main St", data, onUpdate);

      expect(onUpdate).toHaveBeenCalledWith(
        0,
        "address",
        {
          street: "123 Main St",
        },
        ["0.address.street"],
      );
    });
  });

  describe("getTableRowDefaultValue", () => {
    it("should return empty object when no metadata provided", () => {
      const result = getTableRowDefaultValue(["items"], {});
      expect(result).toEqual({});
    });

    it("should return empty object when array metadata not found", () => {
      const fieldMetadata = {
        "other.field": {
          isRequired: true,
          isOptional: false,
          schemaType: "string",
          title: "Other",
          wasMissing: false,
        },
      };

      const result = getTableRowDefaultValue(["items"], fieldMetadata);
      expect(result).toEqual({});
    });

    it("should create default object for simple object array items", () => {
      const fieldMetadata = {
        "items.0.name": {
          isRequired: true,
          isOptional: false,
          schemaType: "string",
          title: "Name",
          wasMissing: false,
        },
        "items.0.price": {
          isRequired: true,
          isOptional: false,
          schemaType: "number",
          title: "Price",
          wasMissing: false,
        },
        "items.0.active": {
          isRequired: false,
          isOptional: true,
          schemaType: "boolean",
          title: "Active",
          wasMissing: false,
        },
      };

      const result = getTableRowDefaultValue(["items"], fieldMetadata);
      expect(result).toEqual({
        name: "",
        price: 0,
        active: false,
      });
    });

    it("should handle nested object fields", () => {
      const fieldMetadata = {
        "orders.0.customer.name": {
          isRequired: true,
          isOptional: false,
          schemaType: "string",
          title: "Customer Name",
          wasMissing: false,
        },
        "orders.0.customer.email": {
          isRequired: true,
          isOptional: false,
          schemaType: "string",
          title: "Customer Email",
          wasMissing: false,
        },
        "orders.0.total": {
          isRequired: true,
          isOptional: false,
          schemaType: "number",
          title: "Total",
          wasMissing: false,
        },
      };

      const result = getTableRowDefaultValue(["orders"], fieldMetadata);
      expect(result).toEqual({
        customer: {
          name: "",
          email: "",
        },
        total: 0,
      });
    });

    it("should work with different keyPaths", () => {
      const fieldMetadata = {
        "user.preferences.items.0.name": {
          isRequired: true,
          isOptional: false,
          schemaType: "string",
          title: "Name",
          wasMissing: false,
        },
        "user.preferences.items.0.value": {
          isRequired: true,
          isOptional: false,
          schemaType: "number",
          title: "Value",
          wasMissing: false,
        },
      };

      const result = getTableRowDefaultValue(
        ["user", "preferences", "items"],
        fieldMetadata,
      );
      expect(result).toEqual({
        name: "",
        value: 0,
      });
    });

    it("should handle array and object schema types", () => {
      const fieldMetadata = {
        "items.0.tags": {
          isRequired: false,
          isOptional: true,
          schemaType: "array",
          title: "Tags",
          wasMissing: false,
        },
        "items.0.metadata": {
          isRequired: false,
          isOptional: true,
          schemaType: "object",
          title: "Metadata",
          wasMissing: false,
        },
        "items.0.name": {
          isRequired: true,
          isOptional: false,
          schemaType: "string",
          title: "Name",
          wasMissing: false,
        },
      };

      const result = getTableRowDefaultValue(["items"], fieldMetadata);
      expect(result).toEqual({
        tags: [],
        metadata: {},
        name: "",
      });
    });

    it("should ignore metadata from other arrays", () => {
      const fieldMetadata = {
        "items.0.name": {
          isRequired: true,
          isOptional: false,
          schemaType: "string",
          title: "Name",
          wasMissing: false,
        },
        "other.0.value": {
          isRequired: true,
          isOptional: false,
          schemaType: "number",
          title: "Value",
          wasMissing: false,
        },
      };

      const result = getTableRowDefaultValue(["items"], fieldMetadata);
      expect(result).toEqual({
        name: "",
      });
    });

    it("should handle unknown schema types as strings", () => {
      const fieldMetadata = {
        "items.0.unknown": {
          isRequired: true,
          isOptional: false,
          schemaType: "unknown",
          title: "Unknown",
          wasMissing: false,
        },
        "items.0.missing": {
          isRequired: true,
          isOptional: false,
          schemaType: "string",
          title: "Missing",
          wasMissing: false,
        },
      };

      const result = getTableRowDefaultValue(["items"], fieldMetadata);
      expect(result).toEqual({
        unknown: "",
        missing: "",
      });
    });
  });
});
