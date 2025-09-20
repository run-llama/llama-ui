// ===== Index (Pipeline) Types =====

export type JSONValue =
  | null
  | string
  | number
  | boolean
  | { [key: string]: JSONValue }
  | Array<JSONValue>;

export type RunStatus = "idle" | "running" | "complete" | "failed";

export interface IndexSummary {
  id: string;
  name?: string;
  status: RunStatus;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  // Store original server payload for advanced consumers
  raw?: unknown;
}

export interface IndexProgressState {
  status: RunStatus;
}

export interface UpsertIndexParams {
  // Free-form config passed directly to the API
  // Callers should provide valid pipeline config per llama-cloud-services
  config: { [key: string]: JSONValue };
}

export interface AddFilesParams {
  indexId: string;
  files: Array<{
    file_id: string;
    // Optional metadata forwarded to API when supported
    custom_metadata?: { [key: string]: JSONValue };
  }>;
}

