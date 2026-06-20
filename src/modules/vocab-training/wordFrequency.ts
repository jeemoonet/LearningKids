export type VocabFreqLevel = 'high' | 'medium' | 'low'

export interface ParsedWordFrequency {
  baseWord: string
  freqLevel: VocabFreqLevel
  freqLabel: string
  examYearCount: number
  examTotalCount: number
}

const WORD_FREQ_RE = /^([a-zA-Z]+(?:'[a-zA-Z]+)?)\s+\[(高|中|低)频\]\s+\((\d+)届\/(\d+)次\)$/

const FREQ_LEVEL_MAP: Record<'高' | '中' | '低', VocabFreqLevel> = {
  高: 'high',
  中: 'medium',
  低: 'low',
}

export function parseWordFrequency(rawWord: string): ParsedWordFrequency | null {
  const match = WORD_FREQ_RE.exec(rawWord.trim())
  if (!match) return null

  const [, baseWord, zhLevel, yearCount, totalCount] = match
  const levelKey = zhLevel as '高' | '中' | '低'

  return {
    baseWord,
    freqLevel: FREQ_LEVEL_MAP[levelKey],
    freqLabel: `${levelKey}频`,
    examYearCount: Number(yearCount),
    examTotalCount: Number(totalCount),
  }
}

export function frequencyFromWord(
  word: Pick<VocabWordLike, 'word' | 'freqLevel' | 'freqLabel' | 'examYearCount' | 'examTotalCount'>,
): ParsedWordFrequency | null {
  if (!word.freqLevel || !word.freqLabel) {
    return parseWordFrequency(word.word)
  }
  return {
    baseWord: word.word,
    freqLevel: word.freqLevel,
    freqLabel: word.freqLabel,
    examYearCount: word.examYearCount ?? 0,
    examTotalCount: word.examTotalCount ?? 0,
  }
}

interface VocabWordLike {
  word: string
  freqLevel?: VocabFreqLevel
  freqLabel?: string
  examYearCount?: number
  examTotalCount?: number
}

export function getWordDisplay(
  rawWord: string,
  source?: VocabWordLike,
): { baseWord: string; frequency: ParsedWordFrequency | null } {
  if (source) {
    const frequency = frequencyFromWord(source)
    return { baseWord: source.word, frequency }
  }
  const parsed = parseWordFrequency(rawWord)
  if (parsed) {
    return { baseWord: parsed.baseWord, frequency: parsed }
  }
  return { baseWord: rawWord, frequency: null }
}
