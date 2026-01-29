import { getStainlessClient } from "../../lib/stainless-client";
import type { Pipelines } from "@llamaindex/llama-cloud/resources";

// Derive SDK types from the Stainless SDK
export type PipelinesResponseData = Pipelines.PipelineListResponse;
export type Pipeline = Pipelines.Pipeline;

export async function fetchPipelines(params?: {
  organizationId?: string | null;
  projectId?: string | null;
}): Promise<PipelinesResponseData> {
  const client = getStainlessClient();
  const resp = await client.pipelines.list({
    organization_id: params?.organizationId ?? undefined,
    project_id: params?.projectId ?? undefined,
  });
  return resp;
}

export async function getPipeline(
  id: string,
  _params?: { organizationId?: string | null; projectId?: string | null }
): Promise<Pipeline> {
  const client = getStainlessClient();
  // Note: The Stainless SDK's pipelines.get() doesn't take organizationId/projectId params
  // They are typically set at the client level or inferred from the pipeline ID
  const resp = await client.pipelines.get(id);
  return resp;
}
