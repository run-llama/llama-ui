import { getCloudClient } from "../../lib/cloud-client";
import type { Pipelines } from "@llamaindex/llama-cloud/resources";

// Derive SDK types from the LlamaCloud SDK
export type PipelinesResponseData = Pipelines.PipelineListResponse;
export type Pipeline = Pipelines.Pipeline;

export async function fetchPipelines(params?: {
  projectId?: string | null;
}): Promise<PipelinesResponseData> {
  const client = getCloudClient();
  return client.pipelines.list({
    project_id: params?.projectId ?? undefined,
  });
}

export async function getPipeline(id: string): Promise<Pipeline> {
  const client = getCloudClient();
  return client.pipelines.get(id);
}
