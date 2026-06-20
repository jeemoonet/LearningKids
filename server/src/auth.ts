import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import type { Context, Next } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { getDb } from './db.js'

const SESSION_COOKIE = 'session_id'
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000

export interface AuthUser {
  id: string
  username: string
  displayName: string
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const attempt = scryptSync(password, salt, 64)
  const expected = Buffer.from(hash, 'hex')
  if (attempt.length !== expected.length) return false
  return timingSafeEqual(attempt, expected)
}

export function createSession(userId: string): string {
  const db = getDb()
  const sessionId = randomBytes(32).toString('hex')
  const now = Date.now()
  db.prepare(
    'INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)',
  ).run(sessionId, userId, now + SESSION_TTL_MS, now)
  return sessionId
}

export function deleteSession(sessionId: string): void {
  getDb().prepare('DELETE FROM sessions WHERE id = ?').run(sessionId)
}

export function getUserBySession(sessionId: string): AuthUser | null {
  const db = getDb()
  const now = Date.now()
  const row = db
    .prepare(
      `
      SELECT u.id, u.username, u.display_name
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.id = ? AND s.expires_at > ?
      `,
    )
    .get(sessionId, now) as { id: string; username: string; display_name: string } | undefined

  if (!row) return null
  return { id: row.id, username: row.username, displayName: row.display_name }
}

export function setSessionCookie(c: Context, sessionId: string): void {
  setCookie(c, SESSION_COOKIE, sessionId, {
    httpOnly: true,
    path: '/',
    sameSite: 'Lax',
    maxAge: SESSION_TTL_MS / 1000,
  })
}

export function clearSessionCookie(c: Context): void {
  deleteCookie(c, SESSION_COOKIE, { path: '/' })
}

export function readSessionId(c: Context): string | undefined {
  return getCookie(c, SESSION_COOKIE)
}

export function getUserFromSession(c: Context): AuthUser | null {
  const sessionId = readSessionId(c)
  if (!sessionId) return null
  return getUserBySession(sessionId)
}

export async function requireAuth(c: Context, next: Next): Promise<Response | void> {
  const sessionId = readSessionId(c)
  if (!sessionId) {
    return c.json({ error: '未登录' }, 401)
  }
  const user = getUserBySession(sessionId)
  if (!user) {
    clearSessionCookie(c)
    return c.json({ error: '登录已过期，请重新登录' }, 401)
  }
  c.set('user', user)
  await next()
}

export function cleanupExpiredSessions(): void {
  getDb().prepare('DELETE FROM sessions WHERE expires_at <= ?').run(Date.now())
}
