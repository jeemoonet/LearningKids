import { Hono } from 'hono'
import type { AuthUser } from '../auth.js'
import { requireAuth } from '../auth.js'
import { getDb } from '../db.js'

type AppEnv = { Variables: { user: AuthUser } }

export const wordbookRoutes = new Hono<AppEnv>()

wordbookRoutes.use('*', requireAuth)

wordbookRoutes.get('/', (c) => {
  const userId = c.get('user').id
  const rows = getDb()
    .prepare(
      `
      SELECT word_id, word, meaning_zh, example_en, example_zh, created_at
      FROM user_wordbook
      WHERE user_id = ?
      ORDER BY created_at DESC
      `,
    )
    .all(userId) as Array<Record<string, unknown>>

  return c.json({
    items: rows.map(mapWordbookRow),
  })
})

wordbookRoutes.get('/ids', (c) => {
  const userId = c.get('user').id
  const rows = getDb()
    .prepare('SELECT word_id FROM user_wordbook WHERE user_id = ?')
    .all(userId) as Array<{ word_id: number }>

  return c.json({ wordIds: rows.map((row) => row.word_id) })
})

wordbookRoutes.post('/', async (c) => {
  const userId = c.get('user').id
  const body = await c.req.json<{ wordId?: number }>()
  const wordId = Number(body.wordId)

  if (!wordId) return c.json({ error: '缺少 wordId' }, 400)

  const db = getDb()
  const wordRow = db
    .prepare(
      'SELECT id, word, meaning_zh, example_en, example_zh FROM words WHERE id = ?',
    )
    .get(wordId) as
    | {
        id: number
        word: string
        meaning_zh: string
        example_en: string
        example_zh: string
      }
    | undefined

  if (!wordRow) return c.json({ error: '单词不存在' }, 404)

  const now = Date.now()
  db.prepare(
    `
    INSERT INTO user_wordbook (
      user_id, word_id, word, meaning_zh, example_en, example_zh, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, word_id) DO UPDATE SET
      word = excluded.word,
      meaning_zh = excluded.meaning_zh,
      example_en = excluded.example_en,
      example_zh = excluded.example_zh
    `,
  ).run(
    userId,
    wordRow.id,
    wordRow.word,
    wordRow.meaning_zh ?? '',
    wordRow.example_en ?? '',
    wordRow.example_zh ?? '',
    now,
  )

  return c.json({ ok: true, wordId: wordRow.id })
})

wordbookRoutes.delete('/:wordId', (c) => {
  const userId = c.get('user').id
  const wordId = Number(c.req.param('wordId'))

  if (!wordId) return c.json({ error: '无效的 wordId' }, 400)

  getDb()
    .prepare('DELETE FROM user_wordbook WHERE user_id = ? AND word_id = ?')
    .run(userId, wordId)

  return c.json({ ok: true })
})

function mapWordbookRow(row: Record<string, unknown>) {
  return {
    wordId: Number(row.word_id),
    word: String(row.word),
    meaningZh: String(row.meaning_zh ?? ''),
    exampleEn: String(row.example_en ?? ''),
    exampleZh: String(row.example_zh ?? ''),
    createdAt: Number(row.created_at),
  }
}
