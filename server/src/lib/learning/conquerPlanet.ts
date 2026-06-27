import type { DatabaseSync } from 'node:sqlite'
import { mapWordRow } from '../gameGroups.js'
import { addKnownWords, getKnownWordSet, listKnownWords } from './knownWords.js'
import {
  getKingdom,
  getKingdomLevels,
  getPlanetLevel,
  type PlanetKingdomConfig,
  type PlanetLevelConfig,
} from './conquerPlanetConfig.js'
import { getEffectiveKingdomConfig, getEffectiveKingdoms } from './planetKingdomSettings.js'
import { buildKeySlots, type WhKeySlots, type WhPartOfSpeech } from './wordHunter.js'

export interface PlanetWordEntry {
  id: string
  word: string
  meaning: string
  phonetic?: string
  partOfSpeech: WhPartOfSpeech
  syllables: number
  keySlots: WhKeySlots
  sentence: string
  sentenceZh: string
}

export interface PlanetSoldier {
  wordId: string
  word: string
  meaning: string
  partOfSpeech: WhPartOfSpeech
  syllables: number
  familiarity: number
  phonetic?: string
  posLabel?: string
  exampleEn?: string
  exampleZh?: string
}

export type PlanetKingdomStatus = 'locked' | 'current' | 'cleared'

export interface PlanetKingdomSummary {
  id: string
  order: number
  name: string
  subtitle: string
  difficulty: string
  theme: string
  monster: PlanetKingdomConfig['monster']
  status: PlanetKingdomStatus
  levelsTotal: number
  levelsDone: number
  levels: Array<PlanetLevelConfig & { done: boolean }>
}

export interface PlanetSession {
  activeKingdomId: string
  kingdoms: PlanetKingdomSummary[]
  kingdom: { id: string; name: string; subtitle: string }
  levels: Array<PlanetLevelConfig & { done: boolean }>
  conqueredLevelIds: string[]
  armySize: number
  armyExp: number
  totalPower: number
  dueReviewCount: number
  soldiers: PlanetSoldier[]
  /** 认词/造句干扰项词池（我的库 + 当前学习库抽样） */
  distractorPool: PlanetWordEntry[]
}

export interface RecruitLevelPayload {
  level: PlanetLevelConfig
  candidates: PlanetWordEntry[]
  distractorPool: PlanetWordEntry[]
}

export interface BossLevelPayload {
  level: PlanetLevelConfig
  army: PlanetWordEntry[]
  rewardPreview: PlanetWordEntry[]
  distractorPool: PlanetWordEntry[]
}

export interface ReviewLevelPayload {
  level: PlanetLevelConfig
  queue: PlanetWordEntry[]
  distractorPool: PlanetWordEntry[]
}

const FAMILIARITY_MAX = 5
const DUE_THRESHOLD = 2
const RECRUIT_WORD_COUNT = 4
const REVIEW_WORD_COUNT = 4

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

/** 简易音节估算：元音组计数，至少 1 */
export function estimateSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '')
  if (w.length <= 3) return 1
  const groups = w.match(/[aeiouy]+/g)
  let count = groups?.length ?? 1
  if (w.endsWith('e') && count > 1) count -= 1
  return Math.max(1, Math.min(4, count))
}

function posCoefficient(pos: WhPartOfSpeech): number {
  return pos === 'verb' ? 1.5 : 1.0
}

function buildSentence(word: string, meaning: string, exampleEn: string, exampleZh: string) {
  const re = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
  if (exampleEn && re.test(exampleEn)) {
    return {
      sentence: exampleEn.replace(re, '___'),
      sentenceZh: exampleZh || meaning,
    }
  }
  return {
    sentence: `I like ___.`,
    sentenceZh: `我喜欢${meaning}。`,
  }
}

