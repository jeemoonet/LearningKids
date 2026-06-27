import type { DatabaseSync } from 'node:sqlite'
import { mapWordRow } from './gameGroups.js'

export const INIT_TARGET_COUNT = 100
export const DEFAULT_INIT_TIER = 'beginner'

export const DRAW_COUNTS = {
  noun: 10,
  verb: 10,
  adj: 10,
} as const

export type InitDrawPos = keyof typeof DRAW_COUNTS

export const FIXED_PRONOUNS = [
  'i',
  'you',
  'he',
  'she',
  'it',
  'we',
  'they',
  'this',
  'that',
  'my',
  'your',
  'his',
  'her',
  'its',
  'our',
  'their',
] as const

export interface InitStatus {
  tierId: string
  initialized: boolean
  knownCount: number
  targetCount: number
  tierWordCount: number
  score: number
  pronounCount: number
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

function getTierWordCount(db: DatabaseSync, tierId: string): number {
  const row = db
    .prepare('SELECT COUNT(*) AS count FROM words WHERE tier_id = ?')
    .get(tierId) as { count: number }
  return row?.count ?? 0
}

export function getKnownCount(db: DatabaseSync, userId: string): number {
  const row = db
    .prepare('SELECT COUNT(*) AS count FROM fv_known_words WHERE user_id = ?')
    .get(userId) as { count: number }
  return row?.count ?? 0
}

export function isInitComplete(db: DatabaseSync, userId: string): boolean {
  return getKnownCount(db, userId) >= INIT_TARGET_COUNT
}

export function seedFixedPronouns(db: DatabaseSync, userId: string): number {
  const now = Date.now()
  const insert = db.prepare(`
    INSERT OR IGNORE INTO fv_known_words (user_id, word, pos, source, learned_at)
    VALUES (?, ?, 'pronoun', 'pronoun', ?)
  `)

  let inserted = 0
  for (const word of FIXED_PRONOUNS) {
    const result = insert.run(userId, word, now)
    if (result.changes > 0) inserted += 1
  }
  return inserted
}

export function getInitStatus(db: DatabaseSync, userId: string, tierId: string): InitStatus {
  seedFixedPronouns(db, userId)

  const knownCount = getKnownCount(db, userId)
  const tierWordCount = getTierWordCount(db, tierId)
  const pronounRow = db
    .prepare(
      "SELECT COUNT(*) AS count FROM fv_known_words WHERE user_id = ? AND source = 'pronoun'",
    )
    .get(userId) as { count: number }

  return {
    tierId,
    initialized: knownCount >= INIT_TARGET_COUNT,
    knownCount,
    targetCount: INIT_TARGET_COUNT,
    tierWordCount,
    score: tierWordCount > 0 ? Math.round((knownCount / tierWordCount) * 100) : 0,
    pronounCount: pronounRow?.count ?? 0,
  }
}

function drawWordsForPos(
  db: DatabaseSync,
  userId: string,
  tierId: string,
  pos: InitDrawPos,
  limit: number,
): InitWord[] {
  const rows = db
    .prepare(
      `
      SELECT w.*
      FROM words w
      WHERE w.tier_id = ?
        AND w.pos = ?
        AND NOT EXISTS (
          SELECT 1 FROM fv_known_words k
          WHERE k.user_id = ? AND k.word = w.word
        )
      ORDER BY RANDOM()
      LIMIT ?
      `,
    )
    .all(tierId, pos, userId, limit) as Array<Record<string, unknown>>

  return rows.map((row) => {
    const mapped = mapWordRow(row)
    return {
      id: mapped.id,
      word: mapped.word,
      phonetic: mapped.phonetic,
      pos: mapped.pos,
      posLabel: mapped.posLabel,
      meaningZh: mapped.meaningZh,
      exampleEn: mapped.exampleEn,
      exampleZh: mapped.exampleZh,
    }
  })
}

export function drawInitWords(
  db: DatabaseSync,
  userId: string,
  tierId: string,
): { words: InitWord[]; status: InitStatus } {
  seedFixedPronouns(db, userId)

  const status = getInitStatus(db, userId, tierId)
  if (status.initialized) {
    return { words: [], status }
  }

  const words: InitWord[] = []
  for (const [pos, count] of Object.entries(DRAW_COUNTS) as Array<[InitDrawPos, number]>) {
    words.push(...drawWordsForPos(db, userId, tierId, pos, count))
  }

  return { words, status }
}

export function keepInitWords(
  db: DatabaseSync,
  userId: string,
  tierId: string,
  words: string[],
): { added: number; skipped: number; status: InitStatus } {
  const now = Date.now()
  const normalized = [...new Set(words.map((word) => word.trim().toLowerCase()).filter(Boolean))]

  const lookup = db.prepare(
    `
    SELECT word, pos
    FROM words
    WHERE tier_id = ? AND word = ?
    `,
  )
  const insert = db.prepare(`
    INSERT OR IGNORE INTO fv_known_words (user_id, word, pos, source, learned_at)
    VALUES (?, ?, ?, 'init', ?)
  `)

  let added = 0
  let skipped = 0

  for (const word of normalized) {
    const row = lookup.get(tierId, word) as { word: string; pos: string } | undefined
    if (!row) {
      skipped += 1
      continue
    }
    const result = insert.run(userId, row.word, row.pos, now)
    if (result.changes > 0) added += 1
    else skipped += 1
  }

  return {
    added,
    skipped,
    status: getInitStatus(db, userId, tierId),
  }
}
