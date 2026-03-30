import React from 'react'
import ReactMarkdown from 'react-markdown'
import { remarkPlugins, rehypePlugins } from '../../lib/markdown-plugins'

interface MarkdownPreviewProps {
  content: string
  className?: string
}

function normalizeBareLatex(content: string): string {
  const lines = content.split('\n')
  const normalized: string[] = []
  let inCodeFence = false

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]
    const trimmed = line.trim()

    if (trimmed.startsWith('```')) {
      inCodeFence = !inCodeFence
      normalized.push(line)
      continue
    }

    if (inCodeFence || !trimmed) {
      normalized.push(line)
      continue
    }

    // Wrap LaTeX environments (\begin{...} ... \end{...}) as one math block.
    if (!trimmed.includes('$') && trimmed.includes('\\begin{')) {
      const blockLines = [line]
      let foundEnd = trimmed.includes('\\end{')
      while (!foundEnd && i + 1 < lines.length) {
        i += 1
        const nextLine = lines[i]
        blockLines.push(nextLine)
        if (nextLine.includes('\\end{')) {
          foundEnd = true
        }
      }
      normalized.push('$$')
      normalized.push(...blockLines)
      normalized.push('$$')
      continue
    }

    // Entire bare latex line (e.g. "\sqrt{}") should render as display math.
    if (!trimmed.includes('$') && /^\\[a-zA-Z]+/.test(trimmed)) {
      normalized.push('$$')
      normalized.push(trimmed)
      normalized.push('$$')
      continue
    }

    // Inline bare commands: wrap command tokens as inline math.
    if (!trimmed.includes('$') && /\\[a-zA-Z]+/.test(trimmed)) {
      normalized.push(
        line.replace(
          /(\\[a-zA-Z]+(?:\[[^\]]*])?(?:\{[^{}]*\})*)/g,
          (_match, expr: string) => `$${expr}$`
        )
      )
      continue
    }

    normalized.push(line)
  }

  return normalized.join('\n')
}

export function MarkdownPreview({ content, className }: MarkdownPreviewProps) {
  const normalizedContent = normalizeBareLatex(content)

  return (
    <div className={`prose selectable overflow-y-auto p-4 ${className || ''}`}>
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
      >
        {normalizedContent}
      </ReactMarkdown>
    </div>
  )
}
