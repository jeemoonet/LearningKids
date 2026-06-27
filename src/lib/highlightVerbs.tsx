import { Fragment, type ReactNode } from 'react'

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** 将文本按给定词形拆分为普通片段与高亮片段（如动词） */
export function highlightTokens(text: string, tokens: string[]): ReactNode[] {
  if (!text) return []
  const unique = [...new Set(tokens.map((t) => t.trim()).filter(Boolean))]
  if (unique.length === 0) return [text]

  const sorted = unique.sort((a, b) => b.length - a.length)
  const pattern = new RegExp(`(${sorted.map(escapeRegex).join('|')})`, 'gi')
  const parts = text.split(pattern)

  return parts
    .filter((part) => part.length > 0)
    .map((part, index) => {
      const isMatch = sorted.some((token) => token.toLowerCase() === part.toLowerCase())
      if (isMatch) {
        return (
          <span key={`${index}-${part}`} className="sentence-verb">
            {part}
          </span>
        )
      }
      return <Fragment key={`${index}-${part}`}>{part}</Fragment>
    })
}

interface HighlightVerbsProps {
  text: string
  verbs: string[]
}

export function HighlightVerbs({ text, verbs }: HighlightVerbsProps) {
  return <>{highlightTokens(text, verbs)}</>
}
