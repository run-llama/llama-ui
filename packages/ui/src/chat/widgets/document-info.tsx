import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/base/hover-card'
import { Check, Copy, FileIcon, XCircleIcon } from 'lucide-react'
import { useCopyToClipboard } from '../hooks/use-copy-to-clipboard'
import { Button } from '@/base/button'
import { useChatCanvas } from '../components/canvas/context'
import { SourceNumberButton } from './source-number-button'

import { cn } from '@/lib/utils'
import { DocxIcon } from '@/base/icons/docx'
import { PDFIcon } from '@/base/icons/pdf'
import { SheetIcon } from '@/base/icons/sheet'
import { TxtIcon } from '@/base/icons/txt'
import { JSONValue } from '../components/chat.interface'

export type DocumentFile = {
  id: string
  name: string // The uploaded file name in the backend
  size: number // The file size in bytes
  type: string // File extension
  url: string // The URL of the uploaded file in the backend
  refs?: string[] // DocumentIDs of the uploaded file in the vector index
}

export type SourceNode = {
  id: string
  metadata: Record<string, JSONValue>
  score?: number
  text: string
  url?: string
}

export type Document = {
  url: string
  sources: SourceNode[]
}

export function DocumentInfo({
  document,
  className,
  onRemove,
  startIndex = 0,
}: {
  document: Document
  className?: string
  onRemove?: () => void
  startIndex?: number
}) {
  const { openArtifactInCanvas } = useChatCanvas()
  const { url, sources } = document
  const urlParts = url.split('/')
  const fileName = urlParts.length > 0 ? urlParts[urlParts.length - 1] : url
  const fileExt = fileName?.split('.').pop() ?? ''

  const previewFile = {
    name: fileName,
    type: fileExt,
  }

  const DocumentDetail = (
    <div className={`bg-secondary rounded-lg p-2 ${className}`}>
      <DocumentPreviewCard
        className="cursor-pointer"
        file={previewFile}
        onRemove={onRemove}
      />
      <div className="flex max-w-60 flex-wrap space-x-2 px-2">
        {sources.map((node: SourceNode, index: number) => (
          <div key={node.id}>
            <SourceInfo node={node} index={startIndex + index} />
          </div>
        ))}
      </div>
    </div>
  )

  if (url.endsWith('.pdf')) {
    // Open PDF preview inside Canvas shell
    return (
      <div
        onClick={e => {
          e.preventDefault()
          e.stopPropagation()
          openArtifactInCanvas(
            {
              type: 'document',
              created_at: Date.now(),
              data: {
                url,
              },
            }
          )
        }}
      >
        {DocumentDetail}
      </div>
    )
  }
  // open external link when click document card for other file types
  return <div onClick={() => window.open(url, '_blank')}>{DocumentDetail}</div>
}

function SourceInfo({ node, index }: { node?: SourceNode; index: number }) {
  if (!node) return <SourceNumberButton index={index} />
  return (
    <HoverCard openDelay={100} closeDelay={100}>
      <HoverCardTrigger
        className="cursor-default"
        onClick={e => {
          e.preventDefault()
          e.stopPropagation()
        }}
      >
        <SourceNumberButton
          index={index}
          className="hover:bg-primary hover:text-white"
        />
      </HoverCardTrigger>
      <HoverCardContent className="w-[400px]" onClick={e => e.stopPropagation()}>
        <NodeInfo nodeInfo={node} />
      </HoverCardContent>
    </HoverCard>
  )
}

function NodeInfo({ nodeInfo }: { nodeInfo: SourceNode }) {
  const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 1000 })

  const pageNumber =
    // XXX: page_label is used in Python, but page_number is used by Typescript
    (nodeInfo.metadata?.page_number as number) ??
    (nodeInfo.metadata?.page_label as number) ??
    null

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-semibold">
          {pageNumber ? `On page ${pageNumber}:` : 'Node content:'}
        </span>
        {nodeInfo.text && (
          <Button
            onClick={e => {
              e.stopPropagation()
              copyToClipboard(nodeInfo.text)
            }}
            size="icon"
            variant="ghost"
            className="h-3 w-3 shrink-0"
          >
            {isCopied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {nodeInfo.text && (
        <pre className="max-h-[200px] overflow-auto whitespace-pre-line">
          &ldquo;{nodeInfo.text}&rdquo;
        </pre>
      )}
    </div>
  )
}

const FileIconMap: Record<string, React.ReactNode> = {
  csv: <SheetIcon />,
  pdf: <PDFIcon />,
  docx: <DocxIcon />,
  txt: <TxtIcon />,
}

function DocumentPreviewCard(props: {
  file: {
    name: string
    size?: number
    type: string
  }
  onRemove?: () => void
  className?: string
}) {
  const { onRemove, file, className } = props
  return (
    <div
      className={cn(
        'bg-secondary relative w-60 max-w-60 rounded-lg p-2 text-sm',
        className
      )}
    >
      <div className="flex flex-row items-center gap-2">
        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md">
          {FileIconMap[file.type] ?? <FileIcon />}
        </div>
        <div className="overflow-hidden">
          <div className="truncate font-semibold">
            {file.name} {file.size ? `(${inKB(file.size)} KB)` : ''}
          </div>
          {file.type && (
            <div className="text-token-text-tertiary flex items-center gap-2 truncate">
              <span>{file.type.toUpperCase()} File</span>
            </div>
          )}
        </div>
      </div>
      {onRemove && (
        <div
          className={cn(
            'absolute -right-2 -top-2 z-10 h-6 w-6 rounded-full bg-gray-500 text-white'
          )}
        >
          <XCircleIcon
            className="h-6 w-6 rounded-full bg-gray-500 text-white"
            onClick={e => {
              e.stopPropagation()
              onRemove()
            }}
          />
        </div>
      )}
    </div>
  )
}

function inKB(size: number) {
  return Math.round((size / 1024) * 10) / 10
}
