'use client'

import { Check, Copy, Download, X } from 'lucide-react'
import { useCopyToClipboard } from '../../hooks/use-copy-to-clipboard'
import { cn } from '@/lib/utils'
import { Button } from '@/base/button'
import { useChatCanvas } from './context'
import {
  Artifact,
  DocumentArtifact,
  CodeArtifact,
} from './artifacts'

interface ChatCanvasActionsProps {
  children?: React.ReactNode
  className?: string
}

function ChatCanvasActions(props: ChatCanvasActionsProps) {
  const children = props.children ?? (
    <>
      <ArtifactContentCopy />
      <ArtifactDownloadButton />
      <CanvasCloseButton />
    </>
  )

  return (
    <div className={cn('flex items-center gap-1', props.className)}>
      {children}
    </div>
  )
}

function ArtifactContentCopy() {
  const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 1000 })

  const { displayedArtifact } = useChatCanvas()
  if (!displayedArtifact) return null

  const content = getArtifactContent(displayedArtifact)
  if (!content) return null

  const handleCopy = () => {
    if (isCopied) return
    copyToClipboard(content)
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="cursor-pointer rounded-full"
      onClick={handleCopy}
    >
      {isCopied ? <Check className="size-4" /> : <Copy className="size-4" />}
    </Button>
  )
}

function getArtifactContent(artifact: Artifact) {
  if (artifact.type === 'code') {
    return (artifact as CodeArtifact).data.code
  }

  if (artifact.type === 'document') {
    return (artifact as DocumentArtifact).data.content
  }

  return null
}

function ArtifactDownloadButton() {
  const { displayedArtifact } = useChatCanvas()

  if (!displayedArtifact) return null

  const content = getArtifactContent(displayedArtifact)
  const fileName = getArtifactDownloadFileName(displayedArtifact)

  if (!content || !fileName) return null

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain' })

    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = fileName

    document.body.appendChild(link)
    link.click()

    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="cursor-pointer rounded-full"
      onClick={handleDownload}
    >
      <Download className="size-4" />
    </Button>
  )
}

function getArtifactDownloadFileName(artifact: Artifact) {
  if (artifact.type === 'code') {
    return (artifact as CodeArtifact).data.file_name
  }

  if (artifact.type === 'document') {
    return (artifact as DocumentArtifact).data.title
  }

  return null
}

function CanvasCloseButton() {
  const { closeCanvas } = useChatCanvas()
  return (
    <Button
      variant="ghost"
      size="icon"
      className="cursor-pointer rounded-full"
      onClick={closeCanvas}
    >
      <X className="size-4" />
    </Button>
  )
}

ChatCanvasActions.Copy = ArtifactContentCopy
ChatCanvasActions.Download = ArtifactDownloadButton
ChatCanvasActions.Close = CanvasCloseButton

export { ChatCanvasActions }
