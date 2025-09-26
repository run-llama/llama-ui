import type { Meta, StoryObj } from "@storybook/react-vite";
import ChatMessage from "@/src/chat/components/chat-message";
import { WithBasicHandler } from "../decorators/chat-decorators";
import { sampleSources } from "../fixtures";
import {
  TextPartType,
  SourcesPartType,
} from "@/src/chat/components/message-parts/types";
import { buildComprehensiveMarkdown } from "../fixtures/markdown-samples";
import ChatMessages from "@/src/chat/components/chat-messages";
import ChatCanvas from "@/src/chat/components/canvas";
import ChatInput from "@/src/chat/components/chat-input";
import { useChatUI } from "@/src/chat/components/chat.context";

const meta: Meta<typeof ChatMessage> = {
  title: "Chat/Messages",
  component: ChatMessage,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <WithBasicHandler>
        <div className="flex">
          <div
            style={{ maxWidth: 720 }}
            className="flex min-h-0 flex-1 h-screen flex-col overflow-hidden"
          >
            <ChatMessages>
              <div className="flex flex-col gap-4">
                <Story />
              </div>
            </ChatMessages>
          </div>
          <div className="flex-1 min-w-0 h-screen">
            <ChatCanvas />
          </div>
        </div>
      </WithBasicHandler>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ChatMessage>;

export const SimpleMessage: Story = {
  args: {
    isLast: true,
    message: {
      id: "m-1",
      role: "assistant",
      parts: [{ type: TextPartType, text: "Hello! This is a simple message." }],
    },
  },
};

export const MarkdownMessage: Story = {
  args: {
    isLast: true,
    message: {
      id: "m-2",
      role: "assistant",
      parts: [
        {
          type: TextPartType,
          text: buildComprehensiveMarkdown(),
        },
      ],
    },
  },
};

// TODO: unify with artifact type in canvas.
export const MessageWithCitations: Story = {
  args: {
    isLast: true,
    message: {
      id: "m-3",
      role: "assistant",
      parts: [
        {
          type: TextPartType,
          text: "This statement references a source [citation:node-1]. Another [citation:node-2].",
        },
        { type: SourcesPartType, data: sampleSources },
      ],
    },
  },
};

export const MessageWithSuggestions: Story = {
  render: (args) => {
    function Thread() {
      const { messages } = useChatUI();
      return (
        <div className="flex flex-col gap-4">
          <ChatMessage {...args} isLast={messages.length === 0} />
          {messages.map((m, idx) => (
            <ChatMessage
              key={m.id}
              message={m}
              isLast={idx === messages.length - 1}
            />
          ))}
          <ChatInput />
        </div>
      );
    }
    return <Thread />;
  },
  args: {
    isLast: true,
    message: {
      id: "m-4",
      role: "assistant",
      parts: [
        { type: TextPartType, text: "You can try any of these suggestions:" },
        {
          type: "data-suggested_questions",
          data: ["Summarize the document", "Find key risks", "List next steps"],
        },
      ],
    },
  },
};

export const MessageWithEvents: Story = {
  args: {
    isLast: true,
    message: {
      id: "m-6",
      role: "assistant",
      parts: [
        {
          type: "data-event",
          data: { title: "Fetching data", status: "pending" },
        },
        { type: "data-event", data: { title: "Processed", status: "success" } },
      ],
    },
  },
};
