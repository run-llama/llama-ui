import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";
import { within, expect } from "@storybook/test";
import { ApiProvider, createMockClients } from "../src/lib";
import { ItemCount } from "../src/item-count";

const meta = {
  title: "Business/ItemCount",
  component: ItemCount,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Summary card that displays counts powered by the Agent Data client from ApiProvider.",
      },
    },
  },
} satisfies Meta<typeof ItemCount>;

export default meta;
type Story = StoryObj<typeof meta>;

function createStubbedClients() {
  const clients = createMockClients();
  // Override agentDataClient.search to avoid network and return deterministic totals
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (clients.agentDataClient as any).search = async () => ({
    items: [],
    totalSize: 123,
  });
  return clients;
}

function WithProvider(props: React.ComponentProps<typeof ItemCount>) {
  return (
    <ApiProvider clients={createStubbedClients()}>
      <ItemCount {...props} />
    </ApiProvider>
  );
}

export const Default: Story = {
  args: {
    title: "Total Documents",
    subtitle: "All documents in the collection",
  },
  render: (args) => (
    <div className="max-w-sm">
      <WithProvider {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for mock client to return and number to render
    await new Promise((r) => setTimeout(r, 300));

    // Count should be the mocked number
    const numberEl = canvas.getByText(/123/);
    expect(numberEl).toBeInTheDocument();
  },
};

export const WithVariants: Story = {
  render: () => (
    <ApiProvider clients={createStubbedClients()}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
        <ItemCount title="Total" variant="total" subtitle="All items" />
        <ItemCount title="Awaiting" variant="awaiting" subtitle="Needs review" />
        <ItemCount title="Approved" variant="approved" subtitle="Validated" />
        <ItemCount title="Rejected" variant="rejected" subtitle="Flagged" />
      </div>
    </ApiProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Wait for mock responses
    await new Promise((r) => setTimeout(r, 1500));
    // All cards should display the mocked number somewhere
    const numbers = canvas.getAllByText(/123/);
    expect(numbers.length).toBeGreaterThanOrEqual(1);
  },
};
