import { SuggestedQuestions } from '../../../widgets/index'
import { useChatMessage } from '../../chat-message.context'
import { useChatUI } from '../../chat.context'
import { usePart } from '../context'
import { SuggestionPartType } from '../types'

/**
 * Render a suggested questions part inside a ChatMessage, return null if current part is not suggested questions type
 * This component is useful to show a list of suggested questions from the assistant.
 * @param className - custom styles for the suggested questions
 */
export function SuggestionPartUI({ className }: { className?: string }) {
  const { sendMessage, requestData } = useChatUI()
  const { isLast } = useChatMessage()
  const suggestedQuestions = usePart(SuggestionPartType)?.data

  if (!isLast || !sendMessage || !suggestedQuestions) return null

  return (
    <SuggestedQuestions
      questions={suggestedQuestions}
      sendMessage={sendMessage}
      requestData={requestData}
      className={className}
    />
  )
}
