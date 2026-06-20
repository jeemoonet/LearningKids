import { apiFetch } from '../lib/api'

export interface AdminUser {
  username: string
  displayName: string
}

export async function fetchAdminSession(): Promise<AdminUser | null> {
  const data = await apiFetch<{ admin: AdminUser | null }>('/admin/auth/me')
  return data.admin
}

export async function adminLogin(username: string, password: string): Promise<AdminUser> {
  const data = await apiFetch<{ admin: AdminUser }>('/admin/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
  return data.admin
}

export async function adminLogout(): Promise<void> {
  await apiFetch('/admin/auth/logout', { method: 'POST' })
}
