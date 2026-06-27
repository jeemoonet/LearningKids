export type PrepTrack = 'time' | 'position' | 'more'

export interface PrepLevel {
  id: string
  track: PrepTrack
  groupIndex: number
  title: string
  scene: string
  ruleSummary: string
  questionCount: number
  prepWords: string[]
}

export interface PrepQuestion {
  id: string
  levelId: string
  sentence: string
  sentenceZh: string
  verbs: string[]
  options: string[]
  correctIndex: number
  answer: string
  hint: string
  source: 'template' | 'passage' | 'example'
}

export type PrepGameTab = 'levels' | 'challenge' | 'exam'

export interface PrepLevelProgress {
  bestScore: number
  totalQuestions: number
  passed: boolean
  lastPlayedAt: number
}

export type PrepProgressMap = Record<string, PrepLevelProgress>
