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

const API_BASE = '/api'

function parseContentDispositionFilename(header: string | null): string | null {
  if (!header) return null
  const utf8Match = header.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1])
    } catch {
      return utf8Match[1]
    }
  }
  const plainMatch = header.match(/filename="([^"]+)"/i)
  return plainMatch?.[1] ?? null
}

export async function adminApiDownload(path: string): Promise<{ blob: Blob; filename: string }> {
  const response = await fetch(`${API_BASE}${path}`, { credentials: 'include' })

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string }
    if (response.status === 401) {
      onUnauthorized?.()
    }
    throw new ApiError(payload.error ?? response.statusText, response.status)
  }

  const blob = await response.blob()
  const filename =
    parseContentDispositionFilename(response.headers.get('Content-Disposition')) ?? 'export.pdf'
  return { blob, filename }
}