function rowToPlanetEntry(row: Record<string, unknown>): PlanetWordEntry {
  const m = mapWordRow(row)
  const w = m.word.trim()
  let partOfSpeech = mapPos(m.pos)
  const knownPos = String(row.known_pos ?? '')
  if (partOfSpeech === 'other' && knownPos) {
    partOfSpeech = mapPos(knownPos)
  }
  const { sentence, sentenceZh } = buildSentence(w, m.meaningZh, m.exampleEn, m.exampleZh)
  return {
    id: wordEntryId(m.id),
    word: w,
    meaning: m.meaningZh || w,
    phonetic: m.phonetic || undefined,
    partOfSpeech,
    syllables: estimateSyllables(w),
    keySlots: buildKeySlots(w),
    sentence,
    sentenceZh,
  }
}

function soldierFromWordRow(
  row: Record<string, unknown>,
  familiarity: number,
): PlanetSoldier {
  const m = mapWordRow(row)
  const entry = rowToPlanetEntry(row)
  return {
    wordId: entry.id,
    word: entry.word,
    meaning: entry.meaning,
    partOfSpeech: entry.partOfSpeech,
    syllables: entry.syllables,
    familiarity,
    phonetic: m.phonetic || undefined,
    posLabel: m.posLabel || undefined,
    exampleEn: m.exampleEn || undefined,
    exampleZh: m.exampleZh || undefined,
  }
}

function getUserLibraryId(db: DatabaseSync, userId: string): string {
  const row = db
    .prepare('SELECT current_library_id FROM user_profiles WHERE user_id = ?')
    .get(userId) as { current_library_id: string | null } | undefined
  if (row?.current_library_id) return row.current_library_id
  return 'lib-beginner'
}

function fetchLibraryWordRows(
  db: DatabaseSync,
  libraryId: string,
  opts?: { pos?: WhPartOfSpeech; excludeKnown?: Set<string>; limit?: number },
) {
  const params: Array<string | number> = [libraryId]
  let sql = `
    SELECT w.* FROM words w
    INNER JOIN library_words lw ON lw.word_id = w.id
    WHERE lw.library_id = ?
  `
  if (opts?.pos) {
    sql += ' AND w.pos = ?'
    params.push(opts.pos)
  }
  if (opts?.excludeKnown && opts.excludeKnown.size > 0) {
    const placeholders = [...opts.excludeKnown].map(() => '?').join(', ')
    sql += ` AND LOWER(w.word) NOT IN (${placeholders})`
    params.push(...opts.excludeKnown)
  }
  sql += ' ORDER BY RANDOM()'
  if (opts?.limit) {
    sql += ' LIMIT ?'
    params.push(opts.limit)
  }
  return db.prepare(sql).all(...params) as Array<Record<string, unknown>>
}

function fetchKnownWordRows(db: DatabaseSync, userId: string) {
  return db
    .prepare(
      `SELECT w.*, k.pos AS known_pos FROM user_known_words k
       INNER JOIN words w ON LOWER(w.word) = LOWER(k.word)
       WHERE k.user_id = ?
       ORDER BY k.learned_at DESC`,
    )
    .all(userId) as Array<Record<string, unknown>>
}

function ensureFamiliarityRows(db: DatabaseSync, userId: string): void {
  const now = Date.now()
  const known = listKnownWords(db, userId)
  const insert = db.prepare(`
    INSERT OR IGNORE INTO user_planet_familiarity (user_id, word, familiarity, last_reviewed_at)
    VALUES (?, ?, 3, ?)
  `)
  for (const k of known) {
    insert.run(userId, k.word.toLowerCase(), now)
  }
}

function getFamiliarityMap(db: DatabaseSync, userId: string): Map<string, number> {
  const rows = db
    .prepare(
      'SELECT word, familiarity FROM user_planet_familiarity WHERE user_id = ?',
    )
    .all(userId) as Array<{ word: string; familiarity: number }>
  return new Map(rows.map((r) => [r.word.toLowerCase(), r.familiarity]))
}

function getConqueredLevels(db: DatabaseSync, userId: string): string[] {
  const rows = db
    .prepare(
      `SELECT level_id FROM user_planet_progress WHERE user_id = ? AND status = 'done'`,
    )
    .all(userId) as Array<{ level_id: string }>
  return rows.map((r) => r.level_id)
}

