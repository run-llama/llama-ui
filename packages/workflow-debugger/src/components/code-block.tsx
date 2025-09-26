import { CSSProperties } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  oneDark,
  oneLight,
} from "react-syntax-highlighter/dist/esm/styles/prism";

export interface CodeBlockProps {
  language: string;
  value: string;
  wrapLongLines?: boolean;
  className?: string;
}

export function CodeBlock({
  language,
  value,
  wrapLongLines = false,
  className,
}: CodeBlockProps) {
  const isDark =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");

  const customStyle: CSSProperties = {
    margin: 0,
    fontSize: "12px",
    padding: "12px",
    borderRadius: "6px",
    width: "100%",
    boxSizing: "border-box",
    maxHeight: "none",
    overflow: "visible",
  };

  return (
    <div className={className}>
      <SyntaxHighlighter
        language={language}
        style={isDark ? oneDark : oneLight}
        customStyle={customStyle}
        wrapLongLines={wrapLongLines}
        showLineNumbers={false}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
}
