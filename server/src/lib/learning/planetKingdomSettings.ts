import type { DatabaseSync } from 'node:sqlite'
import {
  PLANET_KINGDOMS,
  type PlanetKingdomConfig,
} from './conquerPlanetConfig.js'

export interface KingdomMapPosition {
  x: number
  y: number
  region: string
}

export interface BattleMapNodeConfig {
  id: string
  x: number
  y: number
  label: string
  terrain: string
  levelId?: string
}

export interface BattleMapLayoutConfig {
  kingdomId: string
  spineBeforeFork: string[]
  spineAfterFork: string[]
  fork: {
    nodeId: string
    branches: Array<{
      id: string
      label: string
      hint: string
      nodeIds: string[]
    }>
    mergeNodeId: string
  }
  nodes: Record<string, BattleMapNodeConfig>
}

export const DEFAULT_KINGDOM_MAP_POSITIONS: Record<string, KingdomMapPosition> = {
  'kingdom-1': { x: 20, y: 76, region: '西南边境' },
  'kingdom-2': { x: 42, y: 84, region: '南麓平原' },
  'kingdom-3': { x: 18, y: 50, region: '西侧林带' },
  'kingdom-4': { x: 50, y: 46, region: '中央沙海' },
  'kingdom-5': { x: 78, y: 52, region: '东岸商路' },
  'kingdom-6': { x: 28, y: 20, region: '北境回廊' },
  'kingdom-7': { x: 58, y: 10, region: '极北王座' },
}

const KINGDOM_1_BATTLE_MAP: BattleMapLayoutConfig = {
  kingdomId: 'kingdom-1',
  spineBeforeFork: [
    'start',
    'wp-cliff',
    'recruit-1',
    'wp-outpost',
    'recruit-2',
    'wp-add-2',
    'review-1',
    'review-2',
    'wp-add-3',
    'wp-add-1',
  ],
  spineAfterFork: [],
  fork: {
    nodeId: 'fork-1',
    branches: [
      {
        id: 'valley',
        label: '回声山谷道',
        hint: '向东沿大河而上，经河畔城邑与回声山谷',
        nodeIds: [],
      },
      {
        id: 'forest',
        label: '低语密林道',
        hint: '向西穿低语密林，经溪畔聚落与林径',
        nodeIds: [],
      },
    ],
    mergeNodeId: 'wp-add-3',
  },
  nodes: {
    start: { id: 'start', x: 49.7, y: 94.3, label: '出发营地', terrain: 'camp' },
    'wp-cliff': { id: 'wp-cliff', x: 74, y: 82.5, label: '木质小桥', terrain: 'waypoint' },
    'recruit-1': {
      id: 'recruit-1',
      x: 71,
      y: 78,
      label: '边境村庄',
      terrain: 'village',
      levelId: 'recruit-1',
    },
    'review-2': {
      id: 'review-2',
      x: 77.4,
      y: 67.6,
      label: '森林废墟',
      terrain: 'valley',
      levelId: 'review-2',
    },
    'wp-outpost': { id: 'wp-outpost', x: 50.1, y: 70.7, label: '前哨石塔', terrain: 'tower' },
    'recruit-2': {
      id: 'recruit-2',
      x: 53,
      y: 66,
      label: '溪畔聚落',
      terrain: 'village',
      levelId: 'recruit-2',
    },
    'wp-add-2': { id: 'wp-add-2', x: 56.9, y: 61.3, label: '村庄路口', terrain: 'fork' },
    'review-1': {
      id: 'review-1',
      x: 54,
      y: 56,
      label: '回声山谷',
      terrain: 'valley',
      levelId: 'review-1',
    },
    'wp-add-3': { id: 'wp-add-3', x: 46.8, y: 30.7, label: '山顶石门', terrain: 'waypoint' },
    'wp-add-1': {
      id: 'wp-add-1',
      x: 56.2,
      y: 17.8,
      label: '王宫城堡',
      terrain: 'castle',
      levelId: 'boss-1',
    },
  },
}

