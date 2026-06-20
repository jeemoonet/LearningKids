import { getWordDisplay, type ParsedWordFrequency } from './wordFrequency'
import { HighFrequencyBadge } from './WordFrequencyTag'

interface VocabWordHeadlineProps {
  rawWord: string
  frequencySource?: {
    word: string
    freqLevel?: ParsedWordFrequency['freqLevel']
    freqLabel?: string
    examYearCount?: number
    examTotalCount?: number
  }
  className?: string
  as?: 'h2' | 'span'
}

/** 展示单词原形；高频词仅显示红色关注图标，不展示频率文字 */
export function VocabWordHeadline({
  rawWord,
  frequencySource,
  className = '',
  as: Tag = 'h2',
}: VocabWordHeadlineProps) {
  const { baseWord, frequency } = getWordDisplay(rawWord, frequencySource)
  const isHighFreq = frequency?.freqLevel === 'high'

  return (
    <Tag className={`vocab-word-headline${className ? ` ${className}` : ''}`}>
      <span className="vocab-word-headline-text">{baseWord}</span>
      {isHighFreq && <HighFrequencyBadge />}
    </Tag>
  )
}

/** 用于 TTS 与词形变换的干净单词 */
export function getSpeakableWord(
  rawWord: string,
  frequencySource?: VocabWordHeadlineProps['frequencySource'],
): string {
  return getWordDisplay(rawWord, frequencySource).baseWord
}
