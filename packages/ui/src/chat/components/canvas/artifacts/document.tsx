'use client'

import { FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PdfPreview } from '../../../../file-preview/pdf-preview'
import { DocumentArtifact } from '../artifacts'
import { ChatCanvasActions } from '../actions'
import { useChatCanvas } from '../context'

interface DocumentArtifactViewerProps {
  className?: string
  children?: React.ReactNode
}

export function DocumentArtifactViewer({
  className,
  children,
}: DocumentArtifactViewerProps) {
  const { displayedArtifact } = useChatCanvas()

  if (displayedArtifact?.type !== 'document') return null

  const documentArtifact = displayedArtifact as DocumentArtifact
  const {
    data: { url, highlight },
  } = documentArtifact

  return (
    <div className={cn('flex min-h-0 flex-1 flex-col', className)}>
      <div className="flex items-center justify-between border-b px-4 py-2">
        <h3 className="flex items-center gap-4 text-gray-600">
          <FileText className="text-primary size-5" />
        </h3>
        <ChatCanvasActions />
      </div>
      <div className="relative mx-6 flex min-h-0 flex-1 flex-col items-stretch py-2">
        {children ?? (
          <div className="h-full w-full overflow-hidden">
            <PdfPreview url={url} highlight={highlight} />
          </div>
        )}
      </div>
    </div>
  )
}
