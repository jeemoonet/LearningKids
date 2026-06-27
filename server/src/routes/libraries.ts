import { Hono } from 'hono'
import type { AuthUser } from '../auth.js'
import { requireAuth } from '../auth.js'
import { getDb } from '../db.js'
import { getLibrary, getLibraryWords, listLibraries } from '../lib/learning/libraries.js'

type AppEnv = { Variables: { user: AuthUser } }

export const librariesRoutes = new Hono<AppEnv>()

librariesRoutes.use('*', requireAuth)

librariesRoutes.get('/', (c) => {
  return c.json({ libraries: listLibraries(getDb(), false) })
})

librariesRoutes.get('/:id/words', (c) => {
  const userId = c.get('user').id
  const id = c.req.param('id')
  const lib = getLibrary(getDb(), id)
  if (!lib) return c.json({ error: '学习库不存在' }, 404)
  return c.json({ library: lib, words: getLibraryWords(getDb(), id, userId) })
})
