import { Hono } from 'hono'
import type { AuthUser } from '../auth.js'
import { requireAuth } from '../auth.js'
import { getDb } from '../db.js'
import {
  abandonActiveSet,
  createLearningSet,
  getActiveSet,
  getSectionDetail,
  updateSectionFamiliarity,
} from '../lib/learning/learningSet.js'

type AppEnv = { Variables: { user: AuthUser } }

export const learningRoutes = new Hono<AppEnv>()

learningRoutes.use('*', requireAuth)

learningRoutes.get('/active', (c) => {
  const userId = c.get('user').id
  return c.json({ set: getActiveSet(getDb(), userId) })
})

learningRoutes.post('/sets', async (c) => {
  const userId = c.get('user').id
  let body: { libraryId?: string; size?: number } = {}
  try {
    body = await c.req.json()
  } catch {
    body = {}
  }
  try {
    const set = createLearningSet(getDb(), userId, body)
    return c.json({ set })
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : '创建学习集失败' }, 400)
  }
})

learningRoutes.post('/sets/abandon', (c) => {
  const userId = c.get('user').id
  abandonActiveSet(getDb(), userId)
  return c.json({ ok: true })
})

learningRoutes.get('/sections/:id', (c) => {
  const userId = c.get('user').id
  const detail = getSectionDetail(getDb(), userId, c.req.param('id'))
  if (!detail) return c.json({ error: '小节不存在' }, 404)
  return c.json({ section: detail })
})

learningRoutes.post('/sections/:id/familiarity', async (c) => {
  const userId = c.get('user').id
  const body = await c.req.json<{ word?: string; familiarity?: number }>()
  if (!body.word || typeof body.familiarity !== 'number') {
    return c.json({ error: '缺少 word 或 familiarity' }, 400)
  }
  try {
    updateSectionFamiliarity(getDb(), userId, c.req.param('id'), body.word, body.familiarity)
    return c.json({ ok: true })
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : '更新失败' }, 400)
  }
})
