import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect } from "react";
import ChatInput from "@/src/chat/components/chat-input";
import ChatCanvas from "@/src/chat/components/canvas";
import { useChatUI } from "@/src/chat/components/chat.context";
import { TextPartType, SuggestionPartType } from "@/src/chat/components/message-parts/types";
import ChatMessages from "@/src/chat/components/chat-messages";
import { WithBasicHandler } from "../decorators/chat-decorators";

const meta: Meta = {
  title: "Chat/Messages",
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <WithBasicHandler>
        <Story />
      </WithBasicHandler>
    ),
  ],
};

export default meta;
type Story = StoryObj;

function InteractiveThread() {
  const { messages, setMessages } = useChatUI();

  // seed initial assistant message
  useEffect(() => {
    if (messages.length === 0 && setMessages) {
      setMessages([
        {
          id: "init-assistant",
          role: "assistant",
          parts: [
            { type: TextPartType, text: "Hi! How can I help?" },
            {
              type: SuggestionPartType,
              data: ["Summarize the document", "Find key risks", "List next steps"],
            },
          ],
        },
      ]);
    }
  }, [messages.length, setMessages]);

  // streaming handler handles assistant reply; no local sources needed

  // reply streaming is handled by handler.sendMessage; no local auto-reply here

  // ChatThread handles auto scroll internally

  return (
    <div className="flex">
      <div style={{ maxWidth: 720 }} className="flex min-h-0 flex-1 h-screen flex-col overflow-hidden">
        <ChatMessages />
        <div className="shrink-0">
          <ChatInput />
        </div>
      </div>
      <div className="flex-1 min-w-0 h-screen">
        <ChatCanvas />
      </div>
    </div>
  );
}

export const Interactive: Story = {
  render: () => (
    <InteractiveThread />
  ),
};