const KINGDOM_2_BATTLE_MAP: BattleMapLayoutConfig = {
  kingdomId: 'kingdom-2',
  spineBeforeFork: [
    'start',
    'wp-cliff',
    'recruit-1',
    'wp-outpost',
    'recruit-2',
    'wp-add-2',
    'review-1',
    'review-2',
    'wp-add-3',
    'wp-add-1',
  ],
  spineAfterFork: [],
  fork: {
    nodeId: 'fork-1',
    branches: [
      {
        id: 'wheat',
        label: '麦香大道',
        hint: '沿金色麦浪而上，经磨坊与粮仓',
        nodeIds: [],
      },
      {
        id: 'orchard',
        label: '果岭小径',
        hint: '穿红果林，经果园与晒场',
        nodeIds: [],
      },
    ],
    mergeNodeId: 'wp-add-3',
  },
  nodes: {
    start: { id: 'start', x: 49.7, y: 94.3, label: '炊烟营地', terrain: 'camp' },
    'wp-cliff': { id: 'wp-cliff', x: 74, y: 82.5, label: '禾木小桥', terrain: 'waypoint' },
    'recruit-1': {
      id: 'recruit-1',
      x: 71,
      y: 78,
      label: '麦穗村庄',
      terrain: 'village',
    },
    'review-2': {
      id: 'review-2',
      x: 77.4,
      y: 67.6,
      label: '发酵窖场',
      terrain: 'valley',
    },
    'wp-outpost': { id: 'wp-outpost', x: 50.1, y: 70.7, label: '磨坊哨塔', terrain: 'tower' },
    'recruit-2': {
      id: 'recruit-2',
      x: 53,
      y: 66,
      label: '果园聚落',
      terrain: 'village',
    },
    'wp-add-2': { id: 'wp-add-2', x: 56.9, y: 61.3, label: '灶火路口', terrain: 'fork' },
    'review-1': {
      id: 'review-1',
      x: 54,
      y: 56,
      label: '香料集市',
      terrain: 'valley',
    },
    'wp-add-3': { id: 'wp-add-3', x: 46.8, y: 30.7, label: '石窑关隘', terrain: 'waypoint' },
    'wp-add-1': {
      id: 'wp-add-1',
      x: 56.2,
      y: 17.8,
      label: '御膳王城',
      terrain: 'castle',
    },
  },
}

export const DEFAULT_BATTLE_MAP_LAYOUTS: Record<string, BattleMapLayoutConfig> = {
  'kingdom-1': KINGDOM_1_BATTLE_MAP,
  'kingdom-2': KINGDOM_2_BATTLE_MAP,
}

interface KingdomOverrideRow {
  kingdom_id: string
  name: string | null
  subtitle: string | null
  map_x: number | null
  map_y: number | null
  map_region: string | null
  battle_map_layout_json: string | null
  updated_at: number
}

export interface AdminKingdomView {
  id: string
  order: number
  name: string
  subtitle: string
  difficulty: string
  theme: string
  monster: PlanetKingdomConfig['monster']
  mapPosition: KingdomMapPosition
  hasBattleMap: boolean
  battleMapLayout: BattleMapLayoutConfig | null
  hasOverride: boolean
  updatedAt: number | null
}

function readOverride(db: DatabaseSync, kingdomId: string): KingdomOverrideRow | null {
  const row = db
    .prepare('SELECT * FROM planet_kingdom_overrides WHERE kingdom_id = ?')
    .get(kingdomId)
  return (row as KingdomOverrideRow | undefined) ?? null
}

function parseBattleLayout(json: string | null): BattleMapLayoutConfig | null {
  if (!json?.trim()) return null
  try {
    return JSON.parse(json) as BattleMapLayoutConfig
  } catch {
    return null
  }
}

export function getEffectiveKingdomConfig(
  db: DatabaseSync,
  base: PlanetKingdomConfig,
): PlanetKingdomConfig {
  const row = readOverride(db, base.id)
  if (!row) return base
  return {
    ...base,
    name: row.name?.trim() || base.name,
    subtitle: row.subtitle?.trim() || base.subtitle,
  }
}

export function getEffectiveKingdoms(db: DatabaseSync): PlanetKingdomConfig[] {
  return PLANET_KINGDOMS.map((kingdom) => getEffectiveKingdomConfig(db, kingdom))
}

export function getEffectiveMapPosition(db: DatabaseSync, kingdomId: string): KingdomMapPosition {
  const defaults = DEFAULT_KINGDOM_MAP_POSITIONS[kingdomId] ?? { x: 50, y: 50, region: '' }
  const row = readOverride(db, kingdomId)
  if (!row) return defaults
  return {
    x: row.map_x ?? defaults.x,
    y: row.map_y ?? defaults.y,
    region: row.map_region?.trim() || defaults.region,
  }
}

