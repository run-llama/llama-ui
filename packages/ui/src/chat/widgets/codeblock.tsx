import hljs from 'highlight.js'
import 'highlight.js/styles/github.min.css'
import { Check, Copy, Download } from 'lucide-react'
import { FC, memo, useEffect, useRef } from 'react'
import { Button } from '@/base/button'
import { useCopyToClipboard } from '../hooks/use-copy-to-clipboard'
import { cn } from '@/lib/utils'

interface Props {
  language: string
  value: string
  className?: string
  showHeader?: boolean
  headerClassName?: string
  codeClassName?: string
}

interface languageMap {
  [key: string]: string | undefined
}

export const programmingLanguages: languageMap = {
  javascript: '.js',
  python: '.py',
  java: '.java',
  c: '.c',
  cpp: '.cpp',
  'c++': '.cpp',
  'c#': '.cs',
  ruby: '.rb',
  php: '.php',
  swift: '.swift',
  'objective-c': '.m',
  kotlin: '.kt',
  typescript: '.ts',
  go: '.go',
  perl: '.pl',
  rust: '.rs',
  scala: '.scala',
  haskell: '.hs',
  lua: '.lua',
  shell: '.sh',
  sql: '.sql',
  html: '.html',
  css: '.css',
  // add more file extensions here, make sure the key is same as language prop in CodeBlock.tsx component
}

export const generateRandomString = (length: number, lowercase = false) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXY3456789' // excluding similar looking characters like Z, 2, I, 1, O, 0
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return lowercase ? result.toLowerCase() : result
}

const LANGUAGE_ALIASES: Record<string, string> = {
  ts: 'typescript',
  tsx: 'typescript',
  js: 'javascript',
  jsx: 'javascript',
  py: 'python',
  sh: 'shell',
  bash: 'shell',
  md: 'markdown',
  yml: 'yaml',
}

const CodeBlock: FC<Props> = memo(props => {
  const {
    language,
    value,
    className,
    headerClassName,
    codeClassName,
    showHeader = true,
  } = props
  const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 2000 })
  const codeRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (codeRef.current && codeRef.current.dataset.highlighted !== 'yes') {
      hljs.highlightElement(codeRef.current)
    }
  }, [language, value])

  const downloadAsFile = () => {
    if (typeof window === 'undefined') {
      return
    }
    const fileExtension = programmingLanguages[language] || '.file'
    const suggestedFileName = `file-${generateRandomString(
      3,
      true
    )}${fileExtension}`
    const fileName = window.prompt('Enter file name', suggestedFileName)

    if (!fileName) {
      // User pressed cancel on prompt.
      return
    }

    const blob = new Blob([value], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = fileName
    link.href = url
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const onCopy = () => {
    if (isCopied) return
    copyToClipboard(value)
  }

  return (
    <div
      className={cn(
        'codeblock border-border relative w-full rounded-lg border bg-secondary pt-2',
        className
      )}
    >
      {showHeader && (
        <div
          className={cn(
            'flex w-full items-center justify-between px-3',
            headerClassName
          )}
        >
          <span className="text-xs lowercase">{language}</span>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              onClick={downloadAsFile}
              size="icon"
              className="size-8"
            >
              <Download className="size-4" />
              <span className="sr-only">Download</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onCopy}
              className="size-8"
            >
              {isCopied ? (
                <Check className="size-4" />
              ) : (
                <Copy className="size-4" />
              )}
              <span className="sr-only">Copy code</span>
            </Button>
          </div>
        </div>
      )}
      <pre className="m-0 max-w-full overflow-x-auto rounded-b-lg text-[13px] leading-6">
        <code
          ref={codeRef}
          className={cn(
            `language-${LANGUAGE_ALIASES[language] ?? language} font-mono`,
            codeClassName
          )}
        >
          {value}
        </code>
      </pre>
    </div>
  )
})
CodeBlock.displayName = 'CodeBlock'

export { CodeBlock }
