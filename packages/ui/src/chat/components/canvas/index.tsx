"use client";

import { cn } from "@/lib/utils";
import { ChatCanvasActions } from "./actions";
import { useChatCanvas } from "./context";
import { DocumentArtifactViewer } from "./artifacts/document";
import { ArtifactCard } from "./artifact-card";

interface ChatCanvasProps {
  children?: React.ReactNode;
  className?: string;
}

function ChatCanvas({ children, className }: ChatCanvasProps) {
  const { isCanvasOpen, displayedArtifact } = useChatCanvas();

  if (!isCanvasOpen || !displayedArtifact) return null;

  return (
    <div
      className={cn(
        "right-0 top-0 flex h-full shrink-0 flex-col border-l bg-white",
        className
      )}
      style={{
        animation: isCanvasOpen
          ? "slideIn 0.3s ease-out forwards"
          : "slideOut 0.3s ease-out forwards",
      }}
    >
      {children ?? (
        <>
          <DocumentArtifactViewer />
        </>
      )}
    </div>
  );
}

ChatCanvas.DocumentArtifact = DocumentArtifactViewer;
ChatCanvas.Artifact = ArtifactCard;
ChatCanvas.Actions = ChatCanvasActions;

export default ChatCanvas;
