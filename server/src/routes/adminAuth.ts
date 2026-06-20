import { Hono } from 'hono'
import {
  clearAdminSessionCookie,
  createAdminSession,
  deleteAdminSession,
  getAdminCredentials,
  getAdminFromSession,
  readAdminSessionId,
  setAdminSessionCookie,
  verifyAdminCredentials,
} from '../adminAuth.js'

export const adminAuthRoutes = new Hono()

adminAuthRoutes.get('/me', (c) => {
  const admin = getAdminFromSession(c)
  if (!admin) {
    clearAdminSessionCookie(c)
    return c.json({ admin: null })
  }
  return c.json({ admin })
})

adminAuthRoutes.post('/login', async (c) => {
  const body = await c.req.json<{ username?: string; password?: string }>()
  const username = body.username?.trim()
  const password = body.password ?? ''

  if (!username || !password) {
    return c.json({ error: '请输入用户名和密码' }, 400)
  }

  if (!verifyAdminCredentials(username, password)) {
    return c.json({ error: '用户名或密码错误' }, 401)
  }

  const sessionId = createAdminSession()
  setAdminSessionCookie(c, sessionId)

  const { username: adminUsername } = getAdminCredentials()
  return c.json({ admin: { username: adminUsername, displayName: '管理员' } })
})

adminAuthRoutes.post('/logout', (c) => {
  const sessionId = readAdminSessionId(c)
  if (sessionId) deleteAdminSession(sessionId)
  clearAdminSessionCookie(c)
  return c.json({ ok: true })
})
