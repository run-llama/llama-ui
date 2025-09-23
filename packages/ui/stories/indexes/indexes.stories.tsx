import type { Meta, StoryObj } from "@storybook/react";
import { ApiProvider } from "../../src/lib";
import { useIndexList, useIndex } from "../../src/indexes";
import { createRealClientsForTests } from "@/src/lib/api-provider";
import { ProjectId } from "../configs/constant";

function IndexListDemo() {
  const { indexes, loading, error, sync } = useIndexList();
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="font-semibold text-lg">Indexes</h3>
        <button
          className="px-2 py-1 border rounded"
          onClick={() => void sync()}
        >
          Refresh
        </button>
      </div>
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-600">Error: {error}</div>}
      {!loading && !error && (
        <ul className="list-disc pl-5">
          {indexes.map((p) => (
            <li key={p.id}>
              <span className="font-mono">{p.id}</span> - {p.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function IndexDetailDemo(props: { id: string }) {
  const { index, loading, error, refresh } = useIndex(props.id);
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <h3 className="font-semibold text-lg">Index Detail</h3>
        <button
          className="px-2 py-1 border rounded"
          onClick={() => void refresh()}
        >
          Refresh
        </button>
      </div>
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-600">Error: {error}</div>}
      {index && (
        <pre className="bg-slate-50 p-3 rounded text-xs overflow-auto">
          {JSON.stringify(index, null, 2)}
        </pre>
      )}
      {!loading && !error && !index && <div>No data</div>}
    </div>
  );
}

const meta: Meta = {
  title: "Data/Indexes",
  parameters: {
    layout: "padded",
  },
  decorators: [
    (Story) => (
      <ApiProvider
        clients={createRealClientsForTests({
          baseUrl: "https://api.cloud.llamaindex.ai",
          apiKey: (
            import.meta as unknown as {
              env?: Record<string, string | undefined>;
            }
          ).env?.STORYBOOK_LLAMA_CLOUD_API_KEY!,
        })}
        project={{ id: ProjectId }}
      >
        <div style={{ padding: 16 }}>
          <Story />
        </div>
      </ApiProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const List: Story = {
  parameters: {
    // msw: {
    //   handlers: [
    //     http.get("https://api.cloud.llamaindex.ai/api/v1/pipelines", ({ request }) => {
    //       const url = new URL(request.url);
    //       // Optional: inspect org/project
    //       const organizationId = url.searchParams.get("organization_id");
    //       const projectId = url.searchParams.get("project_id");
    //       void organizationId;
    //       void projectId;
    //       return HttpResponse.json([
    //         {
    //           id: "pipe_1",
    //           name: "Demo Pipeline 1",
    //           project_id: "proj_story",
    //           embedding_config: { type: "OPENAI_EMBEDDING" },
    //           created_at: new Date().toISOString(),
    //           updated_at: new Date().toISOString(),
    //         },
    //         {
    //           id: "pipe_2",
    //           name: "Demo Pipeline 2",
    //           project_id: "proj_story",
    //           embedding_config: { type: "OPENAI_EMBEDDING" },
    //           created_at: new Date().toISOString(),
    //           updated_at: new Date().toISOString(),
    //         },
    //       ]);
    //     }),
    //   ],
    // },
  },
  render: () => <IndexListDemo />,
};

export const Detail: Story = {
  args: { id: "9a5118f8-7598-479f-94b4-2ba9689b73d3" },
  parameters: {
    // msw: {
    //   handlers: [
    //     http.get("https://api.cloud.llamaindex.ai/api/v1/pipelines", () => {
    //       return HttpResponse.json([
    //         {
    //           id: "pipe_1",
    //           name: "Demo Pipeline 1",
    //           project_id: "proj_story",
    //           embedding_config: { type: "OPENAI_EMBEDDING" },
    //         },
    //       ]);
    //     }),
    //     http.get(
    //       "https://api.cloud.llamaindex.ai/api/v1/pipelines/:pipeline_id",
    //       ({ params }) => {
    //         const { pipeline_id } = params as { pipeline_id: string };
    //         return HttpResponse.json({
    //           id: pipeline_id,
    //           name: `Pipeline ${pipeline_id}`,
    //           project_id: "proj_story",
    //           embedding_config: { type: "OPENAI_EMBEDDING" },
    //           created_at: new Date().toISOString(),
    //           updated_at: new Date().toISOString(),
    //         });
    //       }
    //     ),
    //   ],
    // },
  },
  render: (args) => <IndexDetailDemo id={args.id as string} />,
};
