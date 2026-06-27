import { randomBytes } from 'node:crypto'
import type { DatabaseSync } from 'node:sqlite'
import { mapWordRow } from '../gameGroups.js'
import { getKnownWordSet } from './knownWords.js'

export interface LibraryView {
  id: string
  name: string
  description: string
  sourceTier: string | null
  wordCount: number
  sortOrder: number
  isActive: boolean
}

function mapLibrary(row: Record<string, unknown>): LibraryView {
  return {
    id: String(row.id),
    name: String(row.name ?? ''),
    description: String(row.description ?? ''),
    sourceTier: row.source_tier ? String(row.source_tier) : null,
    wordCount: Number(row.word_count ?? 0),
    sortOrder: Number(row.sort_order ?? 0),
    isActive: Number(row.is_active ?? 1) === 1,
  }
}

export function listLibraries(db: DatabaseSync, includeInactive = false): LibraryView[] {
  const sql = includeInactive
    ? 'SELECT * FROM learning_libraries ORDER BY sort_order, created_at'
    : 'SELECT * FROM learning_libraries WHERE is_active = 1 ORDER BY sort_order, created_at'
  return (db.prepare(sql).all() as Array<Record<string, unknown>>).map(mapLibrary)
}

export function getLibrary(db: DatabaseSync, id: string): LibraryView | null {
  const row = db.prepare('SELECT * FROM learning_libraries WHERE id = ?').get(id) as
    | Record<string, unknown>
    | undefined
  return row ? mapLibrary(row) : null
}

/** 学习库内单词（带是否已掌握标记） */
export function getLibraryWords(db: DatabaseSync, libraryId: string, userId: string | null) {
  const rows = db
    .prepare(
      `SELECT w.* FROM library_words lw
       INNER JOIN words w ON w.id = lw.word_id
       WHERE lw.library_id = ?
       ORDER BY lw.sort_order, w.id`,
    )
    .all(libraryId) as Array<Record<string, unknown>>

  const known = userId ? getKnownWordSet(db, userId) : new Set<string>()
  return rows.map((row) => {
    const m = mapWordRow(row)
    return { ...m, known: known.has(m.word.trim().toLowerCase()) }
  })
}

function refreshWordCount(db: DatabaseSync, libraryId: string): void {
  const row = db
    .prepare('SELECT COUNT(*) AS count FROM library_words WHERE library_id = ?')
    .get(libraryId) as { count: number }
  db.prepare('UPDATE learning_libraries SET word_count = ? WHERE id = ?').run(row.count, libraryId)
}

export function createLibrary(
  db: DatabaseSync,
  input: { name: string; description?: string; sourceTier?: string | null },
): LibraryView {
  const name = input.name?.trim()
  if (!name) throw new Error('请填写学习库名称')
  const id = `lib-${randomBytes(8).toString('hex')}`
  const maxOrder = db
    .prepare('SELECT COALESCE(MAX(sort_order), 0) AS m FROM learning_libraries')
    .get() as { m: number }
  db.prepare(
    `INSERT INTO learning_libraries (id, name, description, source_tier, word_count, sort_order, is_active, created_at)
     VALUES (?, ?, ?, ?, 0, ?, 1, ?)`,
  ).run(id, name, input.description?.trim() ?? '', input.sourceTier ?? null, maxOrder.m + 1, Date.now())
  return getLibrary(db, id)!
}

export function updateLibrary(
  db: DatabaseSync,
  id: string,
  patch: { name?: string; description?: string; sourceTier?: string | null; isActive?: boolean },
): LibraryView {
  const lib = getLibrary(db, id)
  if (!lib) throw new Error('学习库不存在')
  db.prepare(
    `UPDATE learning_libraries SET
       name = ?, description = ?, source_tier = ?, is_active = ?
     WHERE id = ?`,
  ).run(
    patch.name?.trim() ?? lib.name,
    patch.description?.trim() ?? lib.description,
    patch.sourceTier === undefined ? lib.sourceTier : patch.sourceTier,
    patch.isActive === undefined ? (lib.isActive ? 1 : 0) : patch.isActive ? 1 : 0,
    id,
  )
  return getLibrary(db, id)!
}

export function deleteLibrary(db: DatabaseSync, id: string): void {
  db.prepare('DELETE FROM learning_libraries WHERE id = ?').run(id)
}

export function setLibraryWords(db: DatabaseSync, libraryId: string, wordIds: number[]): number {
  if (!getLibrary(db, libraryId)) throw new Error('学习库不存在')
  db.prepare('DELETE FROM library_words WHERE library_id = ?').run(libraryId)
  const insert = db.prepare(
    'INSERT OR IGNORE INTO library_words (library_id, word_id, sort_order) VALUES (?, ?, ?)',
  )
  const unique = [...new Set(wordIds)]
  unique.forEach((wordId, index) => insert.run(libraryId, wordId, index))
  refreshWordCount(db, libraryId)
  return unique.length
}

export function importWordsFromTier(
  db: DatabaseSync,
  libraryId: string,
  tier: string,
  limit?: number,
): number {
  if (!getLibrary(db, libraryId)) throw new Error('学习库不存在')
  const rows = (
    limit && limit > 0
      ? (db
          .prepare('SELECT id FROM words WHERE tier_id = ? ORDER BY sort_order, id LIMIT ?')
          .all(tier, limit) as Array<{ id: number }>)
      : (db
          .prepare('SELECT id FROM words WHERE tier_id = ? ORDER BY sort_order, id')
          .all(tier) as Array<{ id: number }>)
  ).map((r) => r.id)
  return setLibraryWords(db, libraryId, rows)
}
