import type { AnyGamePlugin, GamePlugin } from './types'

const REGISTRY = new Map<string, AnyGamePlugin>()

export function registerGame<Config>(plugin: GamePlugin<Config>): void {
  if (REGISTRY.has(plugin.id)) {
    throw new Error(`重复注册游戏插件 id: ${plugin.id}`)
  }
  REGISTRY.set(plugin.id, plugin as AnyGamePlugin)
}

export function getGame(id: string): AnyGamePlugin | undefined {
  return REGISTRY.get(id)
}

export function listGames(filter?: (p: AnyGamePlugin) => boolean): AnyGamePlugin[] {
  const all = [...REGISTRY.values()]
  return filter ? all.filter(filter) : all
}

export function hasGame(id: string): boolean {
  return REGISTRY.has(id)
}
