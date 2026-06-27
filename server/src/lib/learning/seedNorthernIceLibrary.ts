import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { DatabaseSync } from 'node:sqlite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const LIBRARY_ID = 'lib-northern-icefield'
const LIBRARY_NAME = '北部冰原'
const WORD_LIST_FILE = '中考高频词.md'

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

/** 从 server/data/中考高频词.md 种子化「北部冰原」学习库（幂等） */
export function seedNorthernIceLibrary(db: DatabaseSync): void {
  const words = loadWordList()
  if (words.length === 0) return

  const lookup = db.prepare('SELECT id, word FROM words WHERE lower(word) = ?')
  const wordIds: number[] = []
  for (const word of words) {
    const row = lookup.get(word) as { id: number; word: string } | undefined
    if (row) wordIds.push(row.id)
  }
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
       VALUES (?, ?, ?, NULL, 0, ?, 1, ?)`,
    ).run(
      LIBRARY_ID,
      LIBRARY_NAME,
      '北京中考高频词学习目标库',
      maxOrder.m + 1,
      now,
    )
  } else {
    db.prepare('UPDATE learning_libraries SET name = ?, description = ? WHERE id = ?').run(
      LIBRARY_NAME,
      '北京中考高频词学习目标库',
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
