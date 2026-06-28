import { apiFetch } from '../../lib/api'
import type { VocabWord } from '../vocab-training/types'

export interface PeerBoard {
  self: PeerLearner
  selfRank: number
  peers: PeerLearner[]
}

export interface PeerLearner {
  userId: string
  displayName: string
  avatar: string
  level: number
  levelTitle: string
  combatPower: number
  magicPower: number
  totalGrowth: number
  knownCount: number
  conqueredKingdoms: number
  kingdomTotal: number
  currentKingdomId: string
  currentKingdomName: string
  online: boolean
}

export interface LearningProfile {
  userId: string
  username: string
  displayName: string
  grade: string
  currentLibraryId: string | null
  currentLibraryName: string | null
  initDone: boolean
  knownCount: number
  activeSetId: string | null
}

export interface LearningLibrary {
  id: string
  name: string
  description: string
  sourceTier: string | null
  wordCount: number
  sortOrder: number
  isActive: boolean
}

export interface KnownWord {
  word: string
  pos: string
  source: string
  learnedAt: number
  meaningZh?: string
}

export interface InitWord {
  id: number
  word: string
  phonetic: string
  pos: string
  posLabel: string
  meaningZh: string
  exampleEn: string
  exampleZh: string
}

export interface InitStatus {
  tier: string
  initialized: boolean
  knownCount: number
  targetCount: number
  tierWordCount: number
}

export type SectionStatus = 'locked' | 'learning' | 'passed'

export interface SectionView {
  id: string
  seq: number
  status: SectionStatus
  wordCount: number
  masteredCount: number
  passedAt: number | null
}

export interface LearningSet {
  id: string
  libraryId: string
  libraryName: string
  size: number
  sectionCount: number
  status: 'active' | 'completed'
  createdAt: number
  sections: SectionView[]
}

export interface SectionWord {
  id: number
  word: string
  phonetic: string
  pos: string
  posLabel: string
  meaningZh: string
  exampleEn: string
  exampleZh: string
  familiarity: number
}

export interface SectionDetail {
  id: string
  seq: number
  status: SectionStatus
  setId: string
  words: SectionWord[]
}

export interface QuizQuestion {
  wordId: number
  word: string
  phonetic: string
  options: Array<{ id: number; label: string; isCorrect: boolean }>
}

export interface ClozePayload {
  sectionId: string
  words: VocabWord[]
  passageEn: string
  passageZh: string
}

export interface SubmitResult {
  passed: boolean
  correct: number
  total: number
  addedToKnown: number
  unlockedSectionId: string | null
  setCompleted: boolean
}

export interface LevelProgress {
  current: number
  floor: number
  ceiling: number
}

export interface PlayerStats {
  combatPower: number
  magicPower: number
  totalGrowth: number
  level: number
  levelTitle: string
  levelProgress: LevelProgress
  armySize: number
  legionBattlePower: number
}

export interface GrammarResult {
  passed: boolean
  familiarity: number
  magicPower: number
  magicGained: number
  combatPower: number
  totalGrowth: number
  level: number
  levelTitle: string
  levelUp: boolean
}

export const learningApi = {
  getProfile: () => apiFetch<{ profile: LearningProfile }>('/profile'),
  listPeers: () => apiFetch<PeerBoard>('/profile/peers'),
  updateProfile: (patch: { grade?: string; displayName?: string }) =>
    apiFetch<{ profile: LearningProfile }>('/profile', {
      method: 'PUT',
      body: JSON.stringify(patch),
    }),
  setCurrentLibrary: (libraryId: string) =>
    apiFetch<{ profile: LearningProfile }>('/profile/current-library', {
      method: 'PUT',
      body: JSON.stringify({ libraryId }),
    }),

  listKnownWords: () => apiFetch<{ words: KnownWord[] }>('/known-words'),
  initStatus: (tier: string) =>
    apiFetch<InitStatus>(`/known-words/init/status?tier=${encodeURIComponent(tier)}`),
  initDraw: (tier: string) =>
    apiFetch<{ words: InitWord[]; status: InitStatus }>(
      `/known-words/init/draw?tier=${encodeURIComponent(tier)}`,
    ),
  initKeep: (tier: string, words: string[]) =>
    apiFetch<{ added: number; skipped: number; status: InitStatus }>('/known-words/init/keep', {
      method: 'POST',
      body: JSON.stringify({ tier, words }),
    }),

  listLibraries: () => apiFetch<{ libraries: LearningLibrary[] }>('/libraries'),
  libraryWords: (id: string) =>
    apiFetch<{ library: LearningLibrary; words: Array<VocabWord & { known: boolean }> }>(
      `/libraries/${id}/words`,
    ),

  activeSet: () => apiFetch<{ set: LearningSet | null }>('/learning/active'),
  createSet: (libraryId?: string, size?: number) =>
    apiFetch<{ set: LearningSet }>('/learning/sets', {
      method: 'POST',
      body: JSON.stringify({ libraryId, size }),
    }),
  abandonSet: () => apiFetch<{ ok: true }>('/learning/sets/abandon', { method: 'POST' }),
  getSection: (id: string) =>
    apiFetch<{ section: SectionDetail }>(`/learning/sections/${id}`),
  updateFamiliarity: (sectionId: string, word: string, familiarity: number) =>
    apiFetch<{ ok: true }>(`/learning/sections/${sectionId}/familiarity`, {
      method: 'POST',
      body: JSON.stringify({ word, familiarity }),
    }),

  sectionCards: (id: string) =>
    apiFetch<{ words: SectionWord[] }>(`/courseware/section/${id}/cards`),
  sectionQuiz: (id: string) =>
    apiFetch<{ questions: QuizQuestion[] }>(`/courseware/section/${id}/quiz`),

  sectionCloze: (id: string) => apiFetch<ClozePayload>(`/assessment/section/${id}/cloze`),
  submitAssessment: (id: string, correct: number, total: number) =>
    apiFetch<SubmitResult>(`/assessment/section/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify({ correct, total }),
    }),

  playerStats: () => apiFetch<PlayerStats>('/learning/player-stats'),

  submitGrammarResult: (payload: {
    module: 'prep' | 'sentence'
    skillId: string
    correctCount: number
    totalQuestions: number
  }) =>
    apiFetch<GrammarResult>('/training-camp/grammar-result', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  migrateGrammarProgress: (payload: {
    entries: Array<{
      module: 'prep' | 'sentence'
      skillId: string
      bestScore: number
      totalQuestions: number
      passed: boolean
      lastPlayedAt?: number
    }>
  }) =>
    apiFetch<
      PlayerStats & { imported: number; skipped: number; magicAdded: number }
    >('/training-camp/migrate-progress', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
}
