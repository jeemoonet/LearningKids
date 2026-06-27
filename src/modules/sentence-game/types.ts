export type SentenceTrack = 'structure' | 'tense' | 'adverbial' | 'adj-adv' | 'boss'

export type SentenceRole =
  | 'subject'
  | 'predicate'
  | 'object'
  | 'attributive'
  | 'adverbial'
  | 'complement'

export interface SentenceLevel {
  id: string
  track: SentenceTrack
  title: string
  scene: string
  ruleSummary: string
  questionCount: number
  focusRoles: string[]
}

export interface SentenceQuestion {
  id: string
  levelId: string
  sentence: string
  sentenceZh: string
  verbs: string[]
  options: string[]
  correctIndex: number
  answer: string
  role: SentenceRole
  roleLabel: string
  structureNote: string
  hint: string
}

export interface StructureSegment {
  id: string
  text: string
  textZh: string
  role: SentenceRole
  roleLabel: string
}

export interface StructurePuzzle {
  id: string
  levelId: string
  sentence: string
  sentenceZh: string
  segments: StructureSegment[]
  roleBank: string[]
  hint: string
}

export interface SentenceLevelProgress {
  bestScore: number
  totalQuestions: number
  passed: boolean
  lastPlayedAt: number
}

export type SentenceProgressMap = Record<string, SentenceLevelProgress>
