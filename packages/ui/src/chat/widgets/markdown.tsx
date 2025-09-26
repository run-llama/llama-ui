import { ComponentType, FC, memo } from 'react'
import ReactMarkdown, { Components, Options } from 'react-markdown'
import 'katex/dist/katex.min.css'
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

  // Replace block-level LaTeX delimiters \[ \] with $$ $$
  const blockProcessedContent = processedContent.replace(
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

//

type ReactStyleMarkdownComponents = {
  // Extract pulls out the ComponentType side of unions like ComponentType | string
  // react-markdown supports passing "h1" for example, which is difficult to
  [K in keyof Components]?: Extract<Components[K], FC<unknown>>
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
        rehypePlugins={[rehypeKatex as unknown as never]}
        components={{
          ...components,
          h1: combineComponent(components?.h1, ({ children }) => (
            <h1 className="mt-0 mb-3 text-xl font-semibold">{children}</h1>
          )),
          h2: combineComponent(components?.h2, ({ children }) => (
            <h2 className="mt-4 mb-2 text-lg font-semibold">{children}</h2>
          )),
          h3: combineComponent(components?.h3, ({ children }) => (
            <h3 className="mt-3 mb-2 text-base font-semibold">{children}</h3>
          )),
          h4: combineComponent(components?.h4, ({ children }) => (
            <h4 className="mt-3 mb-1 text-base font-medium">{children}</h4>
          )),
          h5: combineComponent(components?.h5, ({ children }) => (
            <h5 className="mt-2 mb-1 text-sm font-medium">{children}</h5>
          )),
          h6: combineComponent(components?.h6, ({ children }) => (
            <h6 className="mt-2 mb-1 text-sm">{children}</h6>
          )),
          p: combineComponent(components?.p, ({ children }) => {
            return <p className="mb-2 last:mb-0 leading-7">{children}</p>
          }),
          ul: ({ children, className, ...rest }) => {
            const isTaskList = className?.includes('contains-task-list')
            return (
              <ul
                {...rest}
                className={cn(
                  'my-2 space-y-1',
                  isTaskList ? 'ml-0 list-none' : 'ml-5 list-disc'
                )}
              >
                {children}
              </ul>
            )
          },
          ol: ({ children, ...rest }) => (
            <ol {...rest} className="my-2 ml-5 list-decimal space-y-1">
              {children}
            </ol>
          ),
          li: ({ children, className, ...rest }) => {
            const isTaskItem = className?.includes('task-list-item')
            return (
              <li
                {...rest}
                className={cn('leading-7', isTaskItem && 'ml-0 list-none')}
              >
                {children}
              </li>
            )
          },
          input: props => (
            <input
              {...props}
              className={cn('mr-2 align-middle', props.className ?? '')}
            />
          ),
          blockquote: combineComponent(components?.blockquote, ({ children }) => (
            <blockquote className="my-3 border-l-2 pl-3 text-sm text-muted-foreground">{children}</blockquote>
          )),
          hr: combineComponent(components?.hr, () => (
            <hr className="my-4 border-border" />
          )),
          table: combineComponent(components?.table, ({ children }) => (
            <div className="my-3 overflow-x-auto">
              <table className="w-full border-collapse text-sm">{children}</table>
            </div>
          )),
          th: combineComponent(components?.th, ({ children }) => (
            <th className="border border-border bg-secondary px-2 py-1 text-left font-medium">{children}</th>
          )),
          td: combineComponent(components?.td, ({ children }) => (
            <td className="border border-border px-2 py-1 align-top">{children}</td>
          )),
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
                  <code
                    className={cn(
                      'rounded bg-secondary px-1 py-0.5 font-mono text-[0.85em]',
                      className
                    )}
                    {...props}
                  >
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