function markLevelDone(db: DatabaseSync, userId: string, levelId: string): void {
  db.prepare(
    `INSERT INTO user_planet_progress (user_id, level_id, status, completed_at)
     VALUES (?, ?, 'done', ?)
     ON CONFLICT(user_id, level_id) DO UPDATE SET status = 'done', completed_at = excluded.completed_at`,
  ).run(userId, levelId, Date.now())
}

function setFamiliarity(
  db: DatabaseSync,
  userId: string,
  word: string,
  familiarity: number,
): void {
  const now = Date.now()
  db.prepare(
    `INSERT INTO user_planet_familiarity (user_id, word, familiarity, last_reviewed_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id, word) DO UPDATE SET
       familiarity = excluded.familiarity,
       last_reviewed_at = excluded.last_reviewed_at`,
  ).run(userId, word.toLowerCase(), familiarity, now)
}

function buildDistractorPool(db: DatabaseSync, userId: string, limit = 40): PlanetWordEntry[] {
  const libraryId = getUserLibraryId(db, userId)
  const knownRows = fetchKnownWordRows(db, userId)
  const libRows = fetchLibraryWordRows(db, libraryId, { limit: limit * 2 })
  const seen = new Set<string>()
  const pool: PlanetWordEntry[] = []
  for (const row of [...knownRows, ...libRows]) {
    const m = mapWordRow(row)
    const key = m.word.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    pool.push(rowToPlanetEntry(row))
    if (pool.length >= limit) break
  }
  return pool
}

function kingdomLevelsDone(levels: PlanetLevelConfig[], conquered: string[]): number {
  return levels.filter((l) => conquered.includes(l.id)).length
}

function isKingdomCleared(levels: PlanetLevelConfig[], conquered: string[]): boolean {
  return levels.length > 0 && levels.every((l) => conquered.includes(l.id))
}

function buildKingdomSummaries(db: DatabaseSync, conquered: string[]): PlanetKingdomSummary[] {
  let prevCleared = true
  const summaries: PlanetKingdomSummary[] = []

  for (const k of getEffectiveKingdoms(db)) {
    const levels = getKingdomLevels(k.id)
    const levelsDone = kingdomLevelsDone(levels, conquered)
    const cleared = isKingdomCleared(levels, conquered)
    let status: PlanetKingdomStatus
    if (!prevCleared) status = 'locked'
    else if (cleared) status = 'cleared'
    else status = 'current'

    summaries.push({
      id: k.id,
      order: k.order,
      name: k.name,
      subtitle: k.subtitle,
      difficulty: k.difficulty,
      theme: k.theme,
      monster: k.monster,
      status,
      levelsTotal: levels.length,
      levelsDone,
      levels: levels.map((l) => ({ ...l, done: conquered.includes(l.id) })),
    })

    prevCleared = cleared
  }

  return summaries
}

function resolveActiveKingdomId(kingdoms: PlanetKingdomSummary[]): string {
  const current = kingdoms.find((k) => k.status === 'current')
  if (current) return current.id
  const lastCleared = [...kingdoms].reverse().find((k) => k.status === 'cleared')
  return lastCleared?.id ?? kingdoms[0]?.id ?? 'kingdom-1'
}

