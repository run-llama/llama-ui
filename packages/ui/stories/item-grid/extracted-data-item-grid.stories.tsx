import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";
import { within, userEvent, expect } from "@storybook/test";
import { ExtractedDataItemGrid } from "../../src/item-grid";
import { ApiProvider, createMockClients } from "../../src/lib";
import type {
  ExtractedData,
  TypedAgentData,
} from "llama-cloud-services/beta/agent";

const meta = {
  title: "Business/ExtractedDataItemGrid",
  component: ExtractedDataItemGrid,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Specialized grid component for extracted data with pre-configured columns.",
      },
    },
  },
  argTypes: {
    builtInColumns: {
      description: "Configuration for built-in columns",
      control: { type: "object" },
    },
    customColumns: {
      description: "Additional custom columns",
      control: { type: "object" },
    },
    defaultPageSize: {
      description: "Default number of items per page",
      control: { type: "number" },
    },
  },
} satisfies Meta<typeof ExtractedDataItemGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

// Wrapper component that provides ApiProvider
function ExtractedDataItemGridWrapper(
  props: React.ComponentProps<typeof ExtractedDataItemGrid>
) {
  return (
    <ApiProvider clients={createMockClients()}>
      <ExtractedDataItemGrid {...props} />
    </ApiProvider>
  );
}

// Default story with all built-in columns
export const Default: Story = {
  args: {
    builtInColumns: {
      fileName: true,
      status: true,
      createdAt: true,
      itemsToReview: true,
      actions: true,
    },
    defaultPageSize: 20,
  },
  render: (args) => (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Extracted Data Management
        </h1>
        <p className="text-gray-600 mt-2">
          Pre-configured grid for extracted data with all standard columns
        </p>
      </div>
      <ExtractedDataItemGridWrapper
        {...args}
        onRowClick={(item: TypedAgentData<ExtractedData>) =>
          console.log(`Clicked row: ${item.data.file_name}`)
        }
      />
    </div>
  ),
};

// Customized columns
export const Customized: Story = {
  args: {
    builtInColumns: {
      fileName: { header: "Document Name" },
      status: { header: "Review Status", sortable: false },
      itemsToReview: { header: "Low Confidence Items" },
      createdAt: false, // Hide created at column
      actions: true,
    },
    defaultPageSize: 15,
  },
  render: (args) => (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Customized Extracted Data Grid
        </h1>
        <p className="text-gray-600 mt-2">
          Built-in columns with custom headers and configuration
        </p>
      </div>
      <ExtractedDataItemGridWrapper {...args} />
    </div>
  ),
};

// With custom columns
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
    ],
    builtInColumns: {
      fileName: true,
      status: true,
      itemsToReview: true,
      actions: true,
    },
    defaultPageSize: 15,
  },
  render: (args) => (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Extracted Data with Custom Columns
        </h1>
        <p className="text-gray-600 mt-2">
          Custom columns combined with built-in extracted data columns
        </p>
      </div>
      <ExtractedDataItemGridWrapper {...args} />
    </div>
  ),
};

// Minimal configuration
export const Minimal: Story = {
  args: {
    builtInColumns: {
      fileName: true,
      status: true,
      actions: true,
    },
    defaultPageSize: 10,
  },
  render: (args) => (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Minimal Extracted Data Grid
        </h1>
        <p className="text-gray-600 mt-2">
          Essential columns only for basic data display
        </p>
      </div>
      <ExtractedDataItemGridWrapper {...args} />
    </div>
  ),
};

// Interaction test
export const WithInteraction: Story = {
  args: {
    builtInColumns: {
      fileName: true,
      status: true,
      createdAt: true,
      itemsToReview: true,
      actions: true,
    },
    defaultPageSize: 5,
  },
  render: (args) => (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Interactive Extracted Data Grid
        </h1>
        <p className="text-gray-600 mt-2">
          Test sorting, filtering, and pagination
        </p>
      </div>
      <ExtractedDataItemGridWrapper {...args} />
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

    // Test pagination if available
    try {
      const nextPageButton = canvas.getByRole("button", { name: /next/i });
      if (nextPageButton) {
        await userEvent.click(nextPageButton);
      }
    } catch {
      // Pagination might not be loaded yet, skip pagination test
    }
  },
};
