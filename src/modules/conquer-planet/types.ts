import type { PartOfSpeech } from '../word-hunter/domain/battle/battleTypes'
import { RACE_LABEL } from '../word-hunter/domain/element/Element'

export type PlanetLevelKind = 'recruit' | 'boss' | 'review'

export interface PlanetLevel {
  id: string
  kind: PlanetLevelKind
  name: string
  desc: string
  icon: string
  monsterPos?: PartOfSpeech
  monsterName?: string
  bossRecruitCount?: number
  seals?: number
  done?: boolean
}

export interface PlanetWord {
  id: string
  word: string
  meaning: string
  phonetic?: string
  partOfSpeech: PartOfSpeech
  syllables: number
  keySlots: { own: number[]; captured: number[] }
  sentence: string
  sentenceZh: string
}

export interface PlanetSoldier {
  wordId: string
  word: string
  meaning: string
  partOfSpeech: PartOfSpeech
  syllables: number
  familiarity: number
  phonetic?: string
  posLabel?: string
  exampleEn?: string
  exampleZh?: string
}

export type PlanetKingdomStatus = 'locked' | 'current' | 'cleared'

export interface PlanetMonster {
  id: string
  name: string
  epithet: string
  partOfSpeech?: PartOfSpeech
}

export interface PlanetKingdomSummary {
  id: string
  order: number
  name: string
  subtitle: string
  difficulty: string
  theme: string
  monster: PlanetMonster
  status: PlanetKingdomStatus
  levelsTotal: number
  levelsDone: number
  levels: PlanetLevel[]
}

export interface PlanetSession {
  activeKingdomId: string
  kingdoms: PlanetKingdomSummary[]
  kingdom: { id: string; name: string; subtitle: string }
  levels: PlanetLevel[]
  conqueredLevelIds: string[]
  armySize: number
  armyExp: number
  totalPower: number
  dueReviewCount: number
  soldiers: PlanetSoldier[]
  distractorPool: PlanetWord[]
}

export interface RecruitLevelPayload {
  level: PlanetLevel
  candidates: PlanetWord[]
  distractorPool: PlanetWord[]
}

export interface BossLevelPayload {
  level: PlanetLevel
  army: PlanetWord[]
  rewardPreview: PlanetWord[]
  distractorPool: PlanetWord[]
}

export interface ReviewLevelPayload {
  level: PlanetLevel
  queue: PlanetWord[]
  distractorPool: PlanetWord[]
}

/** 六大战斗种族（UI 编队顺序） */
export const SIX_RACES: Array<Exclude<PartOfSpeech, 'other'>> = [
  'verb',
  'noun',
  'adjective',
  'adverb',
  'prep',
  'pronoun',
]

/** 战斗种族（UI）：race 为统一叫法，role 为中文简称 */
export const POS_RACE: Record<PartOfSpeech, { race: string; role: string; color: string; icon: string }> = {
  noun: { race: RACE_LABEL.noun, role: '平民', color: '#fbbc04', icon: '🧢' },
  verb: { race: RACE_LABEL.verb, role: '武士', color: '#ea4335', icon: '🛡️' },
  adjective: { race: RACE_LABEL.adjective, role: '学者', color: '#4285f4', icon: '⛑️' },
  adverb: { race: RACE_LABEL.adverb, role: '魔法师', color: '#34a853', icon: '🎩' },
  prep: { race: RACE_LABEL.prep, role: '精灵', color: '#7cb342', icon: '🧚' },
  pronoun: { race: RACE_LABEL.pronoun, role: '贵族', color: '#ab47bc', icon: '👑' },
  other: { race: RACE_LABEL.other, role: '杂项', color: '#9aa0a6', icon: '❓' },
}

/** 将 WordEntry 兼容层：服务端 PlanetWord → SpellChecker WordEntry */
export function toWordEntry(w: PlanetWord) {
  return {
    id: w.id,
    word: w.word,
    meaning: w.meaning,
    phonetic: w.phonetic,
    partOfSpeech: w.partOfSpeech,
    keySlots: w.keySlots,
    clozeSentence: w.sentence,
    clozeSentenceZh: w.sentenceZh,
  }
}