export function buildPlanetSession(db: DatabaseSync, userId: string): PlanetSession {
  ensureFamiliarityRows(db, userId)
  const famMap = getFamiliarityMap(db, userId)
  const conquered = getConqueredLevels(db, userId)
  const knownRows = fetchKnownWordRows(db, userId)
  const joinedWords = new Set<string>()

  const soldiers: PlanetSoldier[] = knownRows.map((row) => {
    const entry = rowToPlanetEntry(row)
    joinedWords.add(entry.word.toLowerCase())
    const fam = famMap.get(entry.word.toLowerCase()) ?? 3
    return soldierFromWordRow(row, fam)
  })

  const orphanLookup = db.prepare(
    `SELECT w.* FROM words w WHERE lower(w.word) = lower(?) LIMIT 1`,
  )

  const orphanKnown = db
    .prepare(
      `SELECT word, pos FROM user_known_words
       WHERE user_id = ? ORDER BY learned_at DESC`,
    )
    .all(userId) as Array<{ word: string; pos: string }>

  for (const k of orphanKnown) {
    const key = k.word.toLowerCase()
    if (joinedWords.has(key)) continue
    joinedWords.add(key)
    const fam = famMap.get(key) ?? 3
    const wordRow = orphanLookup.get(k.word) as Record<string, unknown> | undefined
    if (wordRow) {
      soldiers.push(soldierFromWordRow(wordRow, fam))
      continue
    }
    const partOfSpeech = mapPos(k.pos)
    const syllables = estimateSyllables(k.word)
    soldiers.push({
      wordId: `known_${key}`,
      word: k.word,
      meaning: k.word,
      partOfSpeech,
      syllables,
      familiarity: fam,
    })
  }

  let armyExp = 0
  let totalPower = 0
  let dueReviewCount = 0
  for (const s of soldiers) {
    armyExp += s.familiarity
    totalPower += s.syllables * posCoefficient(s.partOfSpeech)
    if (s.familiarity <= DUE_THRESHOLD) dueReviewCount += 1
  }

  const kingdoms = buildKingdomSummaries(db, conquered)
  const activeKingdomId = resolveActiveKingdomId(kingdoms)
  const activeKingdom = kingdoms.find((k) => k.id === activeKingdomId) ?? kingdoms[0]
  const baseKingdom = getKingdom(activeKingdomId)
  const kingdomMeta = baseKingdom
    ? getEffectiveKingdomConfig(db, baseKingdom)
    : undefined

  return {
    activeKingdomId,
    kingdoms,
    kingdom: {
      id: activeKingdomId,
      name: kingdomMeta?.name ?? activeKingdom.name,
      subtitle: kingdomMeta?.subtitle ?? activeKingdom.subtitle,
    },
    levels: activeKingdom.levels,
    conqueredLevelIds: conquered,
    armySize: soldiers.length,
    armyExp,
    totalPower: Math.round(totalPower * 10) / 10,
    dueReviewCount,
    soldiers,
    distractorPool: buildDistractorPool(db, userId),
  }
}

export function buildRecruitLevel(
  db: DatabaseSync,
  userId: string,
  levelId: string,
): RecruitLevelPayload | null {
  const level = getPlanetLevel(levelId)
  if (!level || level.kind !== 'recruit') return null

  const knownSet = getKnownWordSet(db, userId)
  const libraryId = getUserLibraryId(db, userId)
  const seen = new Set<string>()
  const candidates: PlanetWordEntry[] = []

  const pushEntry = (entry: PlanetWordEntry) => {
    const key = entry.word.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    candidates.push(entry)
  }

  const unknownRows = fetchLibraryWordRows(db, libraryId, {
    excludeKnown: knownSet,
    limit: 12,
  })
  for (const row of unknownRows.slice(0, RECRUIT_WORD_COUNT)) {
    pushEntry(rowToPlanetEntry(row))
  }

  if (candidates.length < RECRUIT_WORD_COUNT) {
    const libRows = fetchLibraryWordRows(db, libraryId, { limit: RECRUIT_WORD_COUNT * 3 })
    for (const row of libRows) {
      pushEntry(rowToPlanetEntry(row))
      if (candidates.length >= RECRUIT_WORD_COUNT) break
    }
  }

  if (candidates.length < RECRUIT_WORD_COUNT) {
    for (const row of fetchKnownWordRows(db, userId)) {
      pushEntry(rowToPlanetEntry(row))
      if (candidates.length >= RECRUIT_WORD_COUNT) break
    }
  }

  return {
    level,
    candidates: candidates.slice(0, RECRUIT_WORD_COUNT),
    distractorPool: buildDistractorPool(db, userId),
  }
}

