import { randomBytes } from 'node:crypto'
import type { DatabaseSync } from 'node:sqlite'
import { mapWordRow } from '../gameGroups.js'
import { getCurrentLibraryId } from './profiles.js'

export const SET_TARGET_SIZE = 100
export const SECTION_TARGET_SIZE = 15
export const MAX_SECTIONS = 10

export interface SectionView {
  id: string
  seq: number
  status: 'locked' | 'learning' | 'passed'
  wordCount: number
  masteredCount: number
  passedAt: number | null
}

export interface SetView {
  id: string
  libraryId: string
  libraryName: string
  size: number
  sectionCount: number
  status: 'active' | 'completed'
  createdAt: number
  sections: SectionView[]
}

export interface SectionWordView {
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

function newId(prefix: string): string {
  return `${prefix}-${randomBytes(10).toString('hex')}`
}

/** 计算小节数：目标每节 15 词，落在 1-10 之间 */
function computeSectionCount(size: number): number {
  return Math.min(MAX_SECTIONS, Math.max(1, Math.ceil(size / SECTION_TARGET_SIZE)))
}

function pickUnknownWords(
  db: DatabaseSync,
  userId: string,
  libraryId: string,
  size: number,
): Array<Record<string, unknown>> {
  return db
    .prepare(
      `SELECT w.* FROM library_words lw
       INNER JOIN words w ON w.id = lw.word_id
       WHERE lw.library_id = ?
         AND NOT EXISTS (
           SELECT 1 FROM user_known_words k WHERE k.user_id = ? AND k.word = w.word
         )
       ORDER BY
         CASE w.freq_level WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END,
         lw.sort_order, w.id
       LIMIT ?`,
    )
    .all(libraryId, userId, size) as Array<Record<string, unknown>>
}

export function getActiveSet(db: DatabaseSync, userId: string): SetView | null {
  const set = db
    .prepare(
      "SELECT * FROM learning_sets WHERE user_id = ? AND status = 'active' ORDER BY created_at DESC LIMIT 1",
    )
    .get(userId) as Record<string, unknown> | undefined
  if (!set) return null
  return buildSetView(db, set)
}

function buildSetView(db: DatabaseSync, set: Record<string, unknown>): SetView {
  const setId = String(set.id)
  const lib = db
    .prepare('SELECT name FROM learning_libraries WHERE id = ?')
    .get(String(set.library_id)) as { name: string } | undefined

  const sections = db
    .prepare(
      `SELECT s.id, s.seq, s.status, s.passed_at,
              COUNT(sw.word_id) AS word_count,
              SUM(CASE WHEN sw.familiarity >= 4 THEN 1 ELSE 0 END) AS mastered_count
       FROM learning_sections s
       LEFT JOIN section_words sw ON sw.section_id = s.id
       WHERE s.set_id = ?
       GROUP BY s.id
       ORDER BY s.seq`,
    )
    .all(setId) as Array<{
    id: string
    seq: number
    status: SectionView['status']
    passed_at: number | null
    word_count: number
    mastered_count: number
  }>

  return {
    id: setId,
    libraryId: String(set.library_id),
    libraryName: lib?.name ?? '',
    size: Number(set.size),
    sectionCount: Number(set.section_count),
    status: String(set.status) as SetView['status'],
    createdAt: Number(set.created_at),
    sections: sections.map((s) => ({
      id: s.id,
      seq: s.seq,
      status: s.status,
      wordCount: s.word_count,
      masteredCount: s.mastered_count ?? 0,
      passedAt: s.passed_at,
    })),
  }
}

export function createLearningSet(
  db: DatabaseSync,
  userId: string,
  options: { libraryId?: string; size?: number } = {},
): SetView {
  const existing = getActiveSet(db, userId)
  if (existing) throw new Error('已有进行中的学习集，请先完成或放弃当前学习集')

  const libraryId = options.libraryId ?? getCurrentLibraryId(db, userId)
  if (!libraryId) throw new Error('请先选择一个学习库作为学习目标')

  const lib = db
    .prepare('SELECT id FROM learning_libraries WHERE id = ? AND is_active = 1')
    .get(libraryId) as { id: string } | undefined
  if (!lib) throw new Error('学习库不存在或已下架')

  const targetSize = Math.min(SET_TARGET_SIZE, Math.max(1, options.size ?? SET_TARGET_SIZE))
  const words = pickUnknownWords(db, userId, libraryId, targetSize)
  if (words.length === 0) throw new Error('该学习库的单词你都已掌握，换个学习库试试吧')

  const size = words.length
  const sectionCount = computeSectionCount(size)
  const now = Date.now()
  const setId = newId('set')

  db.prepare(
    `INSERT INTO learning_sets (id, user_id, library_id, size, section_count, status, created_at)
     VALUES (?, ?, ?, ?, ?, 'active', ?)`,
  ).run(setId, userId, libraryId, size, sectionCount, now)

  const insertSection = db.prepare(
    `INSERT INTO learning_sections (id, set_id, user_id, seq, status)
     VALUES (?, ?, ?, ?, ?)`,
  )
  const insertSectionWord = db.prepare(
    'INSERT INTO section_words (section_id, word_id, word, familiarity) VALUES (?, ?, ?, 0)',
  )

  const base = Math.floor(size / sectionCount)
  const remainder = size % sectionCount
  let cursor = 0
  for (let i = 0; i < sectionCount; i += 1) {
    const count = base + (i < remainder ? 1 : 0)
    const sectionId = newId('sec')
    insertSection.run(sectionId, setId, userId, i + 1, i === 0 ? 'learning' : 'locked')
    for (let j = 0; j < count; j += 1) {
      const row = mapWordRow(words[cursor])
      insertSectionWord.run(sectionId, row.id, row.word)
      cursor += 1
    }
  }

  return buildSetView(db, db.prepare('SELECT * FROM learning_sets WHERE id = ?').get(setId) as Record<string, unknown>)
}

export function abandonActiveSet(db: DatabaseSync, userId: string): void {
  const set = getActiveSet(db, userId)
  if (!set) return
  db.prepare('DELETE FROM learning_sets WHERE id = ?').run(set.id)
}

export interface SectionDetail {
  id: string
  seq: number
  status: SectionView['status']
  setId: string
  words: SectionWordView[]
}

export function getSectionDetail(
  db: DatabaseSync,
  userId: string,
  sectionId: string,
): SectionDetail | null {
  const section = db
    .prepare('SELECT * FROM learning_sections WHERE id = ? AND user_id = ?')
    .get(sectionId, userId) as Record<string, unknown> | undefined
  if (!section) return null

  const words = db
    .prepare(
      `SELECT w.*, sw.familiarity FROM section_words sw
       INNER JOIN words w ON w.id = sw.word_id
       WHERE sw.section_id = ?
       ORDER BY w.sort_order, w.id`,
    )
    .all(sectionId) as Array<Record<string, unknown>>

  return {
    id: String(section.id),
    seq: Number(section.seq),
    status: String(section.status) as SectionView['status'],
    setId: String(section.set_id),
    words: words.map((row) => {
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
        familiarity: Number(row.familiarity ?? 0),
      }
    }),
  }
}

export function updateSectionFamiliarity(
  db: DatabaseSync,
  userId: string,
  sectionId: string,
  word: string,
  familiarity: number,
): void {
  const section = db
    .prepare('SELECT id FROM learning_sections WHERE id = ? AND user_id = ?')
    .get(sectionId, userId) as { id: string } | undefined
  if (!section) throw new Error('小节不存在')
  const value = Math.max(0, Math.min(5, Math.round(familiarity)))
  db.prepare(
    'UPDATE section_words SET familiarity = ? WHERE section_id = ? AND LOWER(word) = LOWER(?)',
  ).run(value, sectionId, word)
}
