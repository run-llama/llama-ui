import { Bot, Check, Copy, RefreshCw } from 'lucide-react'
import { memo } from 'react'
import { useCopyToClipboard } from '../hooks/use-copy-to-clipboard'
import { cn } from '@/lib/utils'
import { Button } from '@/base/button'
import { ChatMessageProvider, useChatMessage } from './chat-message.context'
import { useChatMessages } from './chat-messages'
import { useChatUI } from './chat.context'
import { Message } from './chat.interface'
import {
  EventPartUI,
  FilePartUI,
  MarkdownPartUI,
  SourcesPartUI,
  SuggestionPartUI,
  TextPart,
  TextPartType,
} from './message-parts'
import { ChatPartProvider } from './message-parts/context'

interface ChatMessageProps extends React.PropsWithChildren {
  message: Message
  isLast: boolean
  className?: string
}

interface ChatMessageAvatarProps extends React.PropsWithChildren {
  className?: string
}

interface ChatMessageContentProps extends React.PropsWithChildren {
  className?: string
}

interface ChatMessageActionsProps extends React.PropsWithChildren {
  className?: string
}

function ChatMessage(props: ChatMessageProps) {
  const { chatMessagesRef } = useChatMessages()
  const children = props.children ?? (
    <>
      <ChatMessageAvatar />
      <ChatMessageContent />
      <ChatMessageActions />
    </>
  )

  // Apply min-height to the last assistant message using global config
  const currentHeight = chatMessagesRef?.current?.clientHeight
  const minHeight = currentHeight ? Math.max(200, Math.floor(currentHeight * 0.8)) : 300
  const applyMinHeight = props.isLast && props.message.role === 'assistant'
  const wrapperStyle = applyMinHeight ? { minHeight: `${minHeight}px` } : undefined

  return (
    <ChatMessageProvider
      value={{
        message: props.message,
        isLast: props.isLast,
      }}
    >
      <div className={cn('group flex gap-4 p-3', props.className)} style={wrapperStyle}>
        {children}
      </div>
    </ChatMessageProvider>
  )
}

function ChatMessageAvatar(props: ChatMessageAvatarProps) {
  const { message } = useChatMessage()

  if (message.role !== 'assistant') return null

  const children = props.children ?? <Bot className="h-4 w-4" />

  return (
    <div
      className={cn(
        'bg-background flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full border',
        props.className
      )}
    >
      {children}
    </div>
  )
}

function ChatMessageContent(props: ChatMessageContentProps) {
  const { message } = useChatMessage()
  const children = props.children ?? (
    <>
      <FilePartUI />
      <EventPartUI />
      <MarkdownPartUI />
      <SourcesPartUI />
      <SuggestionPartUI />
    </>
  )

  return (
    <div className={cn('flex min-w-0 flex-1 flex-col gap-4', props.className)}>
      {message.parts.map((part, index) => (
        <ChatPartProvider key={index} value={{ part }}>
          {children}
        </ChatPartProvider>
      ))}
    </div>
  )
}

function ChatMessageActions(props: ChatMessageActionsProps) {
  const { regenerate, requestData, isLoading } = useChatUI()
  const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 2000 })
  const { message, isLast } = useChatMessage()

  if (message.role !== 'assistant') return null

  const isLastMessageFromAssistant = message.role === 'assistant' && isLast
  const showReload = regenerate && !isLoading && isLastMessageFromAssistant

  // content to copy is all text parts joined by newlines
  const messageTextContent = message.parts
    .filter((part): part is TextPart => part.type === TextPartType)
    .map(part => part.text)
    .join('\n\n')

  const children = props.children ?? (
    <>
      <Button
        title="Copy"
        onClick={() => copyToClipboard(messageTextContent)}
        size="icon"
        variant="outline"
        className="h-8 w-8"
      >
        {isCopied ? (
          <Check className="h-4 w-4" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
      {showReload && (
        <Button
          title="Regenerate"
          variant="outline"
          size="icon"
          onClick={() => regenerate?.({ body: requestData })}
          className="h-8 w-8"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      )}
    </>
  )
  return (
    <div className={cn('flex shrink-0 flex-col gap-2', props.className)}>
      {children}
    </div>
  )
}

type ComposibleChatMessagePart = typeof ChatMessageContent & {
  File: typeof FilePartUI
  Event: typeof EventPartUI
  Markdown: typeof MarkdownPartUI
  Source: typeof SourcesPartUI
  Suggestion: typeof SuggestionPartUI
}

type ComposibleChatMessage = typeof ChatMessage & {
  Avatar: typeof ChatMessageAvatar
  Content: ComposibleChatMessagePart
  Part: ComposibleChatMessagePart
  Actions: typeof ChatMessageActions
}

const PrimiviteChatMessage = memo(ChatMessage, (prevProps, nextProps) => {
  return (
    !nextProps.isLast &&
    prevProps.isLast === nextProps.isLast &&
    prevProps.message === nextProps.message
  )
}) as unknown as ComposibleChatMessage

PrimiviteChatMessage.Content = ChatMessageContent as ComposibleChatMessagePart

// create alias Part with available built-in parts
PrimiviteChatMessage.Part = ChatMessageContent as ComposibleChatMessagePart
PrimiviteChatMessage.Part.Event = EventPartUI
PrimiviteChatMessage.Part.File = FilePartUI
PrimiviteChatMessage.Part.Markdown = MarkdownPartUI
PrimiviteChatMessage.Part.Source = SourcesPartUI
PrimiviteChatMessage.Part.Suggestion = SuggestionPartUI

PrimiviteChatMessage.Avatar = ChatMessageAvatar
PrimiviteChatMessage.Actions = ChatMessageActions

export default PrimiviteChatMessage
