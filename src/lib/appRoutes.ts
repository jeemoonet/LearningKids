export type AppHub = 'my-world' | 'wordbook' | 'adventure' | 'training'

export type HubPageName = 'my-world-hub' | 'wordbook' | 'conquer-planet' | 'training-hub'

export const APP_ROUTE_PATHS = {
  myWorld: '/my-world',
  wordbook: '/wordbook',
  adventure: '/adventure',
  training: '/training',
} as const

const ADVENTURE_PATHS = new Set([APP_ROUTE_PATHS.adventure, '/conquer'])

/** 去掉末尾斜杠，避免 /adventure/ 无法匹配路由 */
export function normalizeAppPathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1)
  }
  return pathname
}

export function isAppHubPath(pathname: string): boolean {
  const path = normalizeAppPathname(pathname)
  if (path === '/' || path === APP_ROUTE_PATHS.myWorld) return true
  if (path === APP_ROUTE_PATHS.wordbook) return true
  if (path === APP_ROUTE_PATHS.training) return true
  if (ADVENTURE_PATHS.has(path)) return true
  return false
}

export function resolveHubPage(pathname: string): HubPageName {
  const path = normalizeAppPathname(pathname)
  if (path === APP_ROUTE_PATHS.wordbook) return 'wordbook'
  if (path === APP_ROUTE_PATHS.training) return 'training-hub'
  if (ADVENTURE_PATHS.has(path)) return 'conquer-planet'
  return 'my-world-hub'
}

export function pathForHubPage(page: HubPageName): string {
  if (page === 'wordbook') return APP_ROUTE_PATHS.wordbook
  if (page === 'training-hub') return APP_ROUTE_PATHS.training
  if (page === 'conquer-planet') return APP_ROUTE_PATHS.adventure
  return APP_ROUTE_PATHS.myWorld
}

export function hubFromPage(page: string): AppHub {
  if (page === 'wordbook') return 'wordbook'
  if (page === 'conquer-planet') return 'adventure'
  if (page === 'training-hub' || page === 'prep-game' || page === 'sentence-game') return 'training'
  return 'my-world'
}

export function hubLandingPage(hub: AppHub): HubPageName {
  if (hub === 'wordbook') return 'wordbook'
  if (hub === 'adventure') return 'conquer-planet'
  if (hub === 'training') return 'training-hub'
  return 'my-world-hub'
}

export function pathForAppHub(hub: AppHub): string {
  return pathForHubPage(hubLandingPage(hub))
}

export const HUB_NAV_ITEMS: Array<{ id: AppHub; label: string; icon: string; path: string }> = [
  { id: 'my-world', label: '我的世界', icon: '🌍', path: APP_ROUTE_PATHS.myWorld },
  { id: 'wordbook', label: '我的单词表', icon: '📒', path: APP_ROUTE_PATHS.wordbook },
  { id: 'adventure', label: '冒险星球', icon: '🪐', path: APP_ROUTE_PATHS.adventure },
  { id: 'training', label: '训练营', icon: '🎯', path: APP_ROUTE_PATHS.training },
]
