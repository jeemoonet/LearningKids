import { Hono } from 'hono'
import type { AuthUser } from '../auth.js'
import { requireAuth } from '../auth.js'
import { getDb } from '../db.js'
import type { DatabaseSync } from 'node:sqlite'

type AppEnv = { Variables: { user: AuthUser } }

export const progressRoutes = new Hono<AppEnv>()

progressRoutes.use('*', requireAuth)

progressRoutes.get('/', (c) => {
  const userId = c.get('user').id
  const rows = getDb()
    .prepare(
      `
      SELECT word, familiarity, exam_count, exam_error_count, last_exam_at,
             consecutive_correct, self_marked, last_seen, next_due
      FROM user_word_progress
      WHERE user_id = ?
      `,
    )
    .all(userId) as Array<Record<string, unknown>>

  return c.json({
    progress: rows.map(mapProgressRow),
  })
})

progressRoutes.put('/:word', async (c) => {
  const userId = c.get('user').id
  const word = decodeURIComponent(c.req.param('word')).trim().toLowerCase()
  if (!word) return c.json({ error: '无效的 word' }, 400)

  const body = await c.req.json<Record<string, unknown>>()
  const now = Date.now()

  getDb()
    .prepare(
      `
      INSERT INTO user_word_progress (
        user_id, word, familiarity, exam_count, exam_error_count, last_exam_at,
        consecutive_correct, self_marked, last_seen, next_due, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, word) DO UPDATE SET
        familiarity = excluded.familiarity,
        exam_count = excluded.exam_count,
        exam_error_count = excluded.exam_error_count,
        last_exam_at = excluded.last_exam_at,
        consecutive_correct = excluded.consecutive_correct,
        self_marked = excluded.self_marked,
        last_seen = excluded.last_seen,
        next_due = excluded.next_due,
        updated_at = excluded.updated_at
      `,
    )
    .run(
      userId,
      word,
      clampFamiliarity(Number(body.familiarity ?? 1)),
      Number(body.examCount ?? 0),
      Number(body.examErrorCount ?? 0),
      body.lastExamAt == null ? null : Number(body.lastExamAt),
      Number(body.consecutiveCorrect ?? 0),
      Number(body.selfMarked ?? 0),
      Number(body.lastSeen ?? 0),
      Number(body.nextDue ?? 0),
      now,
    )

  return c.json({ ok: true })
})

progressRoutes.get('/groups', (c) => {
  const userId = c.get('user').id
  const rows = getDb()
    .prepare('SELECT tier_id, group_index FROM user_group_completion WHERE user_id = ?')
    .all(userId) as Array<{ tier_id: string; group_index: number }>

  return c.json({
    completed: rows.map((row) => `${row.tier_id}:${row.group_index}`),
  })
})

progressRoutes.post('/groups', async (c) => {
  const userId = c.get('user').id
  const body = await c.req.json<{ tierId?: string; groupIndex?: number }>()
  const tierId = body.tierId
  const groupIndex = Number(body.groupIndex)

  if (!tierId || !groupIndex) {
    return c.json({ error: '缺少 tierId 或 groupIndex' }, 400)
  }

  getDb()
    .prepare(
      `
      INSERT INTO user_group_completion (user_id, tier_id, group_index, completed_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id, tier_id, group_index) DO UPDATE SET completed_at = excluded.completed_at
      `,
    )
    .run(userId, tierId, groupIndex, Date.now())

  return c.json({ ok: true })
})

progressRoutes.post('/tier-groups', async (c) => {
  const userId = c.get('user').id
  const body = await c.req.json<{
    tierId?: string
    groups?: Array<{ groupIndex?: number; wordIds?: number[] }>
  }>()
  const tierId = body.tierId
  const groups = body.groups ?? []

  if (!tierId) return c.json({ error: '缺少 tierId' }, 400)

  const db = getDb()
  const now = Date.now()

  const deleteAssignments = db.prepare(
    'DELETE FROM user_word_assignments WHERE user_id = ? AND tier_id = ?',
  )
  const deleteTierGroups = db.prepare(
    'DELETE FROM user_tier_groups WHERE user_id = ? AND tier_id = ?',
  )
  const deleteCompletion = db.prepare(
    'DELETE FROM user_group_completion WHERE user_id = ? AND tier_id = ?',
  )
  const insertGroup = db.prepare(
    'INSERT INTO user_tier_groups (user_id, tier_id, group_index, title, created_at) VALUES (?, ?, ?, ?, ?)',
  )
  const insertAssignment = db.prepare(
    'INSERT INTO user_word_assignments (user_id, word_id, tier_id, group_index) VALUES (?, ?, ?, ?)',
  )

  db.exec('BEGIN IMMEDIATE')
  try {
    deleteAssignments.run(userId, tierId)
    deleteTierGroups.run(userId, tierId)
    deleteCompletion.run(userId, tierId)

    let totalWords = 0
    for (const group of groups) {
      const groupIndex = Number(group.groupIndex)
      const wordIds = group.wordIds ?? []
      if (!groupIndex || wordIds.length === 0) continue

      insertGroup.run(userId, tierId, groupIndex, `待学第 ${groupIndex} 组`, now)
      for (const wordId of wordIds) {
        const id = Number(wordId)
        if (!id) continue
        insertAssignment.run(userId, id, tierId, groupIndex)
        totalWords += 1
      }
    }

    db.exec('COMMIT')
    return c.json({ ok: true, groupCount: groups.length, wordCount: totalWords })
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }
})

