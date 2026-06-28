import { Hono } from 'hono'
import type { AuthUser } from '../auth.js'
import { requireAuth } from '../auth.js'
import { getDb } from '../db.js'
import { submitGrammarResult, migrateGrammarProgress } from '../lib/learning/grammarCamp.js'
import { getPlayerStats } from '../lib/learning/playerStats.js'

type AppEnv = { Variables: { user: AuthUser } }

export const trainingCampRoutes = new Hono<AppEnv>()

trainingCampRoutes.use('*', requireAuth)

trainingCampRoutes.get('/player-stats', (c) => {
  const userId = c.get('user').id
  return c.json(getPlayerStats(getDb(), userId))
})

trainingCampRoutes.post('/grammar-result', async (c) => {
  const userId = c.get('user').id
  const body = await c.req.json<{
    module?: string
    skillId?: string
    correctCount?: number
    totalQuestions?: number
  }>()

  if (body.module !== 'prep' && body.module !== 'sentence') {
    return c.json({ error: 'module 须为 prep 或 sentence' }, 400)
  }
  if (!body.skillId?.trim()) {
    return c.json({ error: '缺少 skillId' }, 400)
  }
  if (typeof body.correctCount !== 'number' || typeof body.totalQuestions !== 'number') {
    return c.json({ error: '缺少 correctCount 或 totalQuestions' }, 400)
  }

  try {
    const result = submitGrammarResult(
      getDb(),
      userId,
      body.module,
      body.skillId.trim(),
      body.correctCount,
      body.totalQuestions,
    )
    return c.json(result)
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : '保存失败' }, 400)
  }
})

trainingCampRoutes.post('/migrate-progress', async (c) => {
  const userId = c.get('user').id
  const body = await c.req.json<{ entries?: Array<{
    module?: string
    skillId?: string
    bestScore?: number
    totalQuestions?: number
    passed?: boolean
    lastPlayedAt?: number
  }> }>()

  if (!Array.isArray(body.entries)) {
    return c.json({ error: '缺少 entries' }, 400)
  }

  const entries = body.entries
    .filter((e) => e.module === 'prep' || e.module === 'sentence')
    .map((e) => ({
      module: e.module as 'prep' | 'sentence',
      skillId: String(e.skillId ?? ''),
      bestScore: Number(e.bestScore ?? 0),
      totalQuestions: Number(e.totalQuestions ?? 0),
      passed: Boolean(e.passed),
      lastPlayedAt: typeof e.lastPlayedAt === 'number' ? e.lastPlayedAt : undefined,
    }))

  try {
    const result = migrateGrammarProgress(getDb(), userId, entries)
    const stats = getPlayerStats(getDb(), userId)
    return c.json({ ...result, ...stats })
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : '迁移失败' }, 400)
  }
})
