import { Hono } from 'hono'
import type { AuthUser } from '../auth.js'
import { requireAuth } from '../auth.js'
import { getDb } from '../db.js'
import { getPeerBoard } from '../lib/learning/peerStats.js'
import { getProfile, setCurrentLibrary, updateProfile } from '../lib/learning/profiles.js'

type AppEnv = { Variables: { user: AuthUser } }

export const profileRoutes = new Hono<AppEnv>()

profileRoutes.use('*', requireAuth)

profileRoutes.get('/', (c) => {
  const user = c.get('user')
  return c.json({ profile: getProfile(getDb(), user.id, user.username, user.displayName) })
})

profileRoutes.get('/peers', (c) => {
  const user = c.get('user')
  return c.json(getPeerBoard(getDb(), user.id, user.displayName))
})

profileRoutes.put('/', async (c) => {
  const user = c.get('user')
  const body = await c.req.json<{ grade?: string; displayName?: string }>()
  updateProfile(getDb(), user.id, body)
  const refreshed = c.get('user')
  return c.json({ profile: getProfile(getDb(), user.id, refreshed.username, body.displayName?.trim() || user.displayName) })
})

profileRoutes.put('/current-library', async (c) => {
  const user = c.get('user')
  const body = await c.req.json<{ libraryId?: string }>()
  if (!body.libraryId) return c.json({ error: '缺少 libraryId' }, 400)
  try {
    setCurrentLibrary(getDb(), user.id, body.libraryId)
    return c.json({ profile: getProfile(getDb(), user.id, user.username, user.displayName) })
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : '设置失败' }, 400)
  }
})
