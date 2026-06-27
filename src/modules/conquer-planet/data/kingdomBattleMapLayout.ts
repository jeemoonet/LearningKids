/** 王国战斗地图节点地形 */
export type MapTerrain = 'camp' | 'village' | 'forest' | 'valley' | 'castle' | 'fork' | 'waypoint' | 'tower'

export interface BattleMapNode {
  id: string
  x: number
  y: number
  label: string
  terrain: MapTerrain
  /** 关联关卡 id（有则可在该格进入关卡） */
  levelId?: string
}

export interface BattleMapFork {
  nodeId: string
  branches: Array<{
    id: string
    label: string
    hint: string
    /** fork 之后、汇合之前的节点 id 序列 */
    nodeIds: string[]
  }>
  mergeNodeId: string
}

export interface KingdomBattleMapLayout {
  kingdomId: string
  /** fork 之前的公共路径节点 id */
  spineBeforeFork: string[]
  fork: BattleMapFork
  /** 汇合之后的公共路径节点 id */
  spineAfterFork: string[]
  nodes: Record<string, BattleMapNode>
}

const KINGDOM_1_NODES: Record<string, BattleMapNode> = {
  /*
   * 人工标注对齐 kingdom-1-map.png（1024×571）
   * 路径：出发营地 → … → 五关顺序必经（招募×2 → 复习×2 → BOSS）→ 王宫城堡
   */
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
}

export const KINGDOM_1_BATTLE_MAP: KingdomBattleMapLayout = {
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
  fork: {
    /* 当前为线性标注路径，分叉节点仅作地标；fork-1 不在路径中以免阻断逐格前进 */
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
  spineAfterFork: [],
  nodes: KINGDOM_1_NODES,
}

const KINGDOM_2_NODES: Record<string, BattleMapNode> = {
  /*
   * 初始坐标沿用 kingdom-1 布局，待管理台对齐 kingdom-2-map.png（1024×571）
   */
  start: { id: 'start', x: 49.7, y: 94.3, label: '炊烟营地', terrain: 'camp' },
  'wp-cliff': { id: 'wp-cliff', x: 74, y: 82.5, label: '禾木小桥', terrain: 'waypoint' },
  'recruit-1': { id: 'recruit-1', x: 71, y: 78, label: '麦穗村庄', terrain: 'village' },
  'review-2': { id: 'review-2', x: 77.4, y: 67.6, label: '发酵窖场', terrain: 'valley' },
  'wp-outpost': { id: 'wp-outpost', x: 50.1, y: 70.7, label: '磨坊哨塔', terrain: 'tower' },
  'recruit-2': { id: 'recruit-2', x: 53, y: 66, label: '果园聚落', terrain: 'village' },
  'wp-add-2': { id: 'wp-add-2', x: 56.9, y: 61.3, label: '灶火路口', terrain: 'fork' },
  'review-1': { id: 'review-1', x: 54, y: 56, label: '香料集市', terrain: 'valley' },
  'wp-add-3': { id: 'wp-add-3', x: 46.8, y: 30.7, label: '石窑关隘', terrain: 'waypoint' },
  'wp-add-1': { id: 'wp-add-1', x: 56.2, y: 17.8, label: '御膳王城', terrain: 'castle' },
}

export const KINGDOM_2_BATTLE_MAP: KingdomBattleMapLayout = {
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
  spineAfterFork: [],
  nodes: KINGDOM_2_NODES,
}

const LAYOUTS: Record<string, KingdomBattleMapLayout> = {
  'kingdom-1': KINGDOM_1_BATTLE_MAP,
  'kingdom-2': KINGDOM_2_BATTLE_MAP,
}

export function getKingdomBattleMapLayout(kingdomId: string): KingdomBattleMapLayout | null {
  return LAYOUTS[kingdomId] ?? null
}

/** 根据分叉选择拼出完整路径节点 id 序列 */
export function buildActivePath(layout: KingdomBattleMapLayout, branchId: string | null): string[] {
  if (!branchId) {
    return [...layout.spineBeforeFork]
  }
  const branch = layout.fork.branches.find((b) => b.id === branchId)
  if (!branch) return [...layout.spineBeforeFork]
  return [
    ...layout.spineBeforeFork,
    ...branch.nodeIds,
    layout.fork.mergeNodeId,
    ...layout.spineAfterFork,
  ]
}

/** 未选分叉时，返回所有可能路径（用于绘制虚线岔路） */
export function buildForkPreviewPaths(layout: KingdomBattleMapLayout): string[][] {
  const before = layout.spineBeforeFork.slice(0, -1)
  const after = [layout.fork.mergeNodeId, ...layout.spineAfterFork]
  return layout.fork.branches.map((b) => [...before, layout.fork.nodeId, ...b.nodeIds, ...after])
}

export function terrainIcon(terrain: MapTerrain): string {
  switch (terrain) {
    case 'camp':
      return '⚑'
    case 'village':
      return '🏘️'
    case 'forest':
      return '🌲'
    case 'valley':
      return '🌫️'
    case 'castle':
      return '🏯'
    case 'tower':
      return '🗼'
    case 'fork':
      return '⑂'
    default:
      return '·'
  }
}
