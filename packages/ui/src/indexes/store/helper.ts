import {
  searchPipelinesApiV1PipelinesGet,
  upsertPipelineApiV1PipelinesPut,
  getPipelineApiV1PipelinesPipelineIdGet,
  addFilesToPipelineApiApiV1PipelinesPipelineIdFilesPut,
} from "llama-cloud-services/api";
import type { IndexSummary, UpsertIndexParams, AddFilesParams } from "../types";

export async function fetchPipelines(): Promise<IndexSummary[]> {
  const resp = await searchPipelinesApiV1PipelinesGet({});
  if (resp.error) throw resp.error;
  const data = (resp.data?.items ?? []) as unknown[] | undefined;
  return (data ?? []).map((p) => toIndexSummary(p as Record<string, unknown>));
}

export async function upsertPipeline(params: UpsertIndexParams): Promise<IndexSummary> {
  const resp = await upsertPipelineApiV1PipelinesPut({
    body: params.config as unknown,
  });
  if (resp.error) throw resp.error;
  const pipeline = resp.data as unknown as Record<string, unknown> | undefined;
  if (!pipeline) throw new Error("Empty pipeline response");
  return toIndexSummary(pipeline);
}

export async function getPipeline(id: string): Promise<IndexSummary> {
  const resp = await getPipelineApiV1PipelinesPipelineIdGet({ path: { pipeline_id: id } });
  if (resp.error) throw resp.error;
  const pipeline = resp.data as unknown as Record<string, unknown> | undefined;
  if (!pipeline) throw new Error("Pipeline not found");
  return toIndexSummary(pipeline);
}

export async function addFilesToPipeline(params: AddFilesParams): Promise<void> {
  const resp = await addFilesToPipelineApiApiV1PipelinesPipelineIdFilesPut({
    path: { pipeline_id: params.indexId },
    body: {
      files: params.files,
    } as unknown,
  });
  if (resp.error) throw resp.error;
}

function toIndexSummary(p: Record<string, unknown>): IndexSummary {
  const pAny = p as any; // eslint-disable-line @typescript-eslint/no-explicit-any
  const rawStatus = (pAny?.status as string | undefined) ?? "idle";
  const status = (rawStatus.toLowerCase?.() as IndexSummary["status"]) || "idle";
  return {
    id: String(pAny.id ?? pAny.pipeline_id ?? ""),
    name: pAny.name ?? undefined,
    status: status,
    createdAt: pAny.created_at as string | undefined,
    updatedAt: pAny.updated_at as string | undefined,
    raw: p,
  };
}

