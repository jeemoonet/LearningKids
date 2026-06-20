import { ApiError, apiFetch } from '../lib/api'

let onUnauthorized: (() => void) | null = null

export function registerAdminUnauthorized(handler: () => void): void {
  onUnauthorized = handler
}

export async function adminApiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  try {
    return await apiFetch<T>(path, options)
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      onUnauthorized?.()
    }
    throw error
  }
}
