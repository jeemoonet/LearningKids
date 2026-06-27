import type { DatabaseSync } from 'node:sqlite'
import { getSectionWhitelist } from './contentScope.js'
import { getKnownWordSet } from './knownWords.js'
import { getSectionDetail } from './learningSet.js'

export type WhPartOfSpeech =
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'adverb'
  | 'prep'
  | 'pronoun'
  | 'other'

export interface WhKeySlots {
  own: number[]
  captured: number[]
}

export interface WhWordEntry {
  id: string
  word: string
  meaning: string
  phonetic?: string
  theme?: string
  difficulty?: 1 | 2 | 3
  partOfSpeech: WhPartOfSpeech
  keySlots: WhKeySlots
  exampleEn?: string
  exampleZh?: string
  clozeSentence?: string
  clozeSentenceZh?: string
}

export interface WhMonsterSkill {
  type: 'damage_reduction' | 'burn' | 'shorter_timer' | 'blur_options' | 'image_attack'
  value?: number
}

export interface WhLevelConfig {
  id: number
  name: string
  monsterName: string
  monsterAsset: string
  backgroundAsset?: string
  monsterPartOfSpeech: WhPartOfSpeech
  themeWordIds: string[]
  isTutorialLevel?: boolean
  damageMultiplier?: number
  timerSeconds: number
  skills: WhMonsterSkill[]
  attackPoolWeights: { theme: number; learned: number }
}

export interface WhWordMastery {
  wordId: string
  familiarity: number
  learnedVia: 'starter' | 'victory' | 'captured'
  firstLearnedAt: string
}

export interface WhSession {
  sectionId: string
  sectionSeq: number
  level: WhLevelConfig
  words: WhWordEntry[]
  ownedWordIds: string[]
  wordMastery: Record<string, WhWordMastery>
}

const MONSTER_NAMES = ['迷雾小妖', '卷轴守卫', '语法幽灵', '时态魔', '拼写蛇', '词根兽', '句型灵', '记忆蝶']

function mapPos(pos: string): WhPartOfSpeech {
  const p = pos.toLowerCase()
  if (p === 'noun' || p === 'n') return 'noun'
  if (p === 'verb' || p === 'v') return 'verb'
  if (p === 'adjective' || p === 'adj') return 'adjective'
  if (p === 'adverb' || p === 'adv') return 'adverb'
  if (p === 'prep' || p === 'preposition' || p === '介词') return 'prep'
  if (p === 'pronoun' || p === '代词') return 'pronoun'
  return 'other'
}

function wordEntryId(dbId: number): string {
  return `w_${dbId}`
}

/** 根据单词长度生成拼写空位（自有 1 空、缴获 2–3 空） */
export function buildKeySlots(word: string): WhKeySlots {
  const len = word.length
  if (len <= 1) return { own: [0], captured: [0] }
  if (len === 2) return { own: [1], captured: [0, 1] }
  if (len === 3) return { own: [1], captured: [0, 2] }
  if (len <= 5) {
    const mid = Math.floor(len / 2)
    return { own: [mid], captured: [0, len - 1] }
  }
  const own = [Math.floor(len * 0.35), Math.floor(len * 0.65)]
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 2)
  const captured = [0, Math.floor(len / 2), len - 1]
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 3)
  return { own, captured }
}

function pickMonsterPos(words: WhWordEntry[]): WhPartOfSpeech {
  const counts: Partial<Record<WhPartOfSpeech, number>> = {}
  for (const w of words) {
    if (w.partOfSpeech === 'other') continue
    counts[w.partOfSpeech] = (counts[w.partOfSpeech] ?? 0) + 1
  }
  let best: WhPartOfSpeech = 'adjective'
  let max = 0
  for (const [pos, n] of Object.entries(counts) as Array<[WhPartOfSpeech, number]>) {
    if (n > max) {
      max = n
      best = pos
    }
  }
  return best
}

