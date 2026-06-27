import { Hono } from 'hono'
import type { AuthUser } from '../auth.js'
import { requireAuth } from '../auth.js'
import { getDb } from '../db.js'
import {
  DEFAULT_INIT_TIER,
  drawInitWords,
  getInitStatus,
  keepInitWords,
  listKnownWords,
} from '../lib/learning/knownWords.js'

type AppEnv = { Variables: { user: AuthUser } }

export const knownWordsRoutes = new Hono<AppEnv>()

knownWordsRoutes.use('*', requireAuth)

function resolveTier(raw: string | undefined): string {
  return raw?.trim() || DEFAULT_INIT_TIER
}

knownWordsRoutes.get('/', (c) => {
  const userId = c.get('user').id
  return c.json({ words: listKnownWords(getDb(), userId) })
})

knownWordsRoutes.get('/init/status', (c) => {
  const userId = c.get('user').id
  const tier = resolveTier(c.req.query('tier'))
  return c.json(getInitStatus(getDb(), userId, tier))
})

knownWordsRoutes.get('/init/draw', (c) => {
  const userId = c.get('user').id
  const tier = resolveTier(c.req.query('tier'))
  const { words, status } = drawInitWords(getDb(), userId, tier)
  return c.json({ words, status })
})

knownWordsRoutes.post('/init/keep', async (c) => {
  const userId = c.get('user').id
  const body = await c.req.json<{ tier?: string; words?: string[] }>()
  const tier = resolveTier(body.tier)
  const words = Array.isArray(body.words) ? body.words : []
  return c.json(keepInitWords(getDb(), userId, tier, words))
})
