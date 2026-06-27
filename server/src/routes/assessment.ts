import { Hono } from 'hono'
import type { AuthUser } from '../auth.js'
import { requireAuth } from '../auth.js'
import { getDb } from '../db.js'
import { buildSectionCloze, submitAssessment } from '../lib/learning/assessment.js'
import { getSectionDetail } from '../lib/learning/learningSet.js'

type AppEnv = { Variables: { user: AuthUser } }

export const assessmentRoutes = new Hono<AppEnv>()

assessmentRoutes.use('*', requireAuth)

assessmentRoutes.get('/section/:id/cloze', (c) => {
  const userId = c.get('user').id
  const detail = getSectionDetail(getDb(), userId, c.req.param('id'))
  if (!detail) return c.json({ error: '小节不存在' }, 404)
  return c.json(buildSectionCloze(getDb(), userId, c.req.param('id')))
})

assessmentRoutes.post('/section/:id/submit', async (c) => {
  const userId = c.get('user').id
  const body = await c.req.json<{ correct?: number; total?: number }>()
  if (typeof body.correct !== 'number' || typeof body.total !== 'number') {
    return c.json({ error: '缺少 correct 或 total' }, 400)
  }
  try {
    const result = submitAssessment(getDb(), userId, c.req.param('id'), body.correct, body.total)
    return c.json(result)
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : '提交失败' }, 400)
  }
})
