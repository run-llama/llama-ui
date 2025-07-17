import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { FileText, Clock, CheckCircle, Zap, Database } from "lucide-react";
import { ProcessingSteps } from "../../src/processing-steps/ProcessingSteps";
import type { WorkflowEvent } from "../../src/processing-steps/types";

// Mock workflow events for different scenarios
const invoiceWorkflowEvents: WorkflowEvent[] = [
  {
    event_name: "FileReceived",
    label: "File Received",
    status: "completed",
    timestamp: "2024-01-15T10:30:00Z",
    icon: FileText,
  },
  {
    event_name: "ExtractInvoiceData",
    label: "Extract Invoice Data",
    status: "completed",
    timestamp: "2024-01-15T10:32:15Z",
    icon: Zap,
  },
  {
    event_name: "ValidateExtraction",
    label: "Validate Extraction",
    status: "current",
    icon: CheckCircle,
  },
  {
    event_name: "StoreResults",
    label: "Store Results",
    status: "pending",
    icon: Database,
  },
];

const completedWorkflowEvents: WorkflowEvent[] = [
  {
    event_name: "FileReceived",
    label: "File Received",
    status: "completed",
    timestamp: "2024-01-15T10:30:00Z",
    icon: FileText,
  },
  {
    event_name: "ProcessDocument",
    label: "Process Document",
    status: "completed",
    timestamp: "2024-01-15T10:32:15Z",
    icon: Clock,
  },
  {
    event_name: "StoreResults",
    label: "Store Results",
    status: "completed",
    timestamp: "2024-01-15T10:35:45Z",
    icon: Database,
  },
];

const meta = {
  title: "UI/ProcessingSteps",
  component: ProcessingSteps,
  parameters: {
    layout: "padded",
  },
  argTypes: {
    isCollapsed: {
      control: "boolean",
    },
    title: {
      control: "text",
    },
  },
} satisfies Meta<typeof ProcessingSteps>;

export default meta;
type Story = StoryObj<typeof meta>;

// In progress workflow
export const InProgress: Story = {
  args: {
    workflowEvents: invoiceWorkflowEvents,
    isCollapsed: false,
    title: "Invoice Processing",
  },
};

// Completed workflow
export const Completed: Story = {
  args: {
    workflowEvents: completedWorkflowEvents,
    isCollapsed: false,
    title: "Document Processing",
  },
};

// Interactive example with toggle functionality
export const Interactive: Story = {
  args: {
    workflowEvents: completedWorkflowEvents,
    isCollapsed: false,
    title: "Interactive Workflow",
  },
  render: (args) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
      <div style={{ padding: "20px", maxWidth: "400px" }}>
        <ProcessingSteps
          {...args}
          isCollapsed={isCollapsed}
          onToggle={() => setIsCollapsed(!isCollapsed)}
        />
      </div>
    );
  },
};
