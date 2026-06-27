export type AppHub = 'my-world' | 'adventure' | 'training'

export type HubPageName = 'my-world-hub' | 'conquer-planet' | 'training-hub'

export const APP_ROUTE_PATHS = {
  myWorld: '/my-world',
  adventure: '/adventure',
  training: '/training',
} as const

const ADVENTURE_PATHS = new Set(['/adventure', '/conquer'])

export function isAppHubPath(pathname: string): boolean {
  if (pathname === '/' || pathname === APP_ROUTE_PATHS.myWorld) return true
  if (pathname === APP_ROUTE_PATHS.training) return true
  if (ADVENTURE_PATHS.has(pathname)) return true
  return false
}

export function resolveHubPage(pathname: string): HubPageName {
  if (pathname === APP_ROUTE_PATHS.training) return 'training-hub'
  if (ADVENTURE_PATHS.has(pathname)) return 'conquer-planet'
  return 'my-world-hub'
}

export function pathForHubPage(page: HubPageName): string {
  if (page === 'training-hub') return APP_ROUTE_PATHS.training
  if (page === 'conquer-planet') return APP_ROUTE_PATHS.adventure
  return APP_ROUTE_PATHS.myWorld
}

export function hubFromPage(page: string): AppHub {
  if (page === 'conquer-planet') return 'adventure'
  if (page === 'training-hub' || page === 'prep-game' || page === 'sentence-game') return 'training'
  return 'my-world'
}

export function hubLandingPage(hub: AppHub): HubPageName {
  if (hub === 'adventure') return 'conquer-planet'
  if (hub === 'training') return 'training-hub'
  return 'my-world-hub'
}

export function pathForAppHub(hub: AppHub): string {
  return pathForHubPage(hubLandingPage(hub))
}

export const HUB_NAV_ITEMS: Array<{ id: AppHub; label: string; icon: string; path: string }> = [
  { id: 'my-world', label: '我的世界', icon: '🌍', path: APP_ROUTE_PATHS.myWorld },
  { id: 'adventure', label: '冒险星球', icon: '🪐', path: APP_ROUTE_PATHS.adventure },
  { id: 'training', label: '训练营', icon: '🎯', path: APP_ROUTE_PATHS.training },
]
