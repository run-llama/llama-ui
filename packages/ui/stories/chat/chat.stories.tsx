/**
 * Chat Storybook
 * Demonstrates useChat hook with MSW mocked streaming
 */

import type { Meta, StoryObj } from "@storybook/react-vite";
import { useChat } from "../../src/chat/hooks/use-chat";
import { ApiProvider } from "../../src/lib/api-provider";
import { createWorkflowsClient } from "../../src/lib/clients";
import ChatSection from "../../src/chat/components/chat-section";
import ChatMessages from "../../src/chat/components/chat-messages";
import ChatInput from "../../src/chat/components/chat-input";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "../../base/resizable";

// Mock client
const mockClient = createWorkflowsClient({
  baseUrl: "http://localhost:8000",
});

/**
 * Chat Component using ChatSection
 */
function ChatDemo({ withCanvas }: { withCanvas?: boolean }) {
  const chat = useChat({
    workflowName: "chat_agent",
  });

  const chatContent = (
    <div className="flex w-full h-full min-h-0 flex-1 flex-col overflow-hidden">
      <ChatMessages />
      <div className="shrink-0">
        <ChatInput />
      </div>
    </div>
  );

  if (!withCanvas) {
    return (
      <div className="h-screen w-screen">
        <ChatSection handler={chat}>{chatContent}</ChatSection>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={60} minSize={30}>
          <ChatSection handler={chat}>{chatContent}</ChatSection>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={40} minSize={20}>
          <div className="h-full bg-muted/50 p-4">
            <p className="font-medium">Sidebar</p>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

/**
 * Wrapper with ApiProvider
 */
function ChatWrapper({
  storyId,
  withCanvas,
}: {
  storyId?: string;
  withCanvas?: boolean;
}) {
  return (
    <ApiProvider key={storyId} clients={{ workflowsClient: mockClient }}>
      <ChatDemo withCanvas={withCanvas} />
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

/**
 * With resizable canvas - test that chat input height stays stable when resizing
 */
export const WithCanvas: Story = {
  args: {
    storyId: "with-canvas",
    withCanvas: true,
  },
};
