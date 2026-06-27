export interface FreeVocabInitStatus {
  tierId: string
  initialized: boolean
  knownCount: number
  targetCount: number
  tierWordCount: number
  score: number
  pronounCount: number
}

export interface FreeVocabInitWord {
  id: number
  word: string
  phonetic: string
  pos: string
  posLabel: string
  meaningZh: string
  exampleEn: string
  exampleZh: string
}

export interface FreeVocabDrawResponse {
  words: FreeVocabInitWord[]
  status: FreeVocabInitStatus
}

export interface FreeVocabKeepResponse {
  added: number
  skipped: number
  status: FreeVocabInitStatus
}

export type SentencePattern = 'SV' | 'SVO' | 'SVP' | 'SVO_attr' | 'SVO_adv' | 'SVOC'

export interface PatternSlotInfo {
  role: string
  roleLabel: string
  posHints: string[]
  minWords: number
}

export interface PatternInfo {
  id: SentencePattern
  title: string
  summary: string
  unlockOrder: number
  slots: PatternSlotInfo[]
}

export interface SelectedWordCandidate {
  id: number
  word: string
  pos: string
  posLabel: string
  meaningZh: string
  phonetic: string
  role: string
  roleLabel: string
  reason: string
}

export interface SelectWordsResponse {
  pattern: SentencePattern
  candidates: SelectedWordCandidate[]
  source: 'ai' | 'fallback'
  learningPoolSize: number
}

export interface ActiveBatchWord {
  word: string
  role: string | null
  pos: string
  posLabel: string
  meaningZh: string
}

export interface ActiveBatch {
  id: string
  tierId: string
  pattern: SentencePattern
  status: string
  clozeStreak: number
  createdAt: number
  words: ActiveBatchWord[]
}

export interface FreeVocabProgress {
  tierId: string
  initialized: boolean
  knownCount: number
  tierWordCount: number
  score: number
  learningCount: number
  activeBatch: ActiveBatch | null
}

export interface CreateBatchResponse {
  batch: ActiveBatch
  progress: FreeVocabProgress
}

export type FreeVocabView = 'home' | 'pattern' | 'picker'

export const POS_SECTION_LABEL: Record<string, string> = {
  noun: '名词',
  verb: '动词',
  adj: '形容词',
  pronoun: '代词',
}

export const PATTERN_LABEL: Record<SentencePattern, string> = {
  SV: '主谓（SV）',
  SVO: '主谓宾（SVO）',
  SVP: '主系表（SVP）',
  SVO_attr: '主谓宾 + 定语',
  SVO_adv: '主谓宾 + 状语',
  SVOC: '主谓宾 + 宾补',
}
