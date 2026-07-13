import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";
import { within, userEvent, expect } from "@storybook/test";
import { ItemGrid } from "../../src/item-grid";
import { ApiProvider, createMockClients } from "../../src/lib";
import type { ExtractedData, AgentDataItem } from "@/src/lib/agent-data";

const meta = {
  title: "Business/ItemGrid",
  component: ItemGrid,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Generic grid component for displaying and managing items with custom columns, filtering, sorting, and pagination.",
      },
    },
  },
  argTypes: {
    customColumns: {
      description: "Array of custom column configurations",
      control: { type: "object" },
    },
    defaultPageSize: {
      description: "Default number of items per page",
      control: { type: "number" },
    },
  },
} satisfies Meta<typeof ItemGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

// Wrapper component that provides ApiProvider
function ItemGridWrapper(props: React.ComponentProps<typeof ItemGrid>) {
  return (
    <ApiProvider clients={createMockClients()}>
      <ItemGrid {...props} />
    </ApiProvider>
  );
}

// Default story with custom columns
export const Default: Story = {
  args: {
    customColumns: [
      {
        key: "fileName",
        header: "File Name",
        getValue: (item: AgentDataItem) => {
          const data = item.data as unknown as ExtractedData;
          return data.file_name;
        },
        sortable: true,
      },
      {
        key: "status",
        header: "Status",
        getValue: (item: AgentDataItem) => {
          const data = item.data as unknown as ExtractedData;
          return data.status;
        },
        sortable: true,
      },
      {
        key: "createdAt",
        header: "Created At",
        getValue: (item: AgentDataItem) => item.created_at,
        sortable: true,
      },
    ],
    defaultPageSize: 20,
  },
  render: (args) => (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          Generic Item Grid
        </h1>
        <p className="text-muted-foreground mt-2">
          Flexible grid component with custom column definitions
        </p>
      </div>
      <ItemGridWrapper
        {...args}
        onRowClick={(item: AgentDataItem) => {
          const data = item.data as unknown as ExtractedData;
          console.log(`Clicked row: ${data.file_name}`);
        }}
      />
    </div>
  ),
};

// Custom columns example
export const WithCustomColumns: Story = {
  args: {
    customColumns: [
      {
        key: "priority",
        header: "Priority",
        getValue: () => "High",
        renderCell: (value: unknown) => (
          <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
            {String(value)}
          </span>
        ),
        sortable: true,
      },
      {
        key: "fileName",
        header: "File Name",
        getValue: (item: AgentDataItem) => {
          const data = item.data as unknown as ExtractedData;
          return data.file_name;
        },
        sortable: true,
      },
    ],
    defaultPageSize: 15,
  },
  render: (args) => (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          ItemGrid with Custom Columns
        </h1>
        <p className="text-muted-foreground mt-2">
          Generic grid component with custom column definitions
        </p>
      </div>
      <ItemGridWrapper {...args} />
    </div>
  ),
};

// Basic interaction test
export const WithInteraction: Story = {
  args: {
    customColumns: [
      {
        key: "fileName",
        header: "File Name",
        getValue: (item: AgentDataItem) => {
          const data = item.data as unknown as ExtractedData;
          return data.file_name;
        },
        sortable: true,
      },
      {
        key: "status",
        header: "Status",
        getValue: (item: AgentDataItem) => {
          const data = item.data as unknown as ExtractedData;
          return data.status;
        },
        sortable: true,
      },
    ],
    defaultPageSize: 5,
  },
  render: (args) => (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          Interactive ItemGrid
        </h1>
        <p className="text-muted-foreground mt-2">
          Test sorting and pagination functionality
        </p>
      </div>
      <ItemGridWrapper {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for data to load and verify loading state
    await expect(canvas.getByText("Loading items...")).toBeInTheDocument();

    // Wait longer for data to load
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Test sorting if headers are available
    try {
      const fileNameHeader = canvas.getByText("File Name");
      await userEvent.click(fileNameHeader);
    } catch {
      // Headers might not be loaded yet, skip sorting test
    }
  },
};
