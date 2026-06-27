export type VocabPos = 'noun' | 'verb' | 'adj' | 'adv' | 'pronoun' | 'other'

export const VOCAB_POS_LABEL: Record<VocabPos, string> = {
  noun: '名词',
  verb: '动词',
  adj: '形容词',
  adv: '副词',
  pronoun: '代词',
  other: '其他',
}

export const VOCAB_POS_OPTIONS: Array<{ value: VocabPos; label: string }> = (
  Object.entries(VOCAB_POS_LABEL) as Array<[VocabPos, string]>
).map(([value, label]) => ({ value, label }))

export type VocabTierId = 'beginner' | 'intermediate' | 'advanced'

export interface VocabTier {
  id: VocabTierId
  label: string
  wordCount: number
  groupCount: number
  groupSize: number
}

export interface VocabGroup {
  id: number
  tierId: VocabTierId
  groupIndex: number
  theme: string
  title: string
  passageEn?: string
  passageZh?: string
  wordCount: number
}

export type VocabFreqLevel = 'high' | 'medium' | 'low'

export interface VocabWord {
  id: number
  word: string
  phonetic: string
  pos: VocabPos
  posLabel: string
  meaningZh: string
  similar1: string
  similar2: string
  similar3: string
  exampleEn: string
  exampleZh: string
  tierId: VocabTierId
  sortOrder: number
  freqLevel: VocabFreqLevel
  freqLabel: string
  examYearCount: number
  examTotalCount: number
}

export interface VocabProgress {
  word: string
  familiarity: number
  examCount: number
  examErrorCount: number
  lastExamAt: number | null
  consecutiveCorrect: number
  selfMarked: number
  lastSeen: number
  nextDue: number
}

/** 用户单词表行（user_word_progress） */
export interface UserWordProgress {
  userId: string
  word: string
  familiarity: number
  examCount: number
  examErrorCount: number
  lastExamAt: number | null
  consecutiveCorrect: number
  selfMarked: number
  lastSeen: number
  nextDue: number
  updatedAt: number
}

export type VocabTab = 'memory' | 'flashcard' | 'quiz' | 'cloze'

export interface VocabQuizOption {
  id: number
  label: string
  isCorrect: boolean
}
