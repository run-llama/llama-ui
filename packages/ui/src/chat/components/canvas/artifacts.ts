import { Message } from '../chat.interface'
import { ArtifactPartType } from '../message-parts/types'
import { getParts } from '../message-parts/utils'

// check if two artifacts are equal by comparing their type and created time
export function isEqualArtifact(a: Artifact, b: Artifact) {
  return a.type === b.type && a.created_at === b.created_at
}

// extract artifacts from all messages (sort ascending by created_at)
export function extractArtifactsFromAllMessages(messages: Message[]) {
  return messages
    .flatMap(extractArtifactsFromMessage)
    .sort((a, b) => a.created_at - b.created_at)
}

export function extractArtifactsFromMessage(message: Message): Artifact[] {
  return getParts(message, ArtifactPartType).map(part => part.data)
}

export type CodeArtifactError = {
  artifact: CodeArtifact
  errors: string[]
}

/**
 * Generic artifact type definition
 * @typeParam T - The type of the data payload (e.g., \{ imageUrl: string, caption: string \})
 * @typeParam K - The artifact type identifier string (e.g., 'image', 'code', 'document')
 */
export type Artifact<T = unknown, K = string> = {
  created_at: number
  type: K
  data: T
}
export type CodeArtifact = Artifact<
  {
    file_name: string
    code: string
    language: string
  },
  'code'
>

export type DocumentArtifact = Artifact<
  {
    title: string
    content: string
    type: string
    sources?: { id: string }[] // we can add more source info here if needed
  },
  'document'
>
