import type { DatabaseSync } from 'node:sqlite'
import { mapWordRow } from '../gameGroups.js'

export const INIT_TARGET_COUNT = 100
export const DEFAULT_INIT_TIER = 'beginner'

/** 每轮按词性抽取的数量 */
export const DRAW_COUNTS = { noun: 10, verb: 10, adj: 10 } as const
export type InitDrawPos = keyof typeof DRAW_COUNTS

/** 视为天然掌握的固定代词/功能词，初始化时自动种入我的库 */
export const FIXED_PRONOUNS = [
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'this', 'that',
  'my', 'your', 'his', 'her', 'its', 'our', 'their',
] as const

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

function normalize(word: string): string {
  return word.trim().toLowerCase()
}

export function seedFixedPronouns(db: DatabaseSync, userId: string): void {
  const now = Date.now()
  const insert = db.prepare(`
    INSERT OR IGNORE INTO user_known_words (user_id, word, pos, source, learned_at)
    VALUES (?, ?, 'pronoun', 'pronoun', ?)
  `)
  for (const word of FIXED_PRONOUNS) insert.run(userId, word, now)
}

export function getKnownCount(db: DatabaseSync, userId: string): number {
  const row = db
    .prepare('SELECT COUNT(*) AS count FROM user_known_words WHERE user_id = ?')
    .get(userId) as { count: number }
  return row?.count ?? 0
}

export function getKnownWordSet(db: DatabaseSync, userId: string): Set<string> {
  const rows = db
    .prepare('SELECT word FROM user_known_words WHERE user_id = ?')
    .all(userId) as Array<{ word: string }>
  return new Set(rows.map((r) => normalize(r.word)))
}

export function listKnownWords(db: DatabaseSync, userId: string): KnownWord[] {
  const rows = db
    .prepare(
      `SELECT k.word, k.pos, k.source, k.learned_at,
              COALESCE(w.meaning_zh, '') AS meaning_zh
       FROM user_known_words k
       LEFT JOIN words w ON LOWER(w.word) = LOWER(k.word)
       WHERE k.user_id = ?
       ORDER BY k.learned_at DESC, k.word`,
    )
    .all(userId) as Array<{
      word: string
      pos: string
      source: string
      learned_at: number
      meaning_zh: string
    }>
  return rows.map((r) => ({
    word: r.word,
    pos: r.pos,
    source: r.source,
    learnedAt: r.learned_at,
    meaningZh: r.meaning_zh.trim() || undefined,
  }))
}

export function isInitComplete(db: DatabaseSync, userId: string): boolean {
  return getKnownCount(db, userId) >= INIT_TARGET_COUNT
}

function tierWordCount(db: DatabaseSync, tier: string): number {
  const row = db
    .prepare('SELECT COUNT(*) AS count FROM words WHERE tier_id = ?')
    .get(tier) as { count: number }
  return row?.count ?? 0
}

export function getInitStatus(db: DatabaseSync, userId: string, tier: string): InitStatus {
  seedFixedPronouns(db, userId)
  const knownCount = getKnownCount(db, userId)
  return {
    tier,
    initialized: knownCount >= INIT_TARGET_COUNT,
    knownCount,
    targetCount: INIT_TARGET_COUNT,
    tierWordCount: tierWordCount(db, tier),
  }
}

function drawForPos(
  db: DatabaseSync,
  userId: string,
  tier: string,
  pos: InitDrawPos,
  limit: number,
): InitWord[] {
  const rows = db
    .prepare(
      `SELECT w.* FROM words w
       WHERE w.tier_id = ? AND w.pos = ?
         AND NOT EXISTS (
           SELECT 1 FROM user_known_words k WHERE k.user_id = ? AND k.word = w.word
         )
       ORDER BY RANDOM() LIMIT ?`,
    )
    .all(tier, pos, userId, limit) as Array<Record<string, unknown>>
  return rows.map((row) => {
    const m = mapWordRow(row)
    return {
      id: m.id,
      word: m.word,
      phonetic: m.phonetic,
      pos: m.pos,
      posLabel: m.posLabel,
      meaningZh: m.meaningZh,
      exampleEn: m.exampleEn,
      exampleZh: m.exampleZh,
    }
  })
}

export function drawInitWords(
  db: DatabaseSync,
  userId: string,
  tier: string,
): { words: InitWord[]; status: InitStatus } {
  seedFixedPronouns(db, userId)
  const status = getInitStatus(db, userId, tier)
  if (status.initialized) return { words: [], status }

  const words: InitWord[] = []
  for (const [pos, count] of Object.entries(DRAW_COUNTS) as Array<[InitDrawPos, number]>) {
    words.push(...drawForPos(db, userId, tier, pos, count))
  }
  return { words, status }
}

export function keepInitWords(
  db: DatabaseSync,
  userId: string,
  tier: string,
  words: string[],
): { added: number; skipped: number; status: InitStatus } {
  const now = Date.now()
  const normalized = [...new Set(words.map(normalize).filter(Boolean))]
  const lookup = db.prepare('SELECT word, pos FROM words WHERE tier_id = ? AND word = ?')
  const insert = db.prepare(`
    INSERT OR IGNORE INTO user_known_words (user_id, word, pos, source, learned_at)
    VALUES (?, ?, ?, 'init', ?)
  `)

  let added = 0
  let skipped = 0
  for (const word of normalized) {
    const row = lookup.get(tier, word) as { word: string; pos: string } | undefined
    if (!row) {
      skipped += 1
      continue
    }
    const result = insert.run(userId, row.word, row.pos, now)
    if (result.changes > 0) added += 1
    else skipped += 1
  }

  const status = getInitStatus(db, userId, tier)
  if (status.initialized) markInitDone(db, userId)
  return { added, skipped, status }
}

/** 把一批单词纳入我的库（小节测评通过时调用） */
export function addKnownWords(
  db: DatabaseSync,
  userId: string,
  words: Array<{ word: string; pos?: string }>,
  source = 'section_pass',
): number {
  const now = Date.now()
  const insert = db.prepare(`
    INSERT OR IGNORE INTO user_known_words (user_id, word, pos, source, learned_at)
    VALUES (?, ?, ?, ?, ?)
  `)
  let added = 0
  for (const item of words) {
    const result = insert.run(userId, normalize(item.word), item.pos ?? 'other', source, now)
    if (result.changes > 0) added += 1
  }
  return added
}

export function markInitDone(db: DatabaseSync, userId: string): void {
  const now = Date.now()
  db.prepare(
    `INSERT INTO user_profiles (user_id, init_done, updated_at)
     VALUES (?, 1, ?)
     ON CONFLICT(user_id) DO UPDATE SET init_done = 1, updated_at = excluded.updated_at`,
  ).run(userId, now)
}
