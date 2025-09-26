import { ComponentType, FC, memo } from 'react'
import ReactMarkdown, { Components, Options } from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { cn } from '@/lib/utils'
import { SourceData } from './chat-sources'
import { Citation, CitationComponentProps } from './citation'
import { CodeBlock } from './codeblock'
import { DocumentInfo } from './document-info'

const MemoizedReactMarkdown: FC<Options> = memo(
  ReactMarkdown,
  (prevProps, nextProps) =>
    prevProps.children === nextProps.children &&
    prevProps.className === nextProps.className
)

// Inspired by https://github.com/remarkjs/react-markdown/issues/785#issuecomment-2307567823
const preprocessLaTeX = (content: string) => {
  // First, we need to protect code blocks and inline code from LaTeX processing
  const codeBlockPlaceholders: string[] = []
  const inlineCodePlaceholders: string[] = []

  // Temporarily replace code blocks with placeholders
  let processedContent = content.replace(/```[\s\S]*?```/g, match => {
    const placeholder = `__CODE_BLOCK_${codeBlockPlaceholders.length}__`
    codeBlockPlaceholders.push(match)
    return placeholder
  })

  // Temporarily replace inline code with placeholders
  processedContent = processedContent.replace(/`[^`\n]+`/g, match => {
    const placeholder = `__INLINE_CODE_${inlineCodePlaceholders.length}__`
    inlineCodePlaceholders.push(match)
    return placeholder
  })

  // Escape dollar signs to prevent them from being treated as LaTeX math delimiters
  // For example, in "$10 million and $20 million", the content between the dollar signs might be incorrectly parsed as a math block
  // Replacing $ with \$ avoids this issue
  const escapedDollarSigns = processedContent.replace(/\$/g, '\\$')

  // Replace block-level LaTeX delimiters \[ \] with $$ $$
  const blockProcessedContent = escapedDollarSigns.replace(
    /\\\[([\s\S]*?)\\\]/g,
    (_, equation) => `$$${equation}$$`
  )

  // Replace inline LaTeX delimiters \( \) with $ $
  let inlineProcessedContent = blockProcessedContent.replace(
    /\\\(([\s\S]*?)\\\)/g,
    (_, equation) => `$${equation}$`
  )

  // Restore code blocks
  codeBlockPlaceholders.forEach((codeBlock, index) => {
    inlineProcessedContent = inlineProcessedContent.replace(
      `__CODE_BLOCK_${index}__`,
      codeBlock
    )
  })

  // Restore inline code
  inlineCodePlaceholders.forEach((inlineCode, index) => {
    inlineProcessedContent = inlineProcessedContent.replace(
      `__INLINE_CODE_${index}__`,
      inlineCode
    )
  })

  return inlineProcessedContent
}

const preprocessMedia = (content: string) => {
  // Remove `sandbox:` from the beginning of the URL
  // to fix OpenAI's models issue appending `sandbox:` to the relative URL
  return content.replace(/(sandbox|attachment|snt):/g, '')
}

/**
 * Convert citation flags [citation:id] to markdown links [citation:id]()
 */
const preprocessCitations = (input: string) => {
  let content = input

  // Match citation format [citation:node_id]
  // Handle complete citations
  const idToIndexRegex = /\[citation:([^\]]+)\]/g
  content = content.replace(idToIndexRegex, (match, citationId) => {
    const trimmedId = citationId.trim()
    // Use a special format that doesn't get styled as a link by markdown-it
    return `[citation:${trimmedId}](javascript:void(0))`
  })

  // For incomplete citations - any [citation: pattern that isn't closed with ]
  // Look for open bracket, citation text, then end of string or any char except closing bracket
  const incompleteRegex = /\[citation:[^\]]*$/g
  content = content.replace(incompleteRegex, '')

  return content
}

const preprocessContent = (content: string) => {
  return preprocessCitations(preprocessLaTeX(preprocessMedia(content)))
}

export interface LanguageRendererProps {
  code: string
  className?: string
}

type ReactStyleMarkdownComponents = {
  // Extract pulls out the ComponentType side of unions like ComponentType | string
  // react-markdown supports passing "h1" for example, which is difficult to
  [K in keyof Components]?: Extract<Components[K], FC<any>>
}

// Simple function to render a component if provided, otherwise use fallback
function combineComponent<Props>(
  component: FC<Props> | undefined,
  fallback: FC<Props>
): FC<Props> {
  return props => component?.(props) || fallback(props)
}

export interface MarkdownProps {
  content: string
  sources?: SourceData
  backend?: string
  components?: ReactStyleMarkdownComponents
  citationComponent?: ComponentType<CitationComponentProps>
  className?: string
  languageRenderers?: Record<string, ComponentType<LanguageRendererProps>>
}
export function Markdown({
  content,
  sources,
  backend,
  citationComponent: CitationComponent,
  className: customClassName,
  components,
  languageRenderers,
}: MarkdownProps) {
  const processedContent = preprocessContent(content)

  return (
    <div>
      <MemoizedReactMarkdown
        className={cn(
          'prose dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 custom-markdown break-words',
          customClassName
        )}
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex as any]}
        components={{
          ...components,
          p: combineComponent(components?.p, ({ children }) => {
            return <div className="mb-2 last:mb-0">{children}</div>
          }),
          code: combineComponent(
            components?.code,
            ({ inline, className, children, ...props }) => {
              if (children.length) {
                if (children[0] === '▍') {
                  return (
                    <span className="mt-1 animate-pulse cursor-default">▍</span>
                  )
                }

                children[0] = (children[0] as string).replace('`▍`', '▍')
              }

              const match = /language-(\w+)/.exec(className || '')
              const language = (match && match[1]) || ''
              const codeValue = String(children).replace(/\n$/, '')

              if (inline) {
                return (
                  <code className={className} {...props}>
                    {children}
                  </code>
                )
              }

              // Check for custom language renderer
              if (languageRenderers?.[language]) {
                const CustomRenderer = languageRenderers[language]
                return <CustomRenderer code={codeValue} className="mb-2" />
              }

              return (
                <CodeBlock
                  key={Math.random()}
                  language={language}
                  value={codeValue}
                  className="mb-2"
                  {...props}
                />
              )
            }
          ),
          a: combineComponent(components?.a, ({ href, children }) => {
            // If href starts with `{backend}/api/files`, then it's a local document and we use DocumentInfo for rendering
            if (href?.startsWith(`${backend}/api/files`)) {
              // Check if the file is document file type
              const fileExtension = href.split('.').pop()?.toLowerCase()

              if (fileExtension) {
                return (
                  <DocumentInfo
                    document={{
                      url: backend
                        ? new URL(decodeURIComponent(href)).href
                        : href,
                      sources: [],
                    }}
                    className="mb-2 mt-2"
                  />
                )
              }
            }

            // Handle citation links
            if (
              Array.isArray(children) &&
              typeof children[0] === 'string' &&
              (children[0].startsWith('citation:') ||
                href?.startsWith('citation:'))
            ) {
              // Extract the nodeId from the citation link
              const nodeId = children[0].includes('citation:')
                ? children[0].split('citation:')[1].trim()
                : href?.replace('citation:', '').trim() || ''

              const nodeIndex = sources?.nodes.findIndex(
                node => node.id === nodeId
              )
              const sourceNode = sources?.nodes.find(node => node.id === nodeId)

              if (nodeIndex !== undefined && nodeIndex > -1 && sourceNode) {
                return CitationComponent ? (
                  <CitationComponent index={nodeIndex} node={sourceNode} />
                ) : (
                  <Citation index={nodeIndex} node={sourceNode} />
                )
              }
              return null
            }
            return (
              <a href={href} target="_blank" rel="noopener">
                {children}
              </a>
            )
          }),
        }}
      >
        {processedContent}
      </MemoizedReactMarkdown>
    </div>
  )
}
