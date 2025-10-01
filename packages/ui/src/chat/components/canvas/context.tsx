"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Artifact,
  extractArtifactsFromMessage,
  extractArtifactsFromAllMessages,
  isEqualArtifact,
  ArtifactType,
} from "./artifacts";
import { Message, MessageRole } from "../chat.interface";
import { TextPartType, ArtifactPartType } from "../message-parts/types";
import { useChatUI } from "../chat.context";
import { v4 as uuid } from "uuid";

interface ChatCanvasContextType {
  allArtifacts: Artifact[];
  getArtifactsByType: (type: Artifact["type"]) => Artifact[];
  displayedArtifact: Artifact | undefined;
  isCanvasOpen: boolean;
  openArtifactInCanvas: (artifact: Artifact) => void;
  closeCanvas: () => void;
  getArtifactVersion: (artifact: Artifact) => {
    versionNumber: number;
    isLatest: boolean;
  };
  restoreArtifact: (artifact: Artifact) => void;
  updateArtifact<T extends ArtifactType, D>(
    artifact: Artifact<D, T>,
    data: D
  ): void;
}

const ChatCanvasContext = createContext<ChatCanvasContextType | undefined>(
  undefined
);

export function ChatCanvasProvider({
  children,
  autoOpenCanvas = true,
}: {
  children: ReactNode;
  autoOpenCanvas?: boolean;
}) {
  const { messages, isLoading, setMessages } = useChatUI();

  const [isCanvasOpen, setIsCanvasOpen] = useState(false); // whether the canvas is open
  const [displayedArtifact, setDisplayedArtifact] = useState<Artifact>(); // the artifact currently displayed in the canvas

  const allArtifacts = useMemo(
    () => extractArtifactsFromAllMessages(messages),
    [messages]
  );

  // get all artifacts from the last message, this may not be the latest artifact in case last message doesn't have any artifact
  const artifactsFromLastMessage = useMemo(() => {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) return [];
    const artifacts = extractArtifactsFromMessage(lastMessage);
    return artifacts;
  }, [messages]);

  useEffect(() => {
    // when stream is loading and last message has a artifact, open the canvas with that artifact
    if (artifactsFromLastMessage.length > 0 && isLoading && autoOpenCanvas) {
      setIsCanvasOpen(true);
      setDisplayedArtifact(
        artifactsFromLastMessage[artifactsFromLastMessage.length - 1]
      );
    }
  }, [artifactsFromLastMessage, isCanvasOpen, isLoading, autoOpenCanvas]);

  const openArtifactInCanvas = (artifact: Artifact) => {
    setDisplayedArtifact(artifact);
    setIsCanvasOpen(true);
  };

  const getArtifactsByType = (type: Artifact["type"]) => {
    return allArtifacts.filter((a) => a.type === type);
  };

  const getArtifactVersion = (artifact: Artifact) => {
    const allArtifactsByCurrentType = getArtifactsByType(artifact.type);
    const versionNumber =
      allArtifactsByCurrentType.findIndex((a) => isEqualArtifact(a, artifact)) +
      1;
    return {
      versionNumber,
      isLatest: versionNumber === allArtifactsByCurrentType.length,
    };
  };

  const restoreArtifact = (artifact: Artifact) => {
    if (!setMessages) return;

    const newArtifact = {
      ...artifact,
      created_at: Date.now(),
    };

    const newMessages: Message[] = [
      ...messages,
      {
        id: `restore-msg-${Date.now()}`,
        role: MessageRole.User,
        parts: [
          {
            type: TextPartType,
            text: `Restore to ${artifact.type} version ${getArtifactVersion(artifact).versionNumber}`,
          },
        ],
      },
      {
        id: `restore-success-${Date.now()}`,
        role: MessageRole.Assistant,
        parts: [
          {
            type: TextPartType,
            text: `Successfully restored to ${artifact.type} version ${getArtifactVersion(artifact).versionNumber}`,
          },
          {
            type: ArtifactPartType,
            data: newArtifact,
          },
        ],
      },
    ];

    setMessages(newMessages);

    openArtifactInCanvas(newArtifact);
  };

  const updateArtifact = <T extends ArtifactType, D>(
    artifact: Artifact<D, T>,
    data: D
  ) => {
    if (!setMessages) return;

    const newArtifact: Artifact<D, T> = {
      created_at: Date.now(),
      type: artifact.type,
      data,
    };

    if (!newArtifact) return;

    const newMessages: Message[] = [
      ...messages,
      {
        id: uuid(),
        role: MessageRole.User,
        parts: [
          {
            type: TextPartType,
            text: `Update content for ${artifact.type} artifact version ${getArtifactVersion(artifact).versionNumber}`,
          },
        ],
      },
      {
        id: uuid(),
        role: MessageRole.Assistant,
        parts: [
          {
            type: TextPartType,
            text: `Updated content for ${artifact.type} artifact version ${getArtifactVersion(artifact).versionNumber}`,
          },
          {
            type: ArtifactPartType,
            data: newArtifact,
          },
        ],
      },
    ];

    setMessages(newMessages);
    openArtifactInCanvas(newArtifact);
  };

  const closeCanvas = () => {
    setIsCanvasOpen(false);
    setDisplayedArtifact(undefined);
  };

  return (
    <ChatCanvasContext.Provider
      value={{
        allArtifacts,
        getArtifactsByType,
        displayedArtifact,
        isCanvasOpen,
        openArtifactInCanvas,
        closeCanvas,
        getArtifactVersion,
        restoreArtifact,
        updateArtifact,
      }}
    >
      {children}
    </ChatCanvasContext.Provider>
  );
}

export function useChatCanvas(): ChatCanvasContextType {
  const context = useContext(ChatCanvasContext);
  if (context === undefined) {
    throw new Error("useChatCanvas must be used within a ChatCanvasProvider");
  }
  return context;
}