export function getAllEffectiveMapPositions(
  db: DatabaseSync,
): Record<string, KingdomMapPosition> {
  const result: Record<string, KingdomMapPosition> = {}
  for (const kingdom of PLANET_KINGDOMS) {
    result[kingdom.id] = getEffectiveMapPosition(db, kingdom.id)
  }
  return result
}

export function getEffectiveBattleMapLayout(
  db: DatabaseSync,
  kingdomId: string,
): BattleMapLayoutConfig | null {
  const defaults = DEFAULT_BATTLE_MAP_LAYOUTS[kingdomId] ?? null
  const row = readOverride(db, kingdomId)
  const override = parseBattleLayout(row?.battle_map_layout_json ?? null)
  if (override) return override
  return defaults
}

export function listAdminKingdoms(db: DatabaseSync): AdminKingdomView[] {
  return PLANET_KINGDOMS.map((base) => {
    const row = readOverride(db, base.id)
    const effective = getEffectiveKingdomConfig(db, base)
    const battleMapLayout = getEffectiveBattleMapLayout(db, base.id)
    return {
      id: base.id,
      order: base.order,
      name: effective.name,
      subtitle: effective.subtitle,
      difficulty: base.difficulty,
      theme: base.theme,
      monster: base.monster,
      mapPosition: getEffectiveMapPosition(db, base.id),
      hasBattleMap: Boolean(DEFAULT_BATTLE_MAP_LAYOUTS[base.id] || row?.battle_map_layout_json),
      battleMapLayout,
      hasOverride: Boolean(row),
      updatedAt: row?.updated_at ?? null,
    }
  })
}

export function updateKingdomSettings(
  db: DatabaseSync,
  kingdomId: string,
  patch: {
    name?: string
    subtitle?: string
    mapX?: number
    mapY?: number
    mapRegion?: string
    battleMapLayout?: BattleMapLayoutConfig | null
  },
): AdminKingdomView {
  const base = PLANET_KINGDOMS.find((k) => k.id === kingdomId)
  if (!base) throw new Error('王国不存在')

  const existing = readOverride(db, kingdomId)
  const now = Date.now()

  const name = patch.name !== undefined ? patch.name.trim() : existing?.name ?? null
  const subtitle =
    patch.subtitle !== undefined ? patch.subtitle.trim() : existing?.subtitle ?? null
  const mapX = patch.mapX !== undefined ? patch.mapX : existing?.map_x ?? null
  const mapY = patch.mapY !== undefined ? patch.mapY : existing?.map_y ?? null
  const mapRegion =
    patch.mapRegion !== undefined ? patch.mapRegion.trim() : existing?.map_region ?? null

  let battleJson = existing?.battle_map_layout_json ?? null
  if (patch.battleMapLayout !== undefined) {
    battleJson = patch.battleMapLayout ? JSON.stringify(patch.battleMapLayout) : null
  }

  db.prepare(
    `INSERT INTO planet_kingdom_overrides
      (kingdom_id, name, subtitle, map_x, map_y, map_region, battle_map_layout_json, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(kingdom_id) DO UPDATE SET
       name = excluded.name,
       subtitle = excluded.subtitle,
       map_x = excluded.map_x,
       map_y = excluded.map_y,
       map_region = excluded.map_region,
       battle_map_layout_json = excluded.battle_map_layout_json,
       updated_at = excluded.updated_at`,
  ).run(kingdomId, name, subtitle, mapX, mapY, mapRegion, battleJson, now)

  return listAdminKingdoms(db).find((k) => k.id === kingdomId)!
}

export function resetKingdomSettings(db: DatabaseSync, kingdomId: string): AdminKingdomView {
  const base = PLANET_KINGDOMS.find((k) => k.id === kingdomId)
  if (!base) throw new Error('王国不存在')
  db.prepare('DELETE FROM planet_kingdom_overrides WHERE kingdom_id = ?').run(kingdomId)
  return listAdminKingdoms(db).find((k) => k.id === kingdomId)!
}

export function buildPlanetConfigPayload(db: DatabaseSync) {
  return {
    kingdomMapPositions: getAllEffectiveMapPositions(db),
    battleMapLayouts: Object.fromEntries(
      PLANET_KINGDOMS.map((k) => [k.id, getEffectiveBattleMapLayout(db, k.id)]).filter(
        ([, layout]) => layout != null,
      ),
    ) as Record<string, BattleMapLayoutConfig>,
  }
}
