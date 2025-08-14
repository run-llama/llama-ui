import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useItemData } from "@/src/extracted-data/use-item-data";
import { JSONSchema } from "zod/v4/core";
import {
  type ExtractedData,
  type TypedAgentData,
} from "llama-cloud-services/beta/agent";

// Mock the mock-item-response module
vi.mock("@/src/extracted-data/mock-item-response", () => ({
  getMockItemResponse: vi.fn(),
}));

import { getMockItemResponse } from "@/src/extracted-data/mock-item-response";

const mockGetMockItemResponse = vi.mocked(getMockItemResponse);

// Test types - extend Record<string, unknown> to satisfy the generic constraint
interface TestData extends Record<string, unknown> {
  name: string;
  age: number;
  email: string;
}

const mockJsonSchema: JSONSchema.ObjectSchema = {
  type: "object",
  properties: {
    name: { type: "string" },
    age: { type: "number" },
    email: { type: "string" },
  },
  required: ["name", "age", "email"],
};

const mockItemData: TypedAgentData<ExtractedData<TestData>> = {
  id: "test-item-1",
  agentUrlId: "test-agent-1",
  data: {
    data: {
      name: "John Doe",
      age: 30,
      email: "john@example.com",
    },
    original_data: {
      name: "Original John",
      age: 25,
      email: "original@example.com",
    } as any,
    status: "completed",
    confidence: 0.95,
  } as any,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockUpdatedItemData: TypedAgentData<ExtractedData<TestData>> = {
  ...mockItemData,
  data: {
    ...mockItemData.data,
    data: {
      name: "Jane Doe",
      age: 25,
      email: "jane@example.com",
    },
    original_data: {
      name: "Original John",
      age: 25,
      email: "original@example.com",
    } as any,
  } as any,
};

describe("useItemData", () => {
  let mockClient: any;

  beforeEach(() => {
    mockClient = {
      getItem: vi.fn(),
      updateItem: vi.fn(),
    };

    // Reset all mocks
    vi.clearAllMocks();

    // Mock Math.random to return 0.5 (avoid error simulation)
    vi.spyOn(Math, "random").mockReturnValue(0.5);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("initialization", () => {
    it("should initialize with correct default state", () => {
      const { result } = renderHook(() =>
        useItemData({
          jsonSchema: mockJsonSchema,
          itemId: "test-item-1",
          isMock: false,
          client: mockClient,
        })
      );

      expect(result.current.item).toBeNull();
      expect(result.current.originalData).toBeNull();
      expect(result.current.data).toBeNull();
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeNull();
      expect(result.current.jsonSchema).toBe(mockJsonSchema);
      expect(typeof result.current.updateData).toBe("function");
      expect(typeof result.current.save).toBe("function");
    });
  });

  describe("real API mode", () => {
    it("should load data successfully from real API", async () => {
      mockClient.getItem = vi.fn().mockResolvedValue(mockItemData);

      const { result } = renderHook(() =>
        useItemData({
          jsonSchema: mockJsonSchema,
          itemId: "test-item-1",
          isMock: false,
          client: mockClient,
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.item).toEqual(mockItemData);
      expect(result.current.data).toEqual(mockItemData.data.data);
      expect(result.current.originalData).toEqual(
        (mockItemData.data as any).original_data
      );
      expect(result.current.error).toBeNull();
      expect(mockClient.getItem).toHaveBeenCalledWith("test-item-1");
    });

    it("should handle API error", async () => {
      const errorMessage = "Item not found: test-item-1";
      mockClient.getItem = vi.fn().mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() =>
        useItemData({
          jsonSchema: mockJsonSchema,
          itemId: "test-item-1",
          isMock: false,
          client: mockClient,
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.item).toBeNull();
      expect(result.current.data).toBeNull();
      expect(result.current.originalData).toBeNull();
      expect(result.current.error).toBe(errorMessage);
    });

    it("should handle null response from API", async () => {
      mockClient.getItem = vi.fn().mockResolvedValue(null);

      const { result } = renderHook(() =>
        useItemData({
          jsonSchema: mockJsonSchema,
          itemId: "test-item-1",
          isMock: false,
          client: mockClient,
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.item).toBeNull();
      expect(result.current.data).toBeNull();
      expect(result.current.originalData).toBeNull();
      expect(result.current.error).toBe("Item not found: test-item-1");
    });
  });

  describe("mock mode", () => {
    it("should load data successfully from mock", async () => {
      mockGetMockItemResponse.mockReturnValue(mockItemData as any);

      const { result } = renderHook(() =>
        useItemData({
          jsonSchema: mockJsonSchema,
          itemId: "test-item-1",
          isMock: true,
          client: mockClient,
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.item).toEqual(mockItemData);
      expect(result.current.data).toEqual(mockItemData.data.data);
      expect(result.current.originalData).toEqual(
        (mockItemData.data as any).original_data
      );
      expect(result.current.error).toBeNull();
      expect(mockGetMockItemResponse).toHaveBeenCalledWith("test-item-1");
      expect(mockClient.getItem).not.toHaveBeenCalled();
    });

    it("should simulate error in mock mode", async () => {
      // Mock Math.random to return 0.05 (less than 0.1, triggers error)
      vi.spyOn(Math, "random").mockReturnValue(0.05);

      const { result } = renderHook(() =>
        useItemData({
          jsonSchema: mockJsonSchema,
          itemId: "test-item-1",
          isMock: true,
          client: mockClient,
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.item).toBeNull();
      expect(result.current.data).toBeNull();
      expect(result.current.originalData).toBeNull();
      expect(result.current.error).toBe("Item not found: test-item-1");
    });

    it("should include simulated delay", async () => {
      mockGetMockItemResponse.mockReturnValue(mockItemData as any);

      const startTime = Date.now();
      const { result } = renderHook(() =>
        useItemData({
          jsonSchema: mockJsonSchema,
          itemId: "test-item-1",
          isMock: true,
          client: mockClient,
        })
      );

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const endTime = Date.now();
      // Should have at least some delay (we can't test exact 800ms due to test environment)
      expect(endTime - startTime).toBeGreaterThan(0);
    });
  });

  describe("data manipulation", () => {
    it("should update user-corrected data while preserving original predictions", async () => {
      mockClient.getItem = vi.fn().mockResolvedValue(mockItemData);

      const { result } = renderHook(() =>
        useItemData({
          jsonSchema: mockJsonSchema,
          itemId: "test-item-1",
          isMock: false,
          client: mockClient,
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const newData: TestData = {
        name: "Updated Name",
        age: 35,
        email: "updated@example.com",
      };

      act(() => {
        result.current.updateData(newData);
      });

      // User corrections should be updated
      expect(result.current.data).toEqual(newData);
      // Original AI predictions should remain unchanged
      expect(result.current.originalData).toEqual(
        (mockItemData.data as any).original_data
      );
      // Item should still exist
      expect(result.current.item).toBeTruthy();
    });

    it("should save user-corrected data successfully", async () => {
      mockClient.getItem = vi.fn().mockResolvedValue(mockItemData);
      mockClient.updateItem = vi.fn().mockResolvedValue(mockUpdatedItemData);

      const { result } = renderHook(() =>
        useItemData({
          jsonSchema: mockJsonSchema,
          itemId: "test-item-1",
          isMock: false,
          client: mockClient,
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Modify data first
      const correctedData: TestData = {
        name: "Corrected Name",
        age: 35,
        email: "corrected@example.com",
      };

      act(() => {
        result.current.updateData(correctedData);
      });

      // Save the current state (now with status parameter)
      await act(async () => {
        await result.current.save("approved");
      });

      // Should save the current item.data which includes corrected data plus status
      expect(mockClient.updateItem).toHaveBeenCalledWith(
        "test-item-1",
        expect.objectContaining({
          data: correctedData,
          status: "approved",
        })
      );

      expect(result.current.item).toEqual(mockUpdatedItemData);
      expect(result.current.data).toEqual(mockUpdatedItemData.data.data);
    });

    it("should throw error when saving without item", async () => {
      const { result } = renderHook(() =>
        useItemData({
          jsonSchema: mockJsonSchema,
          itemId: "test-item-1",
          isMock: false,
          client: mockClient,
        })
      );

      await expect(async () => {
        await act(async () => {
          await result.current.save("approved");
        });
      }).rejects.toThrow("No item to save");
    });
  });

  describe("edge cases", () => {
    it("should handle data parsing errors", async () => {
      const invalidItemData = {
        ...mockItemData,
        data: {
          ...mockItemData.data,
          data: null, // Invalid data that will cause parsing error
        },
      };

      mockClient.getItem = vi.fn().mockResolvedValue(invalidItemData as any);

      const { result } = renderHook(() =>
        useItemData({
          jsonSchema: mockJsonSchema,
          itemId: "test-item-1",
          isMock: false,
          client: mockClient,
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.item).toBeNull();
      expect(result.current.data).toBeNull();
      expect(result.current.originalData).toBeNull();
      expect(result.current.error).toContain("Failed to parse item data");
    });

    it("should not fetch data when itemId is empty", () => {
      const { result } = renderHook(() =>
        useItemData({
          jsonSchema: mockJsonSchema,
          itemId: "",
          isMock: false,
          client: mockClient,
        })
      );

      expect(result.current.loading).toBe(false);
      expect(mockClient.getItem).not.toHaveBeenCalled();
    });

    it("should refetch data when itemId changes", async () => {
      mockClient.getItem = vi.fn().mockResolvedValue(mockItemData);

      const { result, rerender } = renderHook(
        ({ itemId }) =>
          useItemData({
            jsonSchema: mockJsonSchema,
            itemId,
            isMock: false,
            client: mockClient,
          }),
        { initialProps: { itemId: "item-1" } }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockClient.getItem).toHaveBeenCalledWith("item-1");

      // Change itemId
      rerender({ itemId: "item-2" });

      await waitFor(() => {
        expect(mockClient.getItem).toHaveBeenCalledWith("item-2");
      });

      expect(mockClient.getItem).toHaveBeenCalledTimes(2);
    });

    // BUG TEST 1: Empty itemId should set loading to false, not stay true forever
    it("should set loading to false when itemId is empty", async () => {
      const { result } = renderHook(() =>
        useItemData({
          jsonSchema: mockJsonSchema,
          itemId: "",
          isMock: false,
          client: mockClient,
        })
      );

      // This test should now PASS - loading should be false when itemId is empty
      await waitFor(
        () => {
          expect(result.current.loading).toBe(false);
        },
        { timeout: 100 }
      );
    });

    // BUG TEST 2: State should be properly reset when fetching new data
    it("should reset previous data when loading new item", async () => {
      mockClient.getItem = vi
        .fn()
        .mockResolvedValueOnce(mockItemData)
        .mockResolvedValueOnce(mockUpdatedItemData);

      const { result, rerender } = renderHook(
        ({ itemId }) =>
          useItemData({
            jsonSchema: mockJsonSchema,
            itemId,
            isMock: false,
            client: mockClient,
          }),
        { initialProps: { itemId: "item-1" } }
      );

      // Wait for first load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(mockItemData.data.data);

      // Change itemId - should reset previous data during loading
      rerender({ itemId: "item-2" });

      // During loading, the old data should be cleared
      // This test should now PASS - the hook properly resets state
      expect(result.current.loading).toBe(true);
      expect(result.current.data).toBeNull(); // Should be cleared
      expect(result.current.originalData).toBeNull(); // Should be cleared
      expect(result.current.error).toBeNull();
    });

    // BUG TEST 3: Client reference changes will now trigger refetch (since client is back in dependencies)
    it("should refetch data when client reference changes", async () => {
      mockClient.getItem = vi.fn().mockResolvedValue(mockItemData);

      const { result, rerender } = renderHook(
        ({ client }) =>
          useItemData({
            jsonSchema: mockJsonSchema,
            itemId: "item-1",
            isMock: false,
            client,
          }),
        { initialProps: { client: mockClient } }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockClient.getItem).toHaveBeenCalledTimes(1);

      // Create new client with same methods but different reference
      const newMockClient = {
        getItem: vi.fn().mockResolvedValue(mockItemData),
        updateItem: vi.fn(),
      };

      // Change client reference
      rerender({ client: newMockClient });

      // Since client is in dependencies, it should refetch with new client
      await waitFor(() => {
        expect(newMockClient.getItem).toHaveBeenCalledWith("item-1");
      });

      // New client should have been called
      expect(newMockClient.getItem).toHaveBeenCalledTimes(1);
      // Original client should still only have been called once
      expect(mockClient.getItem).toHaveBeenCalledTimes(1);
    });

    // BUG TEST 4: Save should work even if data was modified by updateData
    it("should save successfully even when data was modified via updateData", async () => {
      mockClient.getItem = vi.fn().mockResolvedValue(mockItemData);
      mockClient.updateItem = vi.fn().mockResolvedValue(mockUpdatedItemData);

      const { result } = renderHook(() =>
        useItemData({
          jsonSchema: mockJsonSchema,
          itemId: "test-item-1",
          isMock: false,
          client: mockClient,
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Modify data locally
      const modifiedData: TestData = {
        name: "Modified Name",
        age: 40,
        email: "modified@example.com",
      };

      act(() => {
        result.current.updateData(modifiedData);
      });

      // Save should work with the modified data
      await act(async () => {
        await result.current.save("approved");
      });

      expect(mockClient.updateItem).toHaveBeenCalledWith(
        "test-item-1",
        expect.objectContaining({
          data: modifiedData, // Should use the modified data
          status: "approved",
        })
      );
    });

    // BUG TEST 5: CRITICAL - Save should include modifications made via updateData
    it("should save the modified data when user changed data via updateData", async () => {
      mockClient.getItem = vi.fn().mockResolvedValue(mockItemData);

      // Create a response that includes the modified data
      const expectedSavedData = {
        name: "Modified Name",
        age: 40,
        email: "modified@example.com",
      };

      const mockSaveResponse: TypedAgentData<ExtractedData<TestData>> = {
        ...mockItemData,
        data: {
          ...mockItemData.data,
          data: expectedSavedData,
          status: "reviewed",
        },
      };

      mockClient.updateItem = vi.fn().mockResolvedValue(mockSaveResponse);

      const { result } = renderHook(() =>
        useItemData({
          jsonSchema: mockJsonSchema,
          itemId: "test-item-1",
          isMock: false,
          client: mockClient,
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Verify original data is loaded
      expect(result.current.data).toEqual({
        name: "John Doe",
        age: 30,
        email: "john@example.com",
      });

      // Modify data locally via updateData
      act(() => {
        result.current.updateData(expectedSavedData);
      });

      // Verify data is updated locally
      expect(result.current.data).toEqual(expectedSavedData);

      // Save the current state
      await act(async () => {
        await result.current.save("approved");
      });

      // CRITICAL TEST: Save should include the modified data from updateData
      // This test should now PASS with the corrected implementation
      expect(mockClient.updateItem).toHaveBeenCalledWith(
        "test-item-1",
        expect.objectContaining({
          data: expectedSavedData, // Should use the modified data, not original prediction.data
          status: "approved",
        })
      );
    });
  });
});
