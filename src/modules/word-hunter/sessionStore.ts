import { create } from 'zustand'
import type {
  BattleState,
  ClipSlot,
  LevelConfig,
  PrefillResult,
  SaveData,
  WordEntry,
  WordMastery,
} from './domain/battle/battleTypes'
import { BattleEngine } from './domain/battle/BattleEngine'
import { AutoLoadout } from './domain/loadout/AutoLoadout'
import { WordBank } from './domain/word/WordBank'
import type { WordHunterSession } from './types'
import { submitBossMicroGain } from '../conquer-planet/api'
import type { PlanetSession } from '../conquer-planet/types'
import { emitPlayerStatsDirty } from '../learning/playerStatsEvents'

type BattleMode = 'section' | 'boss' | null

interface SessionStore {
  sectionId: string | null
  battleMode: BattleMode
  onPlanetSessionUpdate: ((session: PlanetSession) => void) | null
  save: SaveData | null
  wordBank: WordBank | null
  engine: BattleEngine | null
  battle: BattleState | null
  prefill: PrefillResult | null
  level: LevelConfig | null
  loadSession: (session: WordHunterSession) => void
  loadBossBattle: (input: {
    levelId: string
    level: LevelConfig
    words: WordEntry[]
    ownedWordIds: string[]
    wordMastery: Record<string, WordMastery>
  }) => void
  getWord: (id: string) => WordEntry | undefined
  getCapturedWords: () => string[]
  getLevel: () => LevelConfig | undefined
  prepareBattle: () => PrefillResult | null
  startBattle: () => void
  submitDefense: (optionId: string) => void
  defenseTimeout: () => void
  captureReplace: (index: number) => void
  captureDiscard: () => void
  selectWord: (wordId: string) => void
  fireClip: (wordId: string, inputs: Record<number, string>) => void
  finishResolve: () => void
  clearDefenseFeedback: () => void
  resetBattle: () => void
  clear: () => void
}

function sessionToSave(session: WordHunterSession): SaveData {
  return {
    version: 1,
    progress: {
      version: 1,
      unlockedLevel: session.sectionSeq,
      wordMastery: session.wordMastery,
      stats: {
        totalBattlesWon: 0,
        totalWordsLearned: session.ownedWordIds.length,
        bestCombo: 0,
      },
    },
    ownedWordIds: [...session.ownedWordIds],
    updatedAt: new Date().toISOString(),
  }
}

function reportBossMicroGain(
  word: string,
  onUpdate: ((session: PlanetSession) => void) | null,
  patchMessage: (hint: string) => void,
): void {
  void submitBossMicroGain(word)
    .then((res) => {
      if (!res.gained) return
      onUpdate?.(res.session)
      emitPlayerStatsDirty()
      patchMessage(`${word} 熟悉度 +1`)
    })
    .catch(() => undefined)
}

