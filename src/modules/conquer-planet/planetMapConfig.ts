import { KINGDOM_MAP_POSITIONS } from './data/kingdomMapLayout'
import {
  getKingdomBattleMapLayout as getFileBattleMapLayout,
  type KingdomBattleMapLayout,
} from './data/kingdomBattleMapLayout'

export interface KingdomMapPosition {
  x: number
  y: number
  region: string
}

export interface BattleMapLayoutConfig extends KingdomBattleMapLayout {}

export interface PlanetMapConfig {
  kingdomMapPositions: Record<string, KingdomMapPosition>
  battleMapLayouts: Record<string, BattleMapLayoutConfig>
}

let cachedConfig: PlanetMapConfig | null = null

export function setPlanetMapConfig(config: PlanetMapConfig | null): void {
  cachedConfig = config
}

export function getPlanetMapConfig(): PlanetMapConfig | null {
  return cachedConfig
}

export function getKingdomMapPosition(kingdomId: string): KingdomMapPosition {
  return (
    cachedConfig?.kingdomMapPositions[kingdomId] ??
    KINGDOM_MAP_POSITIONS[kingdomId] ?? { x: 50, y: 50, region: '' }
  )
}

export function getKingdomBattleMapLayout(kingdomId: string): KingdomBattleMapLayout | null {
  const fromServer = cachedConfig?.battleMapLayouts[kingdomId]
  if (fromServer) return fromServer as KingdomBattleMapLayout
  return getFileBattleMapLayout(kingdomId)
}
