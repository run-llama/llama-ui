import React, { useMemo, useRef, useState } from "react";
import { ChatProvider } from "@/src/chat/components/chat.context";
import ChatSection from "@/src/chat/components/chat-section";
import type { ChatContext, ChatHandler, ChatRequestOptions, Message } from "@/src/chat/components/chat.interface";
import { TextPartType, SourcesPartType, SuggestionPartType, EventPartType } from "@/src/chat/components/message-parts/types";
import type { MessagePart, TextPart } from "@/src/chat/components/message-parts/types";
import { sampleSources } from "../fixtures";

export function BasicChatProvider(props: React.PropsWithChildren) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [requestData, setRequestData] = useState<unknown>(null);
  const [status, setStatus] = useState<ChatContext["status"]>("ready");

  const value = useMemo<ChatContext>(() => {
    const sendMessage = async (msg: Message, _opts?: ChatRequestOptions) => {
      setStatus("submitted");
      setMessages(prev => [...prev, msg]);
      setStatus("ready");
    };

    const setRequestDataAny: ChatContext["setRequestData"] = (data) => setRequestData(data);

    return {
      // chat handler
      messages,
      status,
      sendMessage,
      stop: undefined,
      regenerate: undefined,
      setMessages,

      // user input state
      input,
      setInput,

      // requestData
      requestData,
      setRequestData: setRequestDataAny,

      // computed
      isLoading: status === "streaming" || status === "submitted",
    };
  }, [input, messages, requestData, status]);

  return <ChatProvider value={value}>{props.children}</ChatProvider>;
}

export function useBasicHandler(): ChatHandler {
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<ChatHandler["status"]>("ready");
  const timeoutsRef = useRef<number[]>([]);
  const stoppedRef = useRef<boolean>(false);

  const clearTimers = () => {
    timeoutsRef.current.forEach(t => clearTimeout(t));
    timeoutsRef.current = [];
  };

  return useMemo<ChatHandler>(() => {
    const sendMessage = async (msg: Message, _opts?: ChatRequestOptions) => {
      // append user message
      setStatus("submitted");
      setMessages(prev => [...prev, msg]);

      // start streaming
      setStatus("streaming");
      stoppedRef.current = false;
      clearTimers();

      const assistantId = `assistant-${Date.now()}`;

      // placeholder assistant message
      setMessages(prev => [
        ...prev,
        {
          id: assistantId,
          role: "assistant",
          parts: [{ type: TextPartType, text: "" }],
        },
      ]);

      const textChunks = [
        "Here is a brief summary with some sources and follow-up suggestions.",
        "You can also click a PDF to preview in the right panel.",
        "If you'd like, I can extract action items next.",
      ];

      // progressively append text
      let delay = 300;
      textChunks.forEach(chunk => {
        const tid = window.setTimeout(() => {
          if (stoppedRef.current) return;
          setMessages(prev => {
            const isTextPart = (p: MessagePart): p is TextPart => p.type === TextPartType;
            return prev.map(m => {
              if (m.id !== assistantId) return m;
              const first = m.parts[0];
              if (first && isTextPart(first)) {
                const newText = `${first.text}${first.text ? " " : ""}${chunk}`;
                return {
                  ...m,
                  parts: [
                    { type: TextPartType, text: newText },
                    ...m.parts.slice(1),
                  ],
                };
              }
              return {
                ...m,
                parts: [{ type: TextPartType, text: chunk }, ...m.parts],
              };
            });
          });
        }, delay);
        timeoutsRef.current.push(tid);
        delay += 500;
      });

      // add sources after text
      const addSourcesTid = window.setTimeout(() => {
        if (stoppedRef.current) return;
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantId
              ? { ...m, parts: [...m.parts, { type: SourcesPartType, data: sampleSources }] }
              : m
          )
        );
      }, delay);
      timeoutsRef.current.push(addSourcesTid);
      delay += 400;

      // add suggestions
      const addSuggestionsTid = window.setTimeout(() => {
        if (stoppedRef.current) return;
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantId
              ? {
                  ...m,
                  parts: [
                    ...m.parts,
                    {
                      type: SuggestionPartType,
                      data: [
                        "Highlight key sections",
                        "Extract action items",
                        "Estimate timeline",
                      ],
                    },
                  ],
                }
              : m
          )
        );
      }, delay);
      timeoutsRef.current.push(addSuggestionsTid);
      delay += 400;

      // finish event and mark ready
      const finishTid = window.setTimeout(() => {
        if (stoppedRef.current) return;
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantId
              ? {
                  ...m,
                  parts: [
                    ...m.parts,
                    { type: EventPartType, data: { title: "Processed", status: "success" } },
                  ],
                }
              : m
          )
        );
        setStatus("ready");
        clearTimers();
      }, delay);
      timeoutsRef.current.push(finishTid);
    };

    return {
      messages,
      status,
      sendMessage,
      stop: async () => {
        stoppedRef.current = true;
        clearTimers();
        setStatus("ready");
        // finalize current assistant placeholder if exists
        setMessages(prev => prev);
      },
      regenerate: undefined,
      setMessages,
    };
  }, [messages, status]);
}

export function WithBasicHandler(props: React.PropsWithChildren) {
  const handler = useBasicHandler();
  return <ChatSection handler={handler}>{props.children}</ChatSection>;
}


