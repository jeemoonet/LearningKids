import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { DatabaseSync } from 'node:sqlite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const LIBRARY_ID = 'lib-new-concept-1'
const LIBRARY_NAME = '新概念英语1'
const TIER_ID = 'nce1'
const WORD_LIST_FILE = '新概念英语1.md'

function parseWordList(text: string): string[] {
  return text
    .trim()
    .replace(/;$/, '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
}

function loadWordList(): string[] {
  const filePath = path.resolve(__dirname, '../../../data', WORD_LIST_FILE)
  if (!fs.existsSync(filePath)) return []
  return parseWordList(fs.readFileSync(filePath, 'utf8'))
}

function ensureTier(db: DatabaseSync, wordCount: number): void {
  const existing = db.prepare('SELECT id FROM tiers WHERE id = ?').get(TIER_ID) as { id: string } | undefined
  if (existing) {
    db.prepare('UPDATE tiers SET word_count = ? WHERE id = ?').run(wordCount, TIER_ID)
    return
  }
  db.prepare(
    'INSERT INTO tiers (id, label, word_count, group_count, group_size) VALUES (?, ?, ?, 0, 20)',
  ).run(TIER_ID, '新概念英语1', wordCount)
}

function ensureWord(db: DatabaseSync, word: string, sortOrder: number): number | null {
  const existing = db.prepare('SELECT id FROM words WHERE lower(word) = ?').get(word) as
    | { id: number }
    | undefined
  if (existing) return existing.id

  db.exec('PRAGMA foreign_keys = OFF')
  try {
    const result = db
      .prepare(
        `INSERT OR IGNORE INTO words (
          word, phonetic, pos, pos_label, meaning_zh,
          example_en, example_zh, tier_id, group_id, sort_order
        ) VALUES (?, NULL, 'other', '其他', '', '', NULL, ?, 1, ?)`,
      )
      .run(word, TIER_ID, sortOrder)

    if (result.changes > 0) return Number(result.lastInsertRowid)
  } finally {
    db.exec('PRAGMA foreign_keys = ON')
  }

  const row = db.prepare('SELECT id FROM words WHERE lower(word) = ?').get(word) as
    | { id: number }
    | undefined
  return row?.id ?? null
}

/** 从 server/data/新概念英语1.md 种子化「新概念英语1」学习库（幂等） */
export function seedNewConcept1Library(db: DatabaseSync): void {
  const words = loadWordList()
  if (words.length === 0) return

  ensureTier(db, words.length)

  const wordIds: number[] = []
  words.forEach((word, index) => {
    const id = ensureWord(db, word, index)
    if (id) wordIds.push(id)
  })
  if (wordIds.length === 0) return

  const existing = db
    .prepare('SELECT id FROM learning_libraries WHERE id = ?')
    .get(LIBRARY_ID) as { id: string } | undefined

  const now = Date.now()
  if (!existing) {
    const maxOrder = db
      .prepare('SELECT COALESCE(MAX(sort_order), 0) AS m FROM learning_libraries')
      .get() as { m: number }
    db.prepare(
      `INSERT INTO learning_libraries (id, name, description, source_tier, word_count, sort_order, is_active, created_at)
       VALUES (?, ?, ?, ?, 0, ?, 1, ?)`,
    ).run(
      LIBRARY_ID,
      LIBRARY_NAME,
      '新东方在线新概念英语1词汇表（799词）',
      TIER_ID,
      maxOrder.m + 1,
      now,
    )
  } else {
    db.prepare('UPDATE learning_libraries SET name = ?, description = ?, source_tier = ? WHERE id = ?').run(
      LIBRARY_NAME,
      '新东方在线新概念英语1词汇表（799词）',
      TIER_ID,
      LIBRARY_ID,
    )
  }

  db.prepare('DELETE FROM library_words WHERE library_id = ?').run(LIBRARY_ID)
  const insert = db.prepare(
    'INSERT OR IGNORE INTO library_words (library_id, word_id, sort_order) VALUES (?, ?, ?)',
  )
  wordIds.forEach((wordId, index) => insert.run(LIBRARY_ID, wordId, index))
  db.prepare('UPDATE learning_libraries SET word_count = ? WHERE id = ?').run(wordIds.length, LIBRARY_ID)
}
