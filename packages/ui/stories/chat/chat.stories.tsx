/**
 * Chat Storybook
 * Demonstrates useChat hook with MSW mocked streaming
 */

import type { Meta, StoryObj } from "@storybook/react-vite";
import { useChat } from "../../src/chat/hooks/use-chat";
import { ApiProvider } from "../../src/lib/api-provider";
import {
  createWorkflowHandlers,
  chatEventGenerator,
} from "../../.storybook/mocks";
import { createWorkflowsClient } from "../../src/lib/clients";
import ChatSection from "../../src/chat/components/chat-section";

// Mock client
const mockClient = createWorkflowsClient({
  baseUrl: "http://localhost:8000",
});

/**
 * Chat Component using ChatSection
 */
function ChatDemo() {
  const chat = useChat({
    workflowName: "chat_agent",
  });

  return (
    <div className="h-screen w-screen">
      <ChatSection handler={chat} />
    </div>
  );
}

/**
 * Wrapper with ApiProvider
 */
function ChatWrapper({ storyId }: { storyId?: string }) {
  return (
    <ApiProvider key={storyId} clients={{ workflowsClient: mockClient }}>
      <ChatDemo />
    </ApiProvider>
  );
}

// ===== Story Configuration =====

const meta: Meta<typeof ChatWrapper> = {
  title: "Chat/useChat Hook",
  component: ChatWrapper,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Interactive chat demo using useChat hook with MSW mocked streaming responses.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ChatWrapper>;

// ===== Stories =====

/**
 * Basic chat with default streaming
 */
export const Default: Story = {
  args: {
    storyId: "default",
  },
  parameters: {
    msw: {
      handlers: createWorkflowHandlers({
        eventGenerator: chatEventGenerator,
        eventDelay: 300,
        initialDelay: 500,
      }),
    },
  },
};

/**
 * Complex response with XML markers
 */
export const WithXMLMarkers: Story = {
  args: {
    storyId: "with-xml-markers",
  },
  parameters: {
    msw: {
      handlers: createWorkflowHandlers({
        eventGenerator: (): Array<{ type: string; data: unknown }> => [
          {
            type: "workflow.events.ChatDeltaEvent",
            data: { delta: "Let me search for that information.\n\n" },
          },
          {
            type: "workflow.events.ChatDeltaEvent",
            data: { delta: "<event>\n" },
          },
          {
            type: "workflow.events.ChatDeltaEvent",
            data: {
              delta: '{"title": "Searching database", "status": "success"}\n',
            },
          },
          {
            type: "workflow.events.ChatDeltaEvent",
            data: { delta: "</event>\n\n" },
          },
          {
            type: "workflow.events.ChatDeltaEvent",
            data: {
              delta: "I found the following results [citation:node-1].\n\n",
            },
          },
          {
            type: "workflow.events.ChatDeltaEvent",
            data: { delta: "<sources>\n" },
          },
          {
            type: "workflow.events.ChatDeltaEvent",
            data: {
              delta:
                '{"nodes": [{"id": "node-1", "text": "Result 1", "metadata": {"title": "Document 1"}, "url": "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf"}]}\n',
            },
          },
          {
            type: "workflow.events.ChatDeltaEvent",
            data: { delta: "</sources>\n\n" },
          },
          {
            type: "workflow.events.ChatDeltaEvent",
            data: { delta: "Is there anything else you'd like to know?\n\n" },
          },
          {
            type: "workflow.events.ChatDeltaEvent",
            data: { delta: "<suggested_questions>\n" },
          },
          {
            type: "workflow.events.ChatDeltaEvent",
            data: { delta: '["Tell me more", "What are the details?"]\n' },
          },
          {
            type: "workflow.events.ChatDeltaEvent",
            data: { delta: "</suggested_questions>" },
          },
          {
            type: "workflow.events.InputRequiredEvent",
            data: { prefix: "waiting" },
          },
        ],
        eventDelay: 200,
        initialDelay: 500,
      }),
    },
  },
};

/**
 * Code block in response
 */
export const WithCodeBlock: Story = {
  args: {
    storyId: "with-code-block",
  },
  parameters: {
    msw: {
      handlers: createWorkflowHandlers({
        eventGenerator: (): Array<{ type: string; data: unknown }> => [
          {
            type: "workflow.events.ChatDeltaEvent",
            data: { delta: "Here's a Python example:\n\n" },
          },
          { type: "workflow.events.ChatDeltaEvent", data: { delta: "```py" } },
          { type: "workflow.events.ChatDeltaEvent", data: { delta: "thon\n" } },
          {
            type: "workflow.events.ChatDeltaEvent",
            data: { delta: "def hello():\n" },
          },
          {
            type: "workflow.events.ChatDeltaEvent",
            data: { delta: "    print('Hello, World!')\n" },
          },
          {
            type: "workflow.events.ChatDeltaEvent",
            data: { delta: "```\n\n" },
          },
          {
            type: "workflow.events.ChatDeltaEvent",
            data: { delta: "This function prints a greeting." },
          },
          {
            type: "workflow.events.InputRequiredEvent",
            data: { prefix: "waiting" },
          },
        ],
        eventDelay: 150,
        initialDelay: 500,
      }),
    },
  },
};
