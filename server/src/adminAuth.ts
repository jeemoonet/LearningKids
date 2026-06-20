import { randomBytes } from 'node:crypto'
import type { Context, Next } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { getDb } from './db.js'

const ADMIN_SESSION_COOKIE = 'admin_session_id'
/** 管理后台会话有效期：30 天（与用户端一致） */
const ADMIN_SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000

export interface AdminUser {
  username: string
  displayName: string
}

export function getAdminCredentials(): { username: string; password: string } {
  return {
    username: process.env.ADMIN_USERNAME ?? 'admin',
    password: process.env.ADMIN_PASSWORD ?? 'admin123',
  }
}

export function verifyAdminCredentials(username: string, password: string): boolean {
  const creds = getAdminCredentials()
  return username === creds.username && password === creds.password
}

export function createAdminSession(): string {
  const db = getDb()
  const sessionId = randomBytes(32).toString('hex')
  const now = Date.now()
  db.prepare(
    'INSERT INTO admin_sessions (id, expires_at, created_at) VALUES (?, ?, ?)',
  ).run(sessionId, now + ADMIN_SESSION_TTL_MS, now)
  return sessionId
}

export function deleteAdminSession(sessionId: string): void {
  getDb().prepare('DELETE FROM admin_sessions WHERE id = ?').run(sessionId)
}

export function isValidAdminSession(sessionId: string): boolean {
  const now = Date.now()
  const row = getDb()
    .prepare('SELECT id FROM admin_sessions WHERE id = ? AND expires_at > ?')
    .get(sessionId, now) as { id: string } | undefined
  return row != null
}

/** 活跃请求时滑动续期，避免使用中突然过期 */
export function touchAdminSession(sessionId: string): void {
  const now = Date.now()
  getDb()
    .prepare('UPDATE admin_sessions SET expires_at = ? WHERE id = ? AND expires_at > ?')
    .run(now + ADMIN_SESSION_TTL_MS, sessionId, now)
}

export function cleanupExpiredAdminSessions(): void {
  getDb().prepare('DELETE FROM admin_sessions WHERE expires_at <= ?').run(Date.now())
}

export function setAdminSessionCookie(c: Context, sessionId: string): void {
  setCookie(c, ADMIN_SESSION_COOKIE, sessionId, {
    httpOnly: true,
    path: '/',
    sameSite: 'Lax',
    maxAge: ADMIN_SESSION_TTL_MS / 1000,
  })
}

export function clearAdminSessionCookie(c: Context): void {
  deleteCookie(c, ADMIN_SESSION_COOKIE, { path: '/' })
}

export function readAdminSessionId(c: Context): string | undefined {
  return getCookie(c, ADMIN_SESSION_COOKIE)
}

export function getAdminFromSession(c: Context): AdminUser | null {
  const sessionId = readAdminSessionId(c)
  if (!sessionId || !isValidAdminSession(sessionId)) return null
  touchAdminSession(sessionId)
  const { username } = getAdminCredentials()
  return { username, displayName: '管理员' }
}

export async function requireAdminAuth(c: Context, next: Next): Promise<Response | void> {
  const sessionId = readAdminSessionId(c)
  if (!sessionId || !isValidAdminSession(sessionId)) {
    clearAdminSessionCookie(c)
    return c.json({ error: '未登录或登录已过期' }, 401)
  }
  touchAdminSession(sessionId)
  const { username } = getAdminCredentials()
  c.set('admin', { username, displayName: '管理员' })
  await next()
}
