import type { Meta, StoryObj } from "@storybook/react";
import { AgentStreamDisplay } from "../../src/agent-stream-display/agent-stream-display";
import type { AgentStreamEvent } from "../../src/agent-stream-display/types";

// Mock events
const mockEvents: AgentStreamEvent[] = [
  {
    type: "AgentStream",
    data: {
      message: "Starting file analysis...",
    },
  },
  {
    type: "AgentStream", 
    data: {
      message: "Extracting text content from document...",
    },
  },
  {
    type: "AgentStream",
    data: {
      message: "Processing with AI model...",
    },
  },
  {
    type: "AgentStream",
    data: {
      message: "Generating structured output...",
    },
  },
  {
    type: "AgentStream",
    data: {
      message: "Analysis complete! Ready for review.",
    },
  },
];

const longMessageEvents: AgentStreamEvent[] = [
  {
    type: "AgentStream",
    data: {
      message: "Initializing workflow engine and preparing system resources for document processing pipeline...",
    },
  },
  {
    type: "AgentStream",
    data: {
      message: "Uploading and validating file format, checking for supported document types and file integrity...", 
    },
  },
  {
    type: "AgentStream",
    data: {
      message: "Running advanced optical character recognition (OCR) algorithms to extract text content...",
    },
  },
];

const meta = {
  title: "UI/AgentStreamDisplay",
  component: AgentStreamDisplay,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "Displays a stream of agent processing messages with random icons.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    title: {
      control: "text",
      description: "The title displayed at the top of the component",
    },
  },
} satisfies Meta<typeof AgentStreamDisplay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    events: mockEvents,
    title: "Agent Processing",
  },
};

export const CustomTitle: Story = {
  args: {
    events: mockEvents,
    title: "Document Analysis Progress",
  },
};

export const SingleEvent: Story = {
  args: {
    events: [mockEvents[0]],
    title: "Getting Started",
  },
};

export const LongMessages: Story = {
  args: {
    events: longMessageEvents,
    title: "Detailed Processing",
  },
};

export const EmptyEvents: Story = {
  args: {
    events: [],
    title: "No Events",
  },
};

export const InteractiveDemo: Story = {
  args: {
    events: mockEvents,
    title: "Live Agent Stream",
  },
  render: (args) => {
    return (
      <div className="w-96">
        <AgentStreamDisplay {...args} />
      </div>
    );
  },
}; 