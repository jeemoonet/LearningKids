import { randomUUID } from 'node:crypto'
import { Hono } from 'hono'
import type { AuthUser } from '../auth.js'
import {
  clearSessionCookie,
  createSession,
  deleteSession,
  getUserBySession,
  hashPassword,
  readSessionId,
  requireAuth,
  setSessionCookie,
  verifyPassword,
} from '../auth.js'
import { getDb } from '../db.js'

type AppEnv = { Variables: { user: AuthUser } }

export const authRoutes = new Hono<AppEnv>()

authRoutes.post('/register', async (c) => {
  const body = await c.req.json<{ username?: string; password?: string; displayName?: string }>()
  const username = body.username?.trim().toLowerCase()
  const password = body.password ?? ''
  const displayName = body.displayName?.trim() || username

  if (!username || username.length < 2) {
    return c.json({ error: '用户名至少 2 个字符' }, 400)
  }
  if (password.length < 6) {
    return c.json({ error: '密码至少 6 个字符' }, 400)
  }

  const db = getDb()
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username)
  if (existing) {
    return c.json({ error: '用户名已存在' }, 409)
  }

  const userId = randomUUID()
  const now = Date.now()
  const resolvedDisplayName = displayName || username
  db.prepare(
    'INSERT INTO users (id, username, password_hash, display_name, created_at) VALUES (?, ?, ?, ?, ?)',
  ).run(userId, username, hashPassword(password), resolvedDisplayName, now)

  const sessionId = createSession(userId)
  setSessionCookie(c, sessionId)

  return c.json({
    user: { id: userId, username, displayName: resolvedDisplayName },
  })
})

authRoutes.post('/login', async (c) => {
  const body = await c.req.json<{ username?: string; password?: string }>()
  const username = body.username?.trim().toLowerCase()
  const password = body.password ?? ''

  if (!username || !password) {
    return c.json({ error: '请输入用户名和密码' }, 400)
  }

  const row = getDb()
    .prepare('SELECT id, username, display_name, password_hash FROM users WHERE username = ?')
    .get(username) as
    | { id: string; username: string; display_name: string; password_hash: string }
    | undefined

  if (!row || !verifyPassword(password, row.password_hash)) {
    return c.json({ error: '用户名或密码错误' }, 401)
  }

  const sessionId = createSession(row.id)
  setSessionCookie(c, sessionId)

  return c.json({
    user: { id: row.id, username: row.username, displayName: row.display_name },
  })
})

authRoutes.post('/logout', (c) => {
  const sessionId = readSessionId(c)
  if (sessionId) deleteSession(sessionId)
  clearSessionCookie(c)
  return c.json({ ok: true })
})

authRoutes.get('/me', requireAuth, (c) => {
  const user = c.get('user')
  return c.json({ user })
})

authRoutes.get('/session', (c) => {
  const sessionId = readSessionId(c)
  if (!sessionId) return c.json({ user: null })
  const user = getUserBySession(sessionId)
  if (!user) {
    clearSessionCookie(c)
    return c.json({ user: null })
  }
  return c.json({ user })
})