progressRoutes.post('/batch', async (c) => {
  const userId = c.get('user').id
  const body = await c.req.json<{ progress?: Array<Record<string, unknown>> }>()
  const items = body.progress ?? []
  if (items.length === 0) return c.json({ ok: true, updated: 0 })

  const db = getDb()
  const stmt = db.prepare(
    `
    INSERT INTO user_word_progress (
      user_id, word, familiarity, exam_count, exam_error_count, last_exam_at,
      consecutive_correct, self_marked, last_seen, next_due, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, word) DO UPDATE SET
      familiarity = excluded.familiarity,
      exam_count = excluded.exam_count,
      exam_error_count = excluded.exam_error_count,
      last_exam_at = excluded.last_exam_at,
      consecutive_correct = excluded.consecutive_correct,
      self_marked = excluded.self_marked,
      last_seen = excluded.last_seen,
      next_due = excluded.next_due,
      updated_at = excluded.updated_at
    `,
  )

  const now = Date.now()
  let updated = 0
  db.exec('BEGIN IMMEDIATE')
  try {
    for (const item of items) {
      const word = resolveProgressWord(db, item)
      if (!word) continue
      stmt.run(
        userId,
        word,
        clampFamiliarity(Number(item.familiarity ?? 1)),
        Number(item.examCount ?? 0),
        Number(item.examErrorCount ?? 0),
        item.lastExamAt == null ? null : Number(item.lastExamAt),
        Number(item.consecutiveCorrect ?? 0),
        Number(item.selfMarked ?? 0),
        Number(item.lastSeen ?? 0),
        Number(item.nextDue ?? 0),
        now,
      )
      updated += 1
    }
    db.exec('COMMIT')
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }

  return c.json({ ok: true, updated })
})

progressRoutes.post('/import-local', async (c) => {
  const userId = c.get('user').id
  const body = await c.req.json<{ progress?: Array<Record<string, unknown>> }>()
  const items = body.progress ?? []
  if (items.length === 0) return c.json({ ok: true, imported: 0 })

  const db = getDb()
  const stmt = db.prepare(
    `
    INSERT INTO user_word_progress (
      user_id, word, familiarity, exam_count, exam_error_count, last_exam_at,
      consecutive_correct, self_marked, last_seen, next_due, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, word) DO UPDATE SET
      familiarity = MAX(user_word_progress.familiarity, excluded.familiarity),
      exam_count = MAX(user_word_progress.exam_count, excluded.exam_count),
      exam_error_count = MAX(user_word_progress.exam_error_count, excluded.exam_error_count),
      last_exam_at = COALESCE(excluded.last_exam_at, user_word_progress.last_exam_at),
      consecutive_correct = MAX(user_word_progress.consecutive_correct, excluded.consecutive_correct),
      self_marked = MAX(user_word_progress.self_marked, excluded.self_marked),
      last_seen = MAX(user_word_progress.last_seen, excluded.last_seen),
      next_due = excluded.next_due,
      updated_at = excluded.updated_at
    `,
  )

  const now = Date.now()
  let imported = 0
  db.exec('BEGIN IMMEDIATE')
  try {
    for (const item of items) {
      const word = resolveProgressWord(db, item)
      if (!word) continue
      stmt.run(
        userId,
        word,
        clampFamiliarity(Number(item.familiarity ?? 1)),
        Number(item.examCount ?? 0),
        Number(item.examErrorCount ?? 0),
        item.lastExamAt == null ? null : Number(item.lastExamAt),
        Number(item.consecutiveCorrect ?? 0),
        Number(item.selfMarked ?? 0),
        Number(item.lastSeen ?? 0),
        Number(item.nextDue ?? 0),
        now,
      )
      imported += 1
    }
    db.exec('COMMIT')
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }

  return c.json({ ok: true, imported })
})

function clampFamiliarity(value: number): number {
  return Math.min(5, Math.max(1, Math.round(value)))
}

function resolveProgressWord(db: DatabaseSync, item: Record<string, unknown>): string | null {
  if (typeof item.word === 'string' && item.word.trim()) {
    return item.word.trim().toLowerCase()
  }

  const wordId = Number(item.wordId)
  if (!wordId) return null

  const row = db.prepare('SELECT word FROM words WHERE id = ?').get(wordId) as
    | { word: string }
    | undefined
  return row?.word?.trim().toLowerCase() ?? null
}

function mapProgressRow(row: Record<string, unknown>) {
  return {
    word: String(row.word),
    familiarity: Number(row.familiarity),
    examCount: Number(row.exam_count),
    examErrorCount: Number(row.exam_error_count),
    lastExamAt: row.last_exam_at == null ? null : Number(row.last_exam_at),
    consecutiveCorrect: Number(row.consecutive_correct),
    selfMarked: Number(row.self_marked),
    lastSeen: Number(row.last_seen),
    nextDue: Number(row.next_due),
  }
}