export function completeRecruitLevel(
  db: DatabaseSync,
  userId: string,
  levelId: string,
  words: string[],
): { added: number; session: PlanetSession } {
  const level = getPlanetLevel(levelId)
  if (!level || level.kind !== 'recruit') throw new Error('关卡不存在')

  const normalized = [...new Set(words.map((w) => w.trim().toLowerCase()).filter(Boolean))]
  const lookup = db.prepare('SELECT word, pos FROM words WHERE word = ? COLLATE NOCASE')
  const toAdd: Array<{ word: string; pos: string }> = []
  for (const w of normalized) {
    const row = lookup.get(w) as { word: string; pos: string } | undefined
    if (row) toAdd.push({ word: row.word, pos: row.pos })
  }

  const added = addKnownWords(db, userId, toAdd, 'planet_recruit')
  const now = Date.now()
  for (const item of toAdd) {
    setFamiliarity(db, userId, item.word, 1)
    db.prepare(
      `UPDATE user_planet_familiarity SET last_reviewed_at = ? WHERE user_id = ? AND word = ?`,
    ).run(now, userId, item.word.toLowerCase())
  }

  markLevelDone(db, userId, levelId)
  return { added, session: buildPlanetSession(db, userId) }
}

export function buildBossLevel(
  db: DatabaseSync,
  userId: string,
  levelId: string,
): BossLevelPayload | null {
  const level = getPlanetLevel(levelId)
  if (!level || level.kind !== 'boss') return null

  ensureFamiliarityRows(db, userId)
  const knownSet = getKnownWordSet(db, userId)
  const libraryId = getUserLibraryId(db, userId)
  const count = level.bossRecruitCount ?? 5

  let rewardRows = fetchLibraryWordRows(db, libraryId, {
    pos: level.bossPreferPos,
    excludeKnown: knownSet,
    limit: count,
  })
  if (rewardRows.length < count) {
    rewardRows = fetchLibraryWordRows(db, libraryId, {
      excludeKnown: knownSet,
      limit: count,
    })
  }

  const army = fetchKnownWordRows(db, userId).map(rowToPlanetEntry)

  return {
    level,
    army,
    rewardPreview: rewardRows.map(rowToPlanetEntry),
    distractorPool: buildDistractorPool(db, userId),
  }
}

export function completeBossLevel(
  db: DatabaseSync,
  userId: string,
  levelId: string,
): { added: number; session: PlanetSession } {
  const payload = buildBossLevel(db, userId, levelId)
  if (!payload) throw new Error('关卡不存在')

  const toAdd = payload.rewardPreview.map((w) => ({
    word: w.word,
    pos: w.partOfSpeech === 'other' ? 'other' : w.partOfSpeech,
  }))
  const added = addKnownWords(db, userId, toAdd, 'planet_boss')
  for (const w of payload.rewardPreview) {
    setFamiliarity(db, userId, w.word, 1)
  }

  markLevelDone(db, userId, levelId)
  return { added, session: buildPlanetSession(db, userId) }
}

