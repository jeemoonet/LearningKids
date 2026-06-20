import { useMemo } from 'react'
import type { VocabTierId, VocabWord } from './types'
import { groupCoverUrl } from './groupCover'
import { getSpeakableWord } from './VocabWordHeadline'
import { VocabThemePassage } from './VocabThemePassage'

interface VocabMemoryCardProps {
  words: VocabWord[]
  tierId: VocabTierId
  groupIndex: number
  passageEn?: string
  passageZh?: string
}

const FALLBACK_GRADIENT = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'

export function VocabMemoryCard({
  words,
  tierId,
  groupIndex,
  passageEn = '',
  passageZh = '',
}: VocabMemoryCardProps) {
  const coverUrl = groupCoverUrl(tierId, groupIndex)
  const groupWords = useMemo(
    () => words.map((item) => getSpeakableWord(item.word)),
    [words],
  )

  return (
    <div className="vocab-memory-card">
      <div
        className="vocab-memory-visual vocab-memory-visual--group"
        style={coverUrl ? undefined : { background: FALLBACK_GRADIENT }}
      >
        {coverUrl ? (
          <img src={coverUrl} alt="" className="vocab-memory-cover" />
        ) : (
          <span className="vocab-memory-icon" aria-hidden="true">
            📚
          </span>
        )}
      </div>

      <VocabThemePassage
        tierId={tierId}
        groupIndex={groupIndex}
        passageEn={passageEn}
        passageZh={passageZh}
        highlightWords={groupWords}
        fallbackWords={groupWords}
        autoPlay
      />
    </div>
  )
}
