import { useEffect, useState, useCallback } from "react";
import { type ExtractedData, type AgentDataItem } from "@/src/lib/agent-data";
import { getMockItemResponse } from "./mock-item-response";
import { JSONSchema } from "zod/v4/core";
import { JsonShape } from "./types";
import { useCloudApiClient } from "../lib/api-provider";
import { NotFoundError } from "@llamaindex/llama-cloud";

export interface ItemHookData<T extends JsonShape<T>> {
  /** the complete item object from API containing both AI predictions and user corrections */
  item: AgentDataItem | null;
  /** the JSON schema used for validation and reconciliation */
  jsonSchema: JSONSchema.ObjectSchema;
  /** AI's original predictions (readonly reference) */
  originalData: T | null;
  /** current user-corrected data (what gets saved) */
  data: T | null;
  /** whether the data is loading from the API */
  loading: boolean;
  /** a load or parse error */
  error: string | null;
  /** updates the user-corrected data */
  updateData: (data: T) => void;
  /** saves the current user-corrected data and any metadata updates */
  save: (status: "approved" | "rejected") => Promise<void>;
}

export interface UseItemDataOptions<T extends JsonShape<T>> {
  jsonSchema: JSONSchema.ObjectSchema;
  itemId: string;
  isMock?: boolean;
}

export function useItemData<T extends JsonShape<T>>({
  jsonSchema,
  itemId,
  isMock,
}: UseItemDataOptions<T>): ItemHookData<T> {
  const client = useCloudApiClient();

  // Single source of truth - contains both original predictions and user corrections
  const [item, setItem] = useState<AgentDataItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper to get typed extracted data from item
  const getExtractedData = useCallback(
    (agentData: AgentDataItem | null): ExtractedData<T> | null => {
      if (!agentData) return null;
      return agentData.data as ExtractedData<T>;
    },
    []
  );

  /** Updates user-corrected data within the item */
  const updateData = useCallback((newData: T) => {
    setItem((currentItem) => {
      if (!currentItem) return null;

      const extractedData = currentItem.data as ExtractedData<T>;
      return {
        ...currentItem,
        data: {
          ...extractedData,
          data: newData, // Update user-corrected data
          // Keep original_data unchanged
        },
      };
    });
  }, []);

  /** Resets the state after loading from API */
  const resetState = useCallback((newItem: AgentDataItem) => {
    try {
      const extractedData = newItem.data as ExtractedData<T>;
      // Validate that we have the expected data structure
      if (!extractedData.data) {
        throw new Error("Invalid item structure: missing data field");
      }

      setItem(newItem);
      setError(null);
      setLoading(false);
    } catch (err) {
      setError(`Failed to parse item data: ${err}`);
      setLoading(false);
      setItem(null);
    }
  }, []);

  useEffect(() => {
    const fetchItemData = async () => {
      // Reset state when starting new fetch
      setLoading(true);
      setError(null);
      setItem(null);

      try {
        if (isMock) {
          // Simulate API delay
          await new Promise((resolve) => setTimeout(resolve, 800));

          // 10% chance of error to simulate real world conditions
          if (Math.random() < 0.1) {
            throw new Error(`Item not found: ${itemId}`);
          }

          const mockData = getMockItemResponse(itemId);
          resetState(mockData);
        } else {
          const response = await client.beta.agentData.get(itemId);
          resetState(response);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Error fetching item data:", err);
        if (err instanceof NotFoundError) {
          setError(`Item not found: ${itemId}`);
        } else {
          setError(
            err instanceof Error ? err.message : "Failed to load item data"
          );
        }
        setLoading(false);
      }
    };

    if (itemId) {
      fetchItemData();
    } else {
      // Handle empty itemId case
      setLoading(false);
      setError(null);
      setItem(null);
    }
  }, [itemId, isMock, resetState, client]);

  const save = useCallback(
    async (status: "approved" | "rejected") => {
      if (!item) {
        throw new Error("No item to save");
      }

      const extractedData = item.data as ExtractedData<T>;
      const response = await client.beta.agentData.update(item.id!, {
        data: {
          ...extractedData,
          status,
        },
      });
      resetState(response);
    },
    [item, resetState, client]
  );

  const extractedData = getExtractedData(item);

  return {
    item,
    jsonSchema,
    originalData: extractedData?.original_data || null,
    data: extractedData?.data || null,
    updateData,
    loading,
    error,
    save,
  };
}
