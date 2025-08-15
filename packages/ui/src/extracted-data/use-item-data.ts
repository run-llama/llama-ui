import { useEffect, useState, useCallback } from "react";
import {
  type ExtractedData,
  type TypedAgentData,
  type AgentClient,
} from "llama-cloud-services/beta/agent";
import { getMockItemResponse } from "./mock-item-response";
import { JSONSchema } from "zod/v4/core";
import { JSONObject } from "./types";
// Remove reconciliation imports since ExtractedDataDisplay handles it internally

export interface ItemHookData<T extends JSONObject> {
  /** the complete item object from API containing both AI predictions and user corrections */
  item: TypedAgentData<ExtractedData<T>> | null;
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

export interface UseItemDataOptions<T extends JSONObject> {
  jsonSchema: JSONSchema.ObjectSchema;
  itemId: string;
  isMock: boolean;
  client: AgentClient<ExtractedData<T>>;
}

export function useItemData<T extends JSONObject>({
  jsonSchema,
  itemId,
  isMock,
  client,
}: UseItemDataOptions<T>): ItemHookData<T> {
  // Single source of truth - contains both original predictions and user corrections
  const [item, setItem] = useState<TypedAgentData<ExtractedData<T>> | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** Updates user-corrected data within the item */
  const updateData = useCallback((newData: T) => {
    setItem((currentItem) => {
      if (!currentItem) return null;

      return {
        ...currentItem,
        data: {
          ...currentItem.data,
          data: newData, // Update user-corrected data
          // Keep original_data unchanged
        },
      };
    });
  }, []);

  /** Resets the state after loading from API */
  const resetState = useCallback(
    (newItem: TypedAgentData<ExtractedData<T>>) => {
      try {
        // Validate that we have the expected data structure
        if (!newItem.data.data) {
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
    },
    []
  );

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

          const mockData = getMockItemResponse(
            itemId
          ) as unknown as TypedAgentData<ExtractedData<T>>;
          resetState(mockData);
        } else {
          const response = await client.getItem(itemId);
          if (!response) {
            throw new Error(`Item not found: ${itemId}`);
          }

          resetState(response);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Error fetching item data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load item data"
        );
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

      const response = await client.updateItem(itemId, {
        ...item.data,
        status,
      });
      resetState(response);
    },
    [item, itemId, resetState, client]
  );

  return {
    item,
    jsonSchema,
    originalData: item?.data.original_data || null,
    data: item?.data.data || null,
    updateData,
    loading,
    error,
    save,
  };
}
