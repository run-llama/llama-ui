import { ChatContext, MessageRole } from "../components/chat.interface";
import { TextPartType } from "../components/message-parts/types";
import { cn } from "@/lib/utils";
import { v4 as uuidv4 } from "uuid";

export type SuggestedQuestionsData = string[];

export function SuggestedQuestions({
  questions,
  sendMessage,
  className,
}: {
  questions: SuggestedQuestionsData;
  sendMessage: ChatContext["sendMessage"];
  className?: string;
}) {
  const showQuestions = questions.length > 0;
  return (
    showQuestions && (
      <div className={cn("flex flex-col space-y-2", className)}>
        {questions.map((question, index) => (
          <a
            key={index}
            onClick={() => {
              sendMessage({
                id: uuidv4(),
                role: MessageRole.User,
                parts: [{ type: TextPartType, text: question }],
              });
            }}
            className="cursor-pointer text-sm italic hover:underline"
          >
            {"->"} {question}
          </a>
        ))}
      </div>
    )
  );
}
