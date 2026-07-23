import { Hono } from 'hono'
import type { AuthUser } from '../auth.js'
import { requireAuth } from '../auth.js'
import { getDb } from '../db.js'
import {
  buildWordListExportResponse,
  type WordExportItem,
} from '../lib/wordListExport.js'

type AppEnv = { Variables: { user: AuthUser } }

const MAX_EXPORT_WORDS = 2000

export const wordbookRoutes = new Hono<AppEnv>()

wordbookRoutes.use('*', requireAuth)

wordbookRoutes.post('/export', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as {
    title?: string
    words?: unknown
  }

  const title = typeof body.title === 'string' && body.title.trim() ? body.title.trim() : '我的单词表'
  const rawWords = Array.isArray(body.words) ? body.words : []
  if (rawWords.length === 0) {
    return c.json({ error: '没有可导出的单词' }, 400)
  }
  if (rawWords.length > MAX_EXPORT_WORDS) {
    return c.json({ error: `一次最多导出 ${MAX_EXPORT_WORDS} 词` }, 400)
  }

  const words: WordExportItem[] = rawWords
    .map((item) => {
      const row = item as Record<string, unknown>
      return {
        word: String(row.word ?? '').trim(),
        posLabel: String(row.posLabel ?? '').trim(),
        meaningZh: String(row.meaningZh ?? row.meaning ?? '').trim(),
        exampleEn: String(row.exampleEn ?? '').trim(),
      }
    })
    .filter((item) => item.word)

  const response = buildWordListExportResponse(title, words)
  if (!response) {
    return c.json({ error: '没有可导出的单词' }, 400)
  }
  return response
})

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
