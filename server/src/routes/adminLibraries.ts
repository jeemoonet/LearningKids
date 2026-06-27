import { Hono } from 'hono'
import type { AdminUser } from '../adminAuth.js'
import { requireAdminAuth } from '../adminAuth.js'
import { getDb } from '../db.js'
import { mapWordRow } from '../lib/gameGroups.js'
import {
  createLibrary,
  deleteLibrary,
  getLibrary,
  importWordsFromTier,
  listLibraries,
  setLibraryWords,
  updateLibrary,
} from '../lib/learning/libraries.js'

type AppEnv = { Variables: { admin: AdminUser } }

export const adminLibrariesRoutes = new Hono<AppEnv>()

adminLibrariesRoutes.use('*', requireAdminAuth)

adminLibrariesRoutes.get('/', (c) => {
  return c.json({ libraries: listLibraries(getDb(), true) })
})

adminLibrariesRoutes.get('/:id/words', (c) => {
  const id = c.req.param('id')
  const lib = getLibrary(getDb(), id)
  if (!lib) return c.json({ error: '学习库不存在' }, 404)
  const rows = getDb()
    .prepare(
      `SELECT w.* FROM library_words lw
       INNER JOIN words w ON w.id = lw.word_id
       WHERE lw.library_id = ?
       ORDER BY lw.sort_order, w.id`,
    )
    .all(id) as Array<Record<string, unknown>>
  return c.json({ library: lib, words: rows.map(mapWordRow) })
})

adminLibrariesRoutes.post('/', async (c) => {
  const body = await c.req.json<{ name?: string; description?: string; sourceTier?: string | null }>()
  try {
    const lib = createLibrary(getDb(), {
      name: body.name ?? '',
      description: body.description,
      sourceTier: body.sourceTier ?? null,
    })
    return c.json({ library: lib })
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : '创建失败' }, 400)
  }
})

adminLibrariesRoutes.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json<{
    name?: string
    description?: string
    sourceTier?: string | null
    isActive?: boolean
  }>()
  try {
    const lib = updateLibrary(getDb(), id, body)
    return c.json({ library: lib })
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : '更新失败' }, 400)
  }
})

adminLibrariesRoutes.delete('/:id', (c) => {
  deleteLibrary(getDb(), c.req.param('id'))
  return c.json({ ok: true })
})

adminLibrariesRoutes.put('/:id/words', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json<{ wordIds?: number[] }>()
  if (!Array.isArray(body.wordIds)) return c.json({ error: '缺少 wordIds' }, 400)
  try {
    const count = setLibraryWords(getDb(), id, body.wordIds.map(Number).filter(Boolean))
    return c.json({ wordCount: count })
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : '保存失败' }, 400)
  }
})

adminLibrariesRoutes.post('/:id/words/from-tier', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json<{ tier?: string; limit?: number }>()
  if (!body.tier) return c.json({ error: '缺少 tier' }, 400)
  try {
    const count = importWordsFromTier(getDb(), id, body.tier, body.limit)
    return c.json({ wordCount: count })
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : '导入失败' }, 400)
  }
})
