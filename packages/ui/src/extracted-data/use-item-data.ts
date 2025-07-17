
import { useEffect, useState, useCallback } from "react";
import {
  type ExtractedData,
  type TypedAgentData,
  type AgentClient,
} from "@llamaindex/cloud/beta/agent";
import { getMockItemResponse } from "./mock-item-response";
import { JSONSchema } from "zod/v4/core";
// Remove reconciliation imports since ExtractedDataDisplay handles it internally

export interface ItemHookData<T extends Record<string, unknown>> {
  /** the full item object, loaded from the API, unmodified */
  item: TypedAgentData<ExtractedData<T>> | null;
  /** the JSON schema used for validation and reconciliation */
  jsonSchema: JSONSchema.ObjectSchema;
  /** the extracted data from the API */
  data: T | null;
  /** whether the data is loading from the API. item and data are null while loading. */
  loading: boolean;
  /** a load or parse error. Loading and data is false, null, if error */
  error: string | null;
  /** sets the data, which will be saved to the server when save is called */
  setData: (data: T) => void;
  /** Saves the current data and any specified item edits (such as status updates) */
  save: (update: Partial<ExtractedData<T>>) => Promise<void>;
}

export interface UseItemDataOptions<T extends Record<string, unknown>> {
  jsonSchema: JSONSchema.ObjectSchema;
  itemId: string;
  isMock: boolean;
  client: AgentClient<ExtractedData<T>>;
}

export function useItemData<T extends Record<string, unknown>>({
  jsonSchema,
  itemId,
  isMock,
  client,
}: UseItemDataOptions<T>): ItemHookData<T> {
  const [data, setData] = useState<T | null>(null);

  const [item, setItem] = useState<TypedAgentData<ExtractedData<T>> | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** Resets the state after reloading from the API */
  const resetState = useCallback((item: TypedAgentData<ExtractedData<T>>) => {
    try {
      const extractedData = item.data.data as T;

      setItem(item);
      setData(extractedData); // Use original API data - reconciliation happens in ExtractedDataDisplay
      setError(null);
      setLoading(false);
    } catch (err) {
      setError(`Failed to parse extracted data: ${err}`);
      setLoading(false);
      setItem(null);
      setData(null);
    }
  }, []);

  useEffect(() => {
    const fetchItemData = async () => {
      setLoading(true);
      setError(null);

      try {
        if (isMock) {
          // Simulate API delay for realistic experience
          await new Promise((resolve) => setTimeout(resolve, 800));

          // 10% chance of error to simulate real world conditions
          if (Math.random() < 0.1) {
            throw new Error(`Item not found: ${itemId}`);
          }

          const mockData = getMockItemResponse(
            itemId,
          ) as unknown as TypedAgentData<ExtractedData<T>>;
          resetState(mockData);
        } else {
          //
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
          err instanceof Error ? err.message : "Failed to load item data",
        );
      } finally {
        setLoading(false);
      }
    };

    if (itemId) {
      fetchItemData();
    }
  }, [itemId, isMock, resetState, client]);

  const save = useCallback(
    async (update: Partial<ExtractedData<T>>) => {
      if (!data || !item) {
        throw new Error("No data to save");
      }
      const updated: ExtractedData<T> = {
        ...item.data,
        ...update,
      };
      const response = await client.updateItem(itemId, updated);
      resetState(response);
    },
    [data, item, itemId, resetState, client],
  );
  return {
    item,
    jsonSchema,
    data,
    setData,
    loading,
    error,
    save,
  };
}