function buildBossOwnedPrefill(wordBank: WordBank): PrefillResult {
  const used = new Set<string>()
  const recentIds: string[] = []
  const recommendedIds: string[] = []

  for (const id of wordBank.getRecentLearnedWordIds(5)) {
    if (recentIds.length >= 5) break
    if (!wordBank.isOwned(id) || used.has(id)) continue
    recentIds.push(id)
    used.add(id)
  }

  for (const id of wordBank.getMediumFamiliarityWordIds(used)) {
    if (recommendedIds.length >= 5) break
    if (!wordBank.isOwned(id) || used.has(id)) continue
    recommendedIds.push(id)
    used.add(id)
  }

  const ownedFallback = wordBank
    .getOwnedEntries()
    .map((w) => w.id)
    .filter((id) => !used.has(id))

  for (const id of ownedFallback) {
    if (recentIds.length < 5) {
      recentIds.push(id)
      used.add(id)
      continue
    }
    if (recommendedIds.length < 5) {
      recommendedIds.push(id)
      used.add(id)
      continue
    }
    break
  }

  const slots: ClipSlot[] = [
    ...recentIds.map((wordId) => ({
      wordId,
      source: 'owned' as const,
      prefillTag: 'recent' as const,
    })),
    ...recommendedIds.map((wordId) => ({
      wordId,
      source: 'owned' as const,
      prefillTag: 'recommended' as const,
    })),
  ]

  return { slots, recentIds, recommendedIds }
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  sectionId: null,
  battleMode: null,
  onPlanetSessionUpdate: null,
  save: null,
  wordBank: null,
  engine: null,
  battle: null,
  prefill: null,
  level: null,

  loadSession: (session) => {
    const entries = new Map<string, WordEntry>()
    for (const w of session.words) entries.set(w.id, w)
    const save = sessionToSave(session)
    const wordBank = new WordBank(entries, save)
    set({
      sectionId: session.sectionId,
      battleMode: 'section',
      save,
      wordBank,
      level: session.level,
      engine: null,
      battle: null,
      prefill: null,
    })
  },

  loadBossBattle: ({ levelId, level, words, ownedWordIds, wordMastery }) => {
    const entries = new Map<string, WordEntry>()
    for (const w of words) entries.set(w.id, w)
    const now = new Date().toISOString()
    const save: SaveData = {
      version: 1,
      progress: {
        version: 1,
        unlockedLevel: 1,
        wordMastery,
        stats: {
          totalBattlesWon: 0,
          totalWordsLearned: ownedWordIds.length,
          bestCombo: 0,
        },
      },
      ownedWordIds: [...ownedWordIds],
      updatedAt: now,
    }
    const wordBank = new WordBank(entries, save)
    set({
      sectionId: levelId,
      battleMode: 'boss',
      save,
      wordBank,
      level,
      engine: null,
      battle: null,
      prefill: null,
    })
  },

  getWord: (id) => get().wordBank?.getEntry(id),

  getCapturedWords: () => {
    const { engine, wordBank } = get()
    if (!engine || !wordBank) return []
    return engine
      .getCapturedWordIds()
      .map((id) => wordBank.getEntry(id)?.word)
      .filter((w): w is string => Boolean(w))
  },

  getLevel: () => get().level ?? undefined,

  prepareBattle: () => {
    const { wordBank, level, battleMode } = get()
    if (!wordBank || !level) return null
    const prefill =
      battleMode === 'boss'
        ? buildBossOwnedPrefill(wordBank)
        : AutoLoadout.build(wordBank, level)
    set({ prefill })
    return prefill
  },

  startBattle: () => {
    const { wordBank, level, prefill, battleMode } = get()
    if (!wordBank || !level || !prefill) return

    const themeWordsAll = level.themeWordIds
      .map((id) => wordBank.getEntry(id))
      .filter((w): w is WordEntry => Boolean(w))
    const themeWords =
      battleMode === 'boss'
        ? themeWordsAll.filter((w) => !wordBank.isOwned(w.id))
        : themeWordsAll
    const learnedWords = wordBank.getOwnedEntries()
    const monsterLearnedWords = battleMode === 'boss' ? [] : learnedWords

    const engine = new BattleEngine(
      level,
      wordBank,
      prefill.slots,
      themeWords,
      monsterLearnedWords,
      battleMode === 'boss',
    )
    engine.start()
    set({ engine, battle: { ...engine.getState() } })
  },

  submitDefense: (optionId) => {
    const { engine, wordBank, battleMode, onPlanetSessionUpdate } = get()
    if (!engine) return
    const attackWordId = engine.getState().attackWordId
    engine.submitDefense(optionId)
    const state = engine.getState()
    const patchMessage = (hint: string) => {
      const current = get().battle
      if (!current?.resolveMessage) return
      set({
        battle: {
          ...current,
          resolveMessage: `${current.resolveMessage}（${hint}）`,
        },
      })
    }
    if (battleMode === 'boss' && state.lastDefenseCorrect && attackWordId) {
      const entry = wordBank?.getEntry(attackWordId)
      if (entry) reportBossMicroGain(entry.word, onPlanetSessionUpdate, patchMessage)
    }
    set({ battle: { ...state } })
  },

  defenseTimeout: () => {
    const { engine } = get()
    if (!engine) return
    engine.onDefenseTimeout()
    set({ battle: { ...engine.getState() } })
  },

  captureReplace: (index) => {
    const { engine } = get()
    if (!engine) return
    engine.resolveCaptureOverflow('replace', index)
    set({ battle: { ...engine.getState() } })
  },

  captureDiscard: () => {
    const { engine } = get()
    if (!engine) return
    engine.resolveCaptureOverflow('discard')
    set({ battle: { ...engine.getState() } })
  },

  selectWord: (wordId) => {
    const { engine } = get()
    if (!engine) return
    engine.selectAttackWord(wordId)
    set({ battle: { ...engine.getState() } })
  },

  fireClip: (wordId, inputs) => {
    const { engine, wordBank, battleMode, onPlanetSessionUpdate } = get()
    if (!engine) return
    const entry = wordBank?.getEntry(wordId)
    engine.selectAttackWord(wordId)
    engine.submitSpell(inputs)
    const state = engine.getState()
    const patchMessage = (hint: string) => {
      const current = get().battle
      if (!current?.resolveMessage) return
      set({
        battle: {
          ...current,
          resolveMessage: `${current.resolveMessage}（${hint}）`,
        },
      })
    }
    if (battleMode === 'boss' && entry && state.lastHitResult) {
      reportBossMicroGain(entry.word, onPlanetSessionUpdate, patchMessage)
    }
    set({ battle: { ...state } })
  },

  finishResolve: () => {
    const { engine } = get()
    if (!engine) return
    engine.finishResolve()
    set({ battle: { ...engine.getState() } })
  },

  clearDefenseFeedback: () => {
    const { engine } = get()
    if (!engine) return
    engine.clearDefenseFeedback()
    set({ battle: { ...engine.getState() } })
  },

  resetBattle: () => {
    set({ engine: null, battle: null, prefill: null })
  },

  clear: () => {
    set({
      sectionId: null,
      battleMode: null,
      onPlanetSessionUpdate: null,
      save: null,
      wordBank: null,
      engine: null,
      battle: null,
      prefill: null,
      level: null,
    })
  },
}))
