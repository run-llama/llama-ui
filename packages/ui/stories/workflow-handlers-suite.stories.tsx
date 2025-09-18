import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import {
  useWorkflowHandlerList,
  useWorkflowHandler,
  WorkflowTrigger,
  WorkflowProgressBar,
  useHandlerStore,
} from "../src/workflows";
import { AgentStreamDisplay } from "../src/workflows/components/agent-stream-display";
import { ApiProvider, createMockClients } from "../src/lib";

// Handler Trigger & Progress Component
function HandlerTriggerSection({
  onHandlerClick,
  selectedHandlerId,
}: {
  onHandlerClick: (handlerId: string) => void;
  selectedHandlerId: string | null;
}) {
  const { handlers, clearCompleted } = useWorkflowHandlerList();
  const { createHandler } = useHandlerStore();
  const [batchSize, setBatchSize] = useState(3);
  const [isCreatingBatch, setIsCreatingBatch] = useState(false);

  // Sample handler configurations for batch creation
  const handlerConfigs = [
    {
      name: "Document Analysis",
      input: { file: "document1.pdf", type: "analysis" },
    },
    {
      name: "Data Processing",
      input: { file: "data.csv", type: "processing" },
    },
    {
      name: "Image Recognition",
      input: { file: "image.jpg", type: "recognition" },
    },
    {
      name: "Text Extraction",
      input: { file: "text.docx", type: "extraction" },
    },
    {
      name: "Report Generation",
      input: { file: "report.xlsx", type: "generation" },
    },
  ];

  const createBatchHandlers = async () => {
    setIsCreatingBatch(true);
    try {
      // Create multiple handlers simultaneously
      const promises = Array.from({ length: batchSize }, async (_, index) => {
        const config = handlerConfigs[index % handlerConfigs.length];
        const input = {
          ...config.input,
          taskName: `${config.name} #${index + 1}`,
          batchId: Date.now(),
        };

        // Stagger the creation slightly to see the effect
        await new Promise((resolve) => setTimeout(resolve, index * 100));
        return createHandler("test-workflow", input);
      });

      await Promise.all(promises);
    } catch {
      // Failed to create batch handlers
    } finally {
      setIsCreatingBatch(false);
    }
  };

  return (
    <div className="p-6 border-r border-gray-200 w-1/2 space-y-6">
      {/* Batch Handler Creation */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Batch Handler Creation</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Batch Size:</label>
            <select
              value={batchSize}
              onChange={(e) => setBatchSize(Number(e.target.value))}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
              disabled={isCreatingBatch}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n} handlers
                </option>
              ))}
            </select>
            <button
              onClick={createBatchHandlers}
              disabled={isCreatingBatch}
              className={`px-4 py-2 text-sm font-medium rounded ${
                isCreatingBatch
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {isCreatingBatch ? "Creating..." : `Create ${batchSize} Handlers`}
            </button>
            {handlers.length > 0 && (
              <button
                onClick={clearCompleted}
                className="px-4 py-2 text-sm font-medium rounded bg-gray-600 text-white hover:bg-gray-700"
              >
                Clear Completed
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Single Handler Creation */}
      <div>
        <h3 className="text-lg font-medium mb-3">Or Create Single Handler</h3>
        <WorkflowTrigger
          workflowName="test-workflow"
          onSuccess={() => {
            // Handler completed successfully
          }}
        />
      </div>

      {/* Progress Section with WorkflowProgressBar */}
      {handlers.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-3">
            Overall Progress ({handlers.length} handlers)
          </h3>
          <WorkflowProgressBar />

          {/* Enhanced Handler List */}
          <div className="mt-4 space-y-2">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-medium text-gray-700">
                Handler List (click to view details):
              </h4>
              <div className="text-xs text-gray-500">
                Running: {handlers.filter((t) => t.status === "running").length}{" "}
                | Complete:{" "}
                {handlers.filter((t) => t.status === "complete").length} |
                Error: {handlers.filter((t) => t.status === "failed").length}
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1 border rounded-lg">
              {handlers.map((handler, index) => {
                const isSelected = selectedHandlerId === handler.handler_id;
                return (
                  <div
                    key={handler.handler_id}
                    className={`flex justify-between items-center text-sm p-3 cursor-pointer transition-colors border-b last:border-b-0 ${
                      isSelected
                        ? "bg-blue-50 border-l-4 border-l-blue-500"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => onHandlerClick(handler.handler_id)}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        #{index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium text-gray-700">
                          Handler {index + 1}
                        </div>
                        <div className="font-mono text-xs text-gray-500 truncate">
                          {handler.handler_id}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium flex-shrink-0 ${
                        handler.status === "complete"
                          ? "bg-green-100 text-green-800"
                          : handler.status === "failed"
                            ? "bg-red-100 text-red-800"
                            : handler.status === "running"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {handler.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Handler Detail Component with AgentStreamDisplay
function HandlerDetailSection({ handlerId }: { handlerId: string | null }) {
  // Always call hooks at the top level
  const taskDetail = useWorkflowHandler(handlerId || "");

  if (!handlerId) {
    return (
      <div className="p-6 w-1/2 flex items-center justify-center text-gray-500">
        Create a handler to view processing details
      </div>
    );
  }

  // Handler detail information available in taskDetail object

  if (!taskDetail.handler) {
    return (
      <div className="p-6 w-1/2 flex items-center justify-center text-gray-500">
        Loading handler details...
      </div>
    );
  }

  return (
    <div className="p-6 w-1/2">
      <div className="mb-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-semibold">Handler Details</h2>
          <div className="flex gap-2">
            <button
              onClick={taskDetail.clearEvents}
              className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Clear Events
            </button>
            <button
              onClick={taskDetail.stopStreaming}
              className="px-3 py-1 text-sm bg-red-200 text-red-700 rounded hover:bg-red-300"
            >
              Stop Stream
            </button>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div>
            <span className="font-medium">Handler ID:</span>{" "}
            {taskDetail.handler.handler_id}
          </div>
          <div>
            <span className="font-medium">Status:</span>
            <span
              className={`ml-2 px-2 py-1 rounded text-sm ${
                taskDetail.handler.status === "complete"
                  ? "bg-green-100 text-green-800"
                  : taskDetail.handler.status === "failed"
                    ? "bg-red-100 text-red-800"
                    : taskDetail.handler.status === "running"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-800"
              }`}
            >
              {taskDetail.handler.status}
            </span>
          </div>
          <div>
            <span className="font-medium">Streaming:</span>
            <span
              className={`ml-2 px-2 py-1 rounded text-sm ${
                taskDetail.isStreaming
                  ? "bg-blue-100 text-blue-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {taskDetail.isStreaming ? "Active" : "Inactive"}
            </span>
          </div>
          <div>
            <span className="font-medium">Events:</span>
            <span className="ml-2 text-sm text-gray-600">
              {taskDetail.events.length} events received
            </span>
          </div>
        </div>
      </div>

      {/* Agent Stream - use handler ID */}
      <AgentStreamDisplay
        handlerId={taskDetail.handler.handler_id}
        title="Processing Steps"
        className="mb-4"
      />
    </div>
  );
}

// Internal Suite Component (uses hooks inside Provider)
function WorkflowHandlerSuiteInternal() {
  const { handlers } = useWorkflowHandlerList();
  const [selectedHandlerId, setSelectedHandlerId] = useState<string | null>(
    null
  );

  // Get the selected handler or the most recent handler for details
  const selectedHandler = selectedHandlerId
    ? handlers.find((t) => t.handler_id === selectedHandlerId)
    : handlers.length > 0
      ? handlers[handlers.length - 1]
      : null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
        <h1 className="text-2xl font-bold mb-2">Workflow Handler Suite</h1>
        <p className="text-gray-600">
          Complete workflow management with trigger, progress tracking, and
          processing details
        </p>
      </div>

      {/* Main Content */}
      <div className="flex h-[800px] border rounded-lg">
        <HandlerTriggerSection
          onHandlerClick={setSelectedHandlerId}
          selectedHandlerId={selectedHandlerId}
        />
        <HandlerDetailSection handlerId={selectedHandler?.handler_id || null} />
      </div>
    </div>
  );
}

// Main Suite Component with ApiProvider
function WorkflowHandlerSuite() {
  return (
    <ApiProvider clients={createMockClients()}>
      <WorkflowHandlerSuiteInternal />
    </ApiProvider>
  );
}

const meta: Meta<typeof WorkflowHandlerSuite> = {
  title: "Components/Workflow Handler Suite",
  component: WorkflowHandlerSuite,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A complete workflow handler management suite including handler creation, progress tracking, and processing detail viewing.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof WorkflowHandlerSuite>;

export const Default: Story = {
  name: "Complete Workflow Suite",
  parameters: {
    docs: {
      description: {
        story: `
This story demonstrates a complete workflow handler management suite with batch processing capabilities:

**Components included:**
- **Batch Handler Creation**: Create multiple workflow handlers simultaneously
- **Handler Trigger**: File uploader with form validation to create individual handlers
- **Progress Tracking**: Real-time progress bar showing overall task completion
- **Processing Details**: Step-by-step processing visualization with handler information
- **Handler Management**: Summary of all handlers with status indicators and counters

**Features:**
- **Batch Processing**: Create 1-5 handlers simultaneously to test concurrent workflows
- **Individual Handler Creation**: Upload files with part number validation
- **Real-time Progress**: Live progress bar and status updates
- **Handler Management**: Clear completed handlers, view handler counters
- **Processing Visualization**: Step-by-step processing with timestamps
- **Concurrent Handler Processing**: Demonstrates the store's ability to handle multiple simultaneous handlers

**How to use:**
1. **Batch Creation**: Select batch size (1-5) and click "Create X Handlers" to test concurrent processing
2. **Individual Handlers**: Upload a file and enter a part number for single handler creation
3. **Monitor Progress**: Watch the overall progress bar and individual handler statuses
4. **View Details**: Click on handlers to see detailed processing steps in the right panel
5. **Manage Handlers**: Use "Clear Completed" to clean up finished handlers

**Technical Highlights:**
- Tests the duplicate subscription fix (no repeated events)
- Demonstrates concurrent handler processing
- Shows real-time UI updates with multiple active streams
- Validates handler store performance under load

The suite uses MSW (Mock Service Worker) to simulate realistic API responses and streaming events.
        `,
      },
    },
  },
};
