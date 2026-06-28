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
  /** 第一分叉之前的公共路径（不含 fork 节点） */
  spineBeforeFork: string[]
  fork: BattleMapFork
  /** 第一汇合后、第二分叉前的路径（不含 fork2 节点） */
  spineMid?: string[]
  /** 可选第二分叉 */
  fork2?: BattleMapFork
  /** 最终汇合后的公共路径 */
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

const KINGDOM_3_NODES: Record<string, BattleMapNode> = {
  /*
   * 迷雾森林国 · 双分叉（1024×571）
   * 岔路：景观/特殊关；汇合后全员走招募·复习主线
   */
  start: { id: 'start', x: 52, y: 93, label: '猎手营地', terrain: 'camp' },
  'wp-cliff': { id: 'wp-cliff', x: 42, y: 84, label: '苔石渡桥', terrain: 'waypoint' },
  'fork-1': { id: 'fork-1', x: 38, y: 78, label: '林缘雾口', terrain: 'fork' },
  'wp-sun-1': { id: 'wp-sun-1', x: 58, y: 76, label: '光斑台地', terrain: 'waypoint' },
  'wp-sun-2': { id: 'wp-sun-2', x: 72, y: 68, label: '树屋瞭望', terrain: 'tower' },
  'wp-sun-3': { id: 'wp-sun-3', x: 62, y: 62, label: '林冠边缘', terrain: 'waypoint' },
  'wp-mist-1': { id: 'wp-mist-1', x: 18, y: 72, label: '磷光入口', terrain: 'waypoint' },
  'special-1': {
    id: 'special-1',
    x: 14,
    y: 64,
    label: '磷光迷沼',
    terrain: 'forest',
    levelId: 'special-1',
  },
  'wp-mist-2': { id: 'wp-mist-2', x: 22, y: 58, label: '根须隘口', terrain: 'waypoint' },
  'wp-merge-1': { id: 'wp-merge-1', x: 48, y: 56, label: '汇合营地', terrain: 'waypoint' },
  'recruit-1': {
    id: 'recruit-1',
    x: 52,
    y: 50,
    label: '林间聚落',
    terrain: 'village',
    levelId: 'recruit-1',
  },
  'wp-outpost': { id: 'wp-outpost', x: 55, y: 44, label: '瞭望树屋', terrain: 'tower' },
  'recruit-2': {
    id: 'recruit-2',
    x: 58,
    y: 38,
    label: '追猎营地',
    terrain: 'village',
    levelId: 'recruit-2',
  },
  'review-1': {
    id: 'review-1',
    x: 42,
    y: 34,
    label: '迷途幽谷',
    terrain: 'valley',
    levelId: 'review-1',
  },
  'review-2': {
    id: 'review-2',
    x: 50,
    y: 28,
    label: '低语根林',
    terrain: 'forest',
    levelId: 'review-2',
  },
  'fork-2': { id: 'fork-2', x: 48, y: 24, label: '三岔雾口', terrain: 'fork' },
  'wp-ridge-1': { id: 'wp-ridge-1', x: 30, y: 22, label: '树脊栈道', terrain: 'waypoint' },
  'special-2': {
    id: 'special-2',
    x: 24,
    y: 18,
    label: '猎手迷局',
    terrain: 'forest',
    levelId: 'special-2',
  },
  'wp-ridge-2': { id: 'wp-ridge-2', x: 36, y: 16, label: '悬根平台', terrain: 'waypoint' },
  'wp-root-1': { id: 'wp-root-1', x: 64, y: 22, label: '根拱狭道', terrain: 'waypoint' },
  'wp-root-2': { id: 'wp-root-2', x: 70, y: 18, label: '根须深廊', terrain: 'waypoint' },
  'wp-root-3': { id: 'wp-root-3', x: 58, y: 16, label: '雾根出口', terrain: 'waypoint' },
  'wp-add-3': { id: 'wp-add-3', x: 50, y: 14, label: '古树拱门', terrain: 'waypoint' },
  'wp-final': { id: 'wp-final', x: 50, y: 12, label: '王座前庭', terrain: 'waypoint' },
  'wp-add-1': {
    id: 'wp-add-1',
    x: 50,
    y: 9,
    label: '林心王座',
    terrain: 'castle',
    levelId: 'boss-1',
  },
}