function fetchWhitelistWordRows(db: DatabaseSync, whitelist: Set<string>) {
  if (whitelist.size === 0) return []
  const lower = [...whitelist].map((w) => w.toLowerCase())
  const placeholders = lower.map(() => '?').join(', ')
  return db
    .prepare(
      `SELECT id, word, phonetic, pos, pos_label, meaning_zh, example_en, example_zh FROM words
       WHERE LOWER(word) IN (${placeholders})`,
    )
    .all(...lower) as Array<{
    id: number
    word: string
    phonetic: string
    pos: string
    pos_label: string
    meaning_zh: string
    example_en: string
    example_zh: string
  }>
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function buildClozeFromExample(word: string, exampleEn: string, exampleZh: string, meaning: string) {
  const re = new RegExp(`\\b${escapeRegex(word)}\\b`, 'i')
  if (exampleEn && re.test(exampleEn)) {
    return {
      clozeSentence: exampleEn.replace(re, '___'),
      clozeSentenceZh: exampleZh || meaning,
    }
  }
  return {
    clozeSentence: 'I know ___.',
    clozeSentenceZh: `我认识${meaning}。`,
  }
}

function rowToEntry(row: {
  id: number
  word: string
  phonetic: string
  pos: string
  meaning_zh: string
  example_en: string
  example_zh: string
}): WhWordEntry {
  const w = row.word.trim()
  const { clozeSentence, clozeSentenceZh } = buildClozeFromExample(
    w,
    row.example_en ?? '',
    row.example_zh ?? '',
    row.meaning_zh || w,
  )
  return {
    id: wordEntryId(row.id),
    word: w,
    meaning: row.meaning_zh || w,
    phonetic: row.phonetic || undefined,
    partOfSpeech: mapPos(row.pos),
    keySlots: buildKeySlots(w),
    theme: 'section',
    exampleEn: row.example_en || undefined,
    exampleZh: row.example_zh || undefined,
    clozeSentence,
    clozeSentenceZh,
  }
}

export function buildWordHunterSession(
  db: DatabaseSync,
  userId: string,
  sectionId: string,
): WhSession | null {
  const detail = getSectionDetail(db, userId, sectionId)
  if (!detail || detail.words.length === 0) return null

  const whitelist = getSectionWhitelist(db, userId, sectionId)
  const knownSet = getKnownWordSet(db, userId)
  const rows = fetchWhitelistWordRows(db, whitelist)

  const entryMap = new Map<string, WhWordEntry>()
  for (const row of rows) {
    const entry = rowToEntry(row)
    entryMap.set(entry.id, entry)
  }

  // 确保本节词全部在词池
  for (const sw of detail.words) {
    const id = wordEntryId(sw.id)
    if (!entryMap.has(id)) {
      const { clozeSentence, clozeSentenceZh } = buildClozeFromExample(
        sw.word,
        sw.exampleEn ?? '',
        sw.exampleZh ?? '',
        sw.meaningZh || sw.word,
      )
      entryMap.set(id, {
        id,
        word: sw.word,
        meaning: sw.meaningZh || sw.word,
        phonetic: sw.phonetic || undefined,
        partOfSpeech: mapPos(sw.pos),
        keySlots: buildKeySlots(sw.word),
        theme: 'section',
        exampleEn: sw.exampleEn || undefined,
        exampleZh: sw.exampleZh || undefined,
        clozeSentence,
        clozeSentenceZh,
      })
    }
  }

  const themeWordIds = detail.words.map((w) => wordEntryId(w.id))
  const sectionEntries = themeWordIds
    .map((id) => entryMap.get(id))
    .filter((e): e is WhWordEntry => Boolean(e))

  const owned = new Set<string>()
  for (const sw of detail.words) {
    const id = wordEntryId(sw.id)
    if (knownSet.has(sw.word.toLowerCase())) owned.add(id)
  }
  for (const row of rows) {
    const id = wordEntryId(row.id)
    if (knownSet.has(row.word.toLowerCase())) owned.add(id)
  }

  // 弹药匣至少需要 10 个自有词：优先低熟悉度本节词补足
  const sortedSection = [...detail.words].sort((a, b) => a.familiarity - b.familiarity)
  for (const sw of sortedSection) {
    if (owned.size >= 10) break
    owned.add(wordEntryId(sw.id))
  }
  for (const id of themeWordIds) {
    if (owned.size >= 10) break
    owned.add(id)
  }

  const now = new Date().toISOString()
  const wordMastery: Record<string, WhWordMastery> = {}
  for (const id of owned) {
    const sw = detail.words.find((w) => wordEntryId(w.id) === id)
    const fam = sw ? Math.max(10, sw.familiarity * 20) : 30
    const via = sw && knownSet.has(sw.word.toLowerCase()) ? 'starter' : 'starter'
    wordMastery[id] = {
      wordId: id,
      familiarity: fam,
      learnedVia: via,
      firstLearnedAt: now,
    }
  }

  const seq = detail.seq
  const monsterPos = pickMonsterPos(sectionEntries)
  const level: WhLevelConfig = {
    id: seq,
    name: `第 ${seq} 节 · 单词猎场`,
    monsterName: MONSTER_NAMES[(seq - 1) % MONSTER_NAMES.length],
    monsterAsset: 'mist',
    backgroundAsset: 'level-01-mist',
    monsterPartOfSpeech: monsterPos,
    themeWordIds,
    isTutorialLevel: seq === 1,
    damageMultiplier: seq === 1 ? 0.5 : 1,
    timerSeconds: 10,
    skills: seq === 1 ? [{ type: 'blur_options' }] : [],
    attackPoolWeights: { theme: 0.7, learned: 0.3 },
  }

  return {
    sectionId,
    sectionSeq: seq,
    level,
    words: [...entryMap.values()],
    ownedWordIds: [...owned],
    wordMastery,
  }
}

/** 胜利后提升本节主题词熟悉度 */
export function applyWordHunterVictory(
  db: DatabaseSync,
  userId: string,
  sectionId: string,
): { updated: number } {
  const detail = getSectionDetail(db, userId, sectionId)
  if (!detail) throw new Error('小节不存在')

  let updated = 0
  const stmt = db.prepare(
    'UPDATE section_words SET familiarity = MIN(5, familiarity + 1) WHERE section_id = ? AND LOWER(word) = LOWER(?)',
  )
  for (const w of detail.words) {
    const r = stmt.run(sectionId, w.word)
    if (r.changes > 0) updated += 1
  }
  return { updated }
}
