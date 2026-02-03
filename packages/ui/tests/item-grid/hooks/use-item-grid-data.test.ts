import { waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useItemGridData } from "../../../src/item-grid/hooks/use-item-grid-data";
import { renderHookWithProvider } from "../../test-utils";
import type { ApiClients } from "../../../src/lib/api-provider";
import { createAgentDataConfig } from "../../../src/lib/clients";

// Mock data for tests
const mockItems = [
  {
    id: "item-1",
    data: { file_name: "doc1.pdf", status: "approved" },
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "item-2",
    data: { file_name: "doc2.pdf", status: "pending" },
    created_at: "2024-01-02T00:00:00Z",
    updated_at: "2024-01-02T00:00:00Z",
  },
  {
    id: "item-3",
    data: { file_name: "doc3.pdf", status: "approved" },
    created_at: "2024-01-03T00:00:00Z",
    updated_at: "2024-01-03T00:00:00Z",
  },
];

// Create mock cloud client that resolves immediately.
// Uses aggregate API for total count and search API for paginated data.
function createMockCloudClient() {
  return {
    beta: {
      agentData: {
        search: vi.fn().mockResolvedValue({
          items: mockItems,
          next_page_token: "",
        }),
        aggregate: vi.fn().mockResolvedValue({
          getPaginatedItems: () => [{ group_key: {}, count: mockItems.length }],
        }),
        delete: vi.fn().mockResolvedValue(undefined),
      },
    },
  };
}

function createTestMockClients(
  overrides?: Partial<ReturnType<typeof createMockCloudClient>>
): ApiClients {
  const mockCloudClient = createMockCloudClient();
  if (overrides) {
    Object.assign(mockCloudClient.beta.agentData, overrides);
  }
  return {
    cloudApiClient: mockCloudClient as any,
    agentDataConfig: createAgentDataConfig({
      deploymentName: "test-deployment",
      collection: "test-collection",
    }),
  };
}

describe("useItemGridData", () => {
  it("should initialize with loading state", () => {
    const { result } = renderHookWithProvider(
      () => useItemGridData({ page: 0, size: 20 }, {}, undefined),
      { apiClients: createTestMockClients() }
    );

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBe(null);
    expect(result.current.totalSize).toBe(0);
  });

  it("should handle data fetching", async () => {
    const { result } = renderHookWithProvider(
      () => useItemGridData({ page: 0, size: 20 }, {}, undefined),
      { apiClients: createTestMockClients() }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(Array.isArray(result.current.data)).toBe(true);
    expect(result.current.data.length).toBe(mockItems.length);
    expect(result.current.totalSize).toBe(mockItems.length);
    expect(result.current.error).toBe(null);
  });

  it("should provide fetchData function", async () => {
    const mockClients = createTestMockClients();
    const { result } = renderHookWithProvider(
      () => useItemGridData({ page: 0, size: 20 }, {}, undefined),
      { apiClients: mockClients }
    );

    expect(typeof result.current.fetchData).toBe("function");

    // Wait for initial fetch
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Call fetchData manually
    await act(async () => {
      await result.current.fetchData();
    });

    expect(Array.isArray(result.current.data)).toBe(true);
    // Search should have been called twice (initial + manual)
    expect(
      mockClients.cloudApiClient!.beta.agentData.search
    ).toHaveBeenCalledTimes(2);
  });

  it("should provide deleteItem function", async () => {
    const mockClients = createTestMockClients();
    const { result } = renderHookWithProvider(
      () => useItemGridData({ page: 0, size: 20 }, {}, undefined),
      { apiClients: mockClients }
    );

    expect(typeof result.current.deleteItem).toBe("function");

    // Wait for initial fetch
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data.length).toBe(3);

    const firstItemId = result.current.data[0].id;
    const initialLength = result.current.data.length;

    await act(async () => {
      const deleteResult = await result.current.deleteItem(String(firstItemId));
      expect(deleteResult.success).toBe(true);
    });

    // Item should be removed from local state
    expect(result.current.data.length).toBe(initialLength - 1);
    expect(
      mockClients.cloudApiClient!.beta.agentData.delete
    ).toHaveBeenCalledWith(firstItemId);
  });

  it("should apply pagination correctly", async () => {
    const paginatedItems = mockItems.slice(0, 2);
    const mockClients = createTestMockClients();
    (
      mockClients.cloudApiClient!.beta.agentData.search as any
    ).mockResolvedValue({
      items: paginatedItems,
      next_page_token: "",
    });

    const { result } = renderHookWithProvider(
      () => useItemGridData({ page: 1, size: 10 }, {}, undefined),
      { apiClients: mockClients }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeTruthy();
    expect(result.current.data.length).toBeLessThanOrEqual(10);
  });

  it("should apply sorting correctly", async () => {
    const mockClients = createTestMockClients();
    const { result } = renderHookWithProvider(
      () => useItemGridData({ page: 0, size: 20 }, {}, "file_name asc"),
      { apiClients: mockClients }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(Array.isArray(result.current.data)).toBe(true);
    expect(
      mockClients.cloudApiClient!.beta.agentData.search
    ).toHaveBeenCalledWith(
      expect.objectContaining({ order_by: "file_name asc" })
    );
  });

  it("should apply filtering correctly", async () => {
    const mockClients = createTestMockClients();
    const { result } = renderHookWithProvider(
      () =>
        useItemGridData(
          { page: 0, size: 20 },
          { status: { includes: ["approved"] } },
          undefined
        ),
      { apiClients: mockClients }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeTruthy();
    expect(
      mockClients.cloudApiClient!.beta.agentData.search
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: { status: { includes: ["approved"] } },
      })
    );
  });

  it("should handle delete errors gracefully", async () => {
    const mockClients = createTestMockClients();
    (
      mockClients.cloudApiClient!.beta.agentData.delete as any
    ).mockRejectedValue(new Error("Delete failed"));

    const { result } = renderHookWithProvider(
      () => useItemGridData({ page: 0, size: 20 }, {}, undefined),
      { apiClients: mockClients }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const initialLength = result.current.data.length;

    await act(async () => {
      const deleteResult = await result.current.deleteItem("item-1");
      expect(deleteResult.success).toBe(false);
      expect(deleteResult.error).toBe(
        "Failed to delete item. Please try again."
      );
    });

    // Data should not change on error
    expect(result.current.data.length).toBe(initialLength);
  });

  it("should handle fetch errors gracefully", async () => {
    const mockClients = createTestMockClients();
    (
      mockClients.cloudApiClient!.beta.agentData.search as any
    ).mockRejectedValue(new Error("Network error"));

    const { result } = renderHookWithProvider(
      () => useItemGridData({ page: 0, size: 20 }, {}, undefined),
      { apiClients: mockClients }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("Network error");
    expect(result.current.data).toEqual([]);
  });
});