export const KINGDOM_3_BATTLE_MAP: KingdomBattleMapLayout = {
  kingdomId: 'kingdom-3',
  spineBeforeFork: ['start', 'wp-cliff'],
  fork: {
    nodeId: 'fork-1',
    branches: [
      {
        id: 'sunlit',
        label: '日光林径',
        hint: '向东穿光斑台地，经树屋瞭望台俯瞰林海',
        nodeIds: ['wp-sun-1', 'wp-sun-2', 'wp-sun-3'],
      },
      {
        id: 'mist-deep',
        label: '迷雾深径',
        hint: '向西沉入磷光迷沼，动词猎手只认副词之光',
        nodeIds: ['wp-mist-1', 'special-1', 'wp-mist-2'],
      },
    ],
    mergeNodeId: 'wp-merge-1',
  },
  spineMid: ['recruit-1', 'wp-outpost', 'recruit-2', 'review-1', 'review-2'],
  fork2: {
    nodeId: 'fork-2',
    branches: [
      {
        id: 'ridge',
        label: '树脊险道',
        hint: '沿悬根栈道北上，猎手迷局横在路中',
        nodeIds: ['wp-ridge-1', 'special-2', 'wp-ridge-2'],
      },
      {
        id: 'root',
        label: '根拱秘道',
        hint: '绕巨根而行，雾中可听见根须的低语',
        nodeIds: ['wp-root-1', 'wp-root-2', 'wp-root-3'],
      },
    ],
    mergeNodeId: 'wp-add-3',
  },
  spineAfterFork: ['wp-final', 'wp-add-1'],
  nodes: KINGDOM_3_NODES,
}

const LAYOUTS: Record<string, KingdomBattleMapLayout> = {
  'kingdom-1': KINGDOM_1_BATTLE_MAP,
  'kingdom-2': KINGDOM_2_BATTLE_MAP,
  'kingdom-3': KINGDOM_3_BATTLE_MAP,
}

export function getKingdomBattleMapLayout(kingdomId: string): KingdomBattleMapLayout | null {
  return LAYOUTS[kingdomId] ?? null
}

function layoutForkIsActive(layout: KingdomBattleMapLayout): boolean {
  if (!layout.nodes[layout.fork.nodeId]) return false
  return layout.fork.branches.some((b) => b.nodeIds.length > 0)
}

/** 根据分叉选择拼出完整路径节点 id 序列 */
export function buildActivePath(
  layout: KingdomBattleMapLayout,
  branchId: string | null,
  branchId2: string | null = null,
): string[] {
  if (!layoutForkIsActive(layout)) {
    return [...layout.spineBeforeFork, ...layout.spineAfterFork]
  }

  const { fork, fork2 } = layout
  const mid = layout.spineMid ?? []

  if (!branchId) {
    return [...layout.spineBeforeFork, fork.nodeId]
  }

  const branch1 = fork.branches.find((b) => b.id === branchId)
  if (!branch1) return [...layout.spineBeforeFork, fork.nodeId]

  let path = [
    ...layout.spineBeforeFork,
    fork.nodeId,
    ...branch1.nodeIds,
    fork.mergeNodeId,
  ]

  if (!fork2 || !layout.nodes[fork2.nodeId] || !fork2.branches.some((b) => b.nodeIds.length > 0)) {
    return [...path, ...layout.spineAfterFork]
  }

  if (!branchId2) {
    return [...path, ...mid, fork2.nodeId]
  }

  const branch2 = fork2.branches.find((b) => b.id === branchId2)
  if (!branch2) return [...path, ...mid, fork2.nodeId]

  return [
    ...path,
    ...mid,
    fork2.nodeId,
    ...branch2.nodeIds,
    fork2.mergeNodeId,
    ...layout.spineAfterFork,
  ]
}

/** 未选分叉时，返回所有可能路径（用于绘制虚线岔路） */
export function buildForkPreviewPaths(
  layout: KingdomBattleMapLayout,
  branchId: string | null = null,
): string[][] {
  if (!layoutForkIsActive(layout)) return []

  const { fork, fork2 } = layout
  const mid = layout.spineMid ?? []

  if (!fork2 || !layout.nodes[fork2.nodeId] || !fork2.branches.some((b) => b.nodeIds.length > 0)) {
    const after = [fork.mergeNodeId, ...layout.spineAfterFork]
    return fork.branches.map((b) => [...layout.spineBeforeFork, fork.nodeId, ...b.nodeIds, ...after])
  }

  if (!branchId) {
    const afterFirstMerge = [fork.mergeNodeId, ...mid, fork2.nodeId]
    return fork.branches.map((b) => [...layout.spineBeforeFork, fork.nodeId, ...b.nodeIds, ...afterFirstMerge])
  }

  const branch1 = fork.branches.find((b) => b.id === branchId)
  if (!branch1) return []

  const prefix = [
    ...layout.spineBeforeFork,
    fork.nodeId,
    ...branch1.nodeIds,
    fork.mergeNodeId,
    ...mid,
  ]
  const after = [fork2.mergeNodeId, ...layout.spineAfterFork]
  return fork2.branches.map((b) => [...prefix, fork2.nodeId, ...b.nodeIds, ...after])
}

export function activeForkNodeId(
  layout: KingdomBattleMapLayout,
  branchId: string | null,
  branchId2: string | null,
): string | null {
  if (!branchId) return layout.fork.nodeId
  if (layout.fork2 && !branchId2) return layout.fork2.nodeId
  return null
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
