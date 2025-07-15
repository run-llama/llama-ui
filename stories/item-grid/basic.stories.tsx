import type { Meta, StoryObj } from "@storybook/react-vite";
import { ItemGrid } from "../../src/ui/item-grid";

import type { Column } from "../../src/ui/item-grid/types";
import type {
  AgentClient,
  ExtractedData,
  TypedAgentData,
} from "@llamaindex/cloud/beta/agent";

// Meta configuration for the ItemGrid component
const meta = {
  title: "Business/ItemGrid",
  component: ItemGrid,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "A configurable business component for displaying and managing items with built-in and custom columns, filtering, sorting, and pagination.",
      },
    },
  },
  argTypes: {
    builtInColumns: {
      description:
        "Configuration for built-in columns (fileName, status, createdAt, itemsToReview)",
      control: { type: "object" },
    },
    customColumns: {
      description: "Array of custom column configurations",
      control: { type: "object" },
    },
    defaultPageSize: {
      description: "Default number of items per page",
      control: { type: "number" },
    },
    useMockData: {
      description: "Use mock data instead of real API",
      control: { type: "boolean" },
    },
  },
} satisfies Meta<typeof ItemGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockClient = {} as unknown as AgentClient<ExtractedData>;

// Default story with built-in columns
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
    useMockData: true,
    onRowClick: () => {},
    client: mockClient,
  },
  render: (args) => (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Item Management</h1>
        <p className="text-gray-600 mt-2">
          Complete item management system with built-in columns, filtering,
          sorting, and pagination
        </p>
      </div>
      <ItemGrid
        {...args}
        onRowClick={(item: TypedAgentData<ExtractedData>) =>
          console.log(`Clicked row: ${item.data.file_name}`)
        }
      />
    </div>
  ),
};

// Custom configuration with built-in column overrides
export const CustomizedBuiltInColumns: Story = {
  args: {
    builtInColumns: {
      fileName: { header: "Document Name" },
      status: {
        header: "Review Status",
        sortable: false,
      },
      itemsToReview: { header: "Low Confidence Items" },
      createdAt: false, // Hide created at column
      actions: true,
    },
    defaultPageSize: 15,
    useMockData: true,
    onRowClick: () => {},
    client: mockClient,
  },
  render: (args) => (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Customized Built-in Columns
        </h1>
        <p className="text-gray-600 mt-2">
          Built-in columns with custom headers and configuration overrides
        </p>
      </div>
      <ItemGrid
        {...args}
        onRowClick={(item: TypedAgentData<ExtractedData>) =>
          console.log(`Clicked row: ${item.data.file_name}`)
        }
      />
    </div>
  ),
};

// Mixed custom and built-in columns
export const MixedColumns: Story = {
  args: {
    customColumns: [
      {
        key: "priority",
        header: "Priority",
        getValue: () => "High", // Mock priority value
        renderCell: (value: unknown) => (
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${
              value === "High"
                ? "bg-red-100 text-red-800"
                : value === "Medium"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-green-100 text-green-800"
            }`}
          >
            {String(value)}
          </span>
        ),
        sortable: true,
      },
    ] as Column[],
    builtInColumns: {
      fileName: true,
      status: true,
      itemsToReview: true,
      actions: true,
    },
    defaultPageSize: 15,
    useMockData: true,
    onRowClick: () => {},
    client: mockClient,
  },
  render: (args) => (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mixed Columns</h1>
        <p className="text-gray-600 mt-2">
          Combination of custom columns (first) and built-in columns
        </p>
      </div>
      <ItemGrid
        {...args}
        onRowClick={(item: TypedAgentData<ExtractedData>) =>
          console.log(`Clicked row: ${item.data.file_name}`)
        }
      />
    </div>
  ),
};
