import { Fragment, type ReactNode } from 'react'

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** 从释义中提取可在中文例句里匹配的词形 */
function extractMeaningCandidates(meaning: string): string[] {
  const candidates = new Set<string>()
  const segments = meaning
    .split(/[；;/,、]/)
    .map((segment) => segment.trim())
    .filter(Boolean)

  for (const segment of segments) {
    const cleaned = segment.replace(/[（(][^）)]*[）)]/g, '').trim()
    if (!cleaned) continue

    candidates.add(cleaned)

    if (/[的地得]$/.test(cleaned) && cleaned.length > 1) {
      candidates.add(cleaned.slice(0, -1))
    }

    const prefixMatch = /^(使|被|让|感到)(.+)$/.exec(cleaned)
    if (prefixMatch && prefixMatch[2].length >= 2) {
      candidates.add(prefixMatch[2])
    }
  }

  return [...candidates].filter((candidate) => candidate.length >= 2)
}

function findBestMatch(exampleZh: string, candidates: string[]): string | null {
  const sorted = [...candidates].sort((a, b) => b.length - a.length)
  for (const candidate of sorted) {
    if (exampleZh.includes(candidate)) return candidate
  }
  return null
}

/** 在中文例句里标出与释义对应的中文（加下划线） */
export function highlightMeaningInZh(
  exampleZh: string,
  meaning: string,
  highlightClass = 'lw-wordlist-card__example-highlight',
): ReactNode {
  const text = exampleZh.trim()
  if (!text) return text

  const match = findBestMatch(text, extractMeaningCandidates(meaning.trim()))
  if (!match) return text

  const pattern = new RegExp(`(${escapeRegex(match)})`, 'g')
  const parts = text.split(pattern)

  return parts
    .filter((part) => part.length > 0)
    .map((part, index) =>
      part === match ? (
        <span key={`${index}-${part}`} className={highlightClass}>
          {part}
        </span>
      ) : (
        <Fragment key={`${index}-${part}`}>{part}</Fragment>
      ),
    )
}
