import { ChatContext, MessageRole } from "../components/chat.interface";
import { TextPartType } from "../components/message-parts/types";
import { cn } from "@/lib/utils";
import { Button } from "@/base/button";
import { v4 as uuidv4 } from "uuid";

interface StarterQuestionsProps {
  questions: string[];
  sendMessage: ChatContext["sendMessage"];
  className?: string;
}

export function StarterQuestions(props: StarterQuestionsProps) {
  return (
    <div className={cn("w-full", props.className)}>
      <div className="grid grid-cols-2 gap-3">
        {props.questions.map((question, i) => (
          <Button
            key={i}
            variant="outline"
            onClick={() =>
              props.sendMessage({
                id: uuidv4(),
                role: MessageRole.User,
                parts: [{ type: TextPartType, text: question }],
              })
            }
            className="h-auto whitespace-break-spaces"
          >
            {question}
          </Button>
        ))}
      </div>
    </div>
  );
}
