/**
 * Chat Storybook
 * Demonstrates useChat hook with MSW mocked streaming
 */

import type { Meta, StoryObj } from "@storybook/react-vite";
import { useChat } from "../../src/chat/hooks/use-chat";
import { ApiProvider } from "../../src/lib/api-provider";
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
};

/**
 * Complex response with XML markers
 */
export const WithXMLMarkers: Story = {
  args: {
    storyId: "with-xml-markers",
  },
};

/**
 * Code block in response
 */
export const WithCodeBlock: Story = {
  args: {
    storyId: "with-code-block",
  },
};