export function buildReviewLevel(
  db: DatabaseSync,
  userId: string,
  levelId: string,
): ReviewLevelPayload | null {
  const level = getPlanetLevel(levelId)
  if (!level || level.kind !== 'review') return null

  ensureFamiliarityRows(db, userId)
  const famMap = getFamiliarityMap(db, userId)
  const knownRows = fetchKnownWordRows(db, userId)
  const queue: PlanetWordEntry[] = []
  const seen = new Set<string>()

  for (const row of knownRows) {
    const entry = rowToPlanetEntry(row)
    const key = entry.word.toLowerCase()
    seen.add(key)
    if ((famMap.get(key) ?? 3) <= DUE_THRESHOLD) queue.push(entry)
  }

  const orphanLookup = db.prepare(
    `SELECT w.* FROM words w WHERE lower(w.word) = lower(?) LIMIT 1`,
  )
  const orphanKnown = db
    .prepare(
      `SELECT word, pos FROM user_known_words
       WHERE user_id = ? ORDER BY learned_at DESC`,
    )
    .all(userId) as Array<{ word: string; pos: string }>

  for (const k of orphanKnown) {
    const key = k.word.toLowerCase()
    if (seen.has(key)) continue
    if ((famMap.get(key) ?? 3) > DUE_THRESHOLD) continue
    seen.add(key)
    const wordRow = orphanLookup.get(k.word) as Record<string, unknown> | undefined
    if (wordRow) {
      queue.push(rowToPlanetEntry(wordRow))
      continue
    }
    const partOfSpeech = mapPos(k.pos)
    queue.push({
      id: `known_${key}`,
      word: k.word,
      meaning: k.word,
      partOfSpeech,
      syllables: estimateSyllables(k.word),
      keySlots: buildKeySlots(k.word),
      sentence: 'I like ___.',
      sentenceZh: `我喜欢${k.word}。`,
    })
  }

  queue.sort(
    (a, b) =>
      (famMap.get(a.word.toLowerCase()) ?? 3) - (famMap.get(b.word.toLowerCase()) ?? 3),
  )

  if (queue.length < REVIEW_WORD_COUNT) {
    const inQueue = new Set(queue.map((e) => e.word.toLowerCase()))
    const reinforce = knownRows
      .map((row) => rowToPlanetEntry(row))
      .sort(
        (a, b) =>
          (famMap.get(a.word.toLowerCase()) ?? 3) - (famMap.get(b.word.toLowerCase()) ?? 3),
      )
    for (const entry of reinforce) {
      const key = entry.word.toLowerCase()
      if (inQueue.has(key)) continue
      queue.push(entry)
      inQueue.add(key)
      if (queue.length >= REVIEW_WORD_COUNT) break
    }
  }

  return {
    level,
    queue: queue.slice(0, REVIEW_WORD_COUNT),
    distractorPool: buildDistractorPool(db, userId),
  }
}

export function applyPlanetReview(
  db: DatabaseSync,
  userId: string,
  word: string,
  correct: boolean,
): { deserted: boolean; session: PlanetSession } {
  const key = word.trim().toLowerCase()
  ensureFamiliarityRows(db, userId)
  const famMap = getFamiliarityMap(db, userId)
  let fam = famMap.get(key) ?? 3

  if (correct) {
    fam = Math.min(FAMILIARITY_MAX, fam + 1)
    setFamiliarity(db, userId, key, fam)
    return { deserted: false, session: buildPlanetSession(db, userId) }
  }

  fam -= 1
  if (fam <= 0) {
    db.prepare('DELETE FROM user_known_words WHERE user_id = ? AND word = ?').run(userId, key)
    db.prepare('DELETE FROM user_planet_familiarity WHERE user_id = ? AND word = ?').run(
      userId,
      key,
    )
    return { deserted: true, session: buildPlanetSession(db, userId) }
  }

  setFamiliarity(db, userId, key, fam)
  return { deserted: false, session: buildPlanetSession(db, userId) }
}

export function completeReviewLevel(
  db: DatabaseSync,
  userId: string,
  levelId: string,
): PlanetSession {
  const level = getPlanetLevel(levelId)
  if (!level || level.kind !== 'review') throw new Error('关卡不存在')
  markLevelDone(db, userId, levelId)
  return buildPlanetSession(db, userId)
}

/** 清零指定王国的关卡征服进度（不影响词库/走散士兵等） */
export function resetKingdomProgress(
  db: DatabaseSync,
  userId: string,
  kingdomId: string,
): PlanetSession {
  const kingdom = getKingdom(kingdomId)
  if (!kingdom) throw new Error('王国不存在')

  const levelIds = getKingdomLevels(kingdomId).map((l) => l.id)
  if (levelIds.length > 0) {
    const placeholders = levelIds.map(() => '?').join(',')
    db.prepare(
      `DELETE FROM user_planet_progress WHERE user_id = ? AND level_id IN (${placeholders})`,
    ).run(userId, ...levelIds)
  }

  return buildPlanetSession(db, userId)
}
