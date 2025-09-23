import type { Meta, StoryObj } from "@storybook/react";
import { ApiProvider } from "../../src/lib";
import { useIndexList, useIndex } from "../../src/indexes";
import { createRealClientsForTests } from "@/src/lib/api-provider";
import { API_KEY, ProjectId } from "../configs/constant";

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
          apiKey: API_KEY,
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
  render: () => <IndexListDemo />,
};

export const Detail: Story = {
  args: { id: "9a5118f8-7598-479f-94b4-2ba9689b73d3" },
  render: (args) => <IndexDetailDemo id={args.id as string} />,
};
