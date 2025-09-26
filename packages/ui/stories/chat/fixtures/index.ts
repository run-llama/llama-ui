import type { Message } from "@/src/chat/components/chat.interface";
import {
  TextPartType,
  SourcesPartType,
} from "@/src/chat/components/message-parts/types";
import type { SourceData } from "@/src/chat/widgets/chat-sources";

export const sampleQuestions = [
  "What can you do?",
  "Summarize the document",
  "Extract key points",
  "Generate next steps",
];

export const sampleSuggestedQuestions = [
  "What is the conclusion?",
  "Any risks or blockers?",
  "Provide a short summary",
];

export const sampleSources: SourceData = {
  nodes: [
    {
      id: "node-1",
      text: "First paragraph from the document.",
      metadata: { page_number: 1 },
      url: "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf",
    },
    {
      id: "node-2",
      text: "Second paragraph with details.",
      metadata: { page_number: 2 },
      url: "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf",
    },
    {
      id: "node-3",
      text: "Related reference material.",
      metadata: { page_number: 5 },
      url: "https://example-files.online-convert.com/document/txt/example.txt",
    },
  ],
};

export const sampleAssistantMessage: Message = {
  id: "m-assistant-1",
  role: "assistant",
  parts: [
    {
      type: TextPartType,
      text: "Here is a short response with sources: [citation:node-1].",
    },
    { type: SourcesPartType, data: sampleSources },
  ],
};

export const sampleUserMessage: Message = {
  id: "m-user-1",
  role: "user",
  parts: [{ type: TextPartType, text: "Please summarize the document." }],
};
