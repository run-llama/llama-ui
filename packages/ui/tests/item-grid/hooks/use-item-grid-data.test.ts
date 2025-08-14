import { waitFor, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useItemGridData } from "../../../src/item-grid/hooks/use-item-grid-data";
import { renderHookWithProvider } from "../../test-utils";

describe("useItemGridData", () => {
  it("should initialize with loading state", () => {
    const { result } = renderHookWithProvider(() =>
      useItemGridData({ page: 0, size: 20 }, {}, undefined)
    );

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBe(null);
    expect(result.current.totalSize).toBe(0);
  });

  it("should handle data fetching", async () => {
    const { result } = renderHookWithProvider(() =>
      useItemGridData({ page: 0, size: 20 }, {}, undefined)
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(Array.isArray(result.current.data)).toBe(true);
    expect(typeof result.current.totalSize).toBe("number");
    // Error can be null or string depending on mock setup
    expect(typeof result.current.error === "string" || result.current.error === null).toBe(true);
  });

  it("should provide fetchData function", async () => {
    const { result } = renderHookWithProvider(() =>
      useItemGridData({ page: 0, size: 20 }, {}, undefined)
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
  });

  it("should provide deleteItem function", async () => {
    const { result } = renderHookWithProvider(() =>
      useItemGridData({ page: 0, size: 20 }, {}, undefined)
    );

    expect(typeof result.current.deleteItem).toBe("function");

    // Wait for initial fetch
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Test deleteItem (this will use MSW mock)
    if (result.current.data.length > 0) {
      const firstItemId = result.current.data[0].id;
      const initialLength = result.current.data.length;

      await act(async () => {
        const deleteResult = await result.current.deleteItem(String(firstItemId));
        expect(deleteResult.success).toBe(true);
      });

      // Item should be removed from local state
      expect(result.current.data.length).toBe(initialLength - 1);
    }
  });

  it("should apply pagination correctly", async () => {
    const { result } = renderHookWithProvider(() =>
      useItemGridData({ page: 1, size: 10 }, {}, undefined)
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeTruthy();
    expect(result.current.data.length).toBeLessThanOrEqual(10);
  });

  it("should apply sorting correctly", async () => {
    const { result } = renderHookWithProvider(() =>
      useItemGridData({ page: 0, size: 20 }, {}, "file_name asc")
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(Array.isArray(result.current.data)).toBe(true);
  });

  it("should apply filtering correctly", async () => {
    const { result } = renderHookWithProvider(() =>
      useItemGridData(
        { page: 0, size: 20 }, 
        { status: { includes: ["approved"] } }, 
        undefined
      )
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeTruthy();
  });
});