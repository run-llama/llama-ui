import {
  searchPipelinesApiV1PipelinesGet,
  getPipelineApiV1PipelinesPipelineIdGet,
} from "llama-cloud-services/api";

// Derive SDK types from function return types to avoid proxy types
export type PipelinesResponseData = NonNullable<
  Awaited<ReturnType<typeof searchPipelinesApiV1PipelinesGet>>["data"]
>;
export type Pipeline = NonNullable<
  Awaited<ReturnType<typeof getPipelineApiV1PipelinesPipelineIdGet>>["data"]
>;

export async function fetchPipelines(params?: {
  organizationId?: string | null;
  projectId?: string | null;
}): Promise<PipelinesResponseData> {
  const resp = await searchPipelinesApiV1PipelinesGet({
    query: {
      organization_id: params?.organizationId ?? undefined,
      project_id: params?.projectId ?? undefined,
    },
  });
  if (resp.error) throw resp.error;
  // SDK returns Array<PipelineReadable> on 200
  return (resp.data ?? []) as PipelinesResponseData;
}

export async function getPipeline(
  id: string,
  params?: { organizationId?: string | null; projectId?: string | null }
): Promise<Pipeline> {
  const resp = await getPipelineApiV1PipelinesPipelineIdGet({
    path: { pipeline_id: id },
    query: {
      organization_id: params?.organizationId ?? undefined,
      project_id: params?.projectId ?? undefined,
    },
  });
  if (resp.error) throw resp.error;
  if (!resp.data) throw new Error("Pipeline not found");
  return resp.data as Pipeline;
}
