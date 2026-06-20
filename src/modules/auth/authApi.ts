import { apiFetch } from '../../lib/api'

export interface AuthUser {
  id: string
  username: string
  displayName: string
}

export async function fetchSession(): Promise<AuthUser | null> {
  const data = await apiFetch<{ user: AuthUser | null }>('/auth/session')
  return data.user
}

export async function login(username: string, password: string): Promise<AuthUser> {
  const data = await apiFetch<{ user: AuthUser }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
  return data.user
}

export async function register(
  username: string,
  password: string,
  displayName?: string,
): Promise<AuthUser> {
  const data = await apiFetch<{ user: AuthUser }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password, displayName }),
  })
  return data.user
}

export async function logout(): Promise<void> {
  await apiFetch('/auth/logout', { method: 'POST' })
}
