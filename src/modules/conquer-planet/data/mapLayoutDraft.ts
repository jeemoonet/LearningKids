import type { BattleMapNode, KingdomBattleMapLayout, MapTerrain } from './kingdomBattleMapLayout'
import type { MapNodeOverrides } from './mapViewBox'

const DRAFT_KEY = (kingdomId: string) => `cp-map-layout-draft:${kingdomId}`
const LEGACY_OVERRIDE_KEY = (kingdomId: string) => `cp-map-node-overrides:${kingdomId}`

/** 底图路径结构变更时递增，使旧 linearPath 草稿失效 */
export const MAP_PATH_SCHEMA_VERSION = 2

export interface MapLayoutDraft {
  schemaVersion?: number
  nodes: MapNodeOverrides
  /** 标注模式：单一线性路径（节点 id 顺序） */
  linearPath?: string[]
  spineBeforeFork?: string[]
  spineAfterFork?: string[]
  branchPaths?: Record<string, string[]>
}

export function loadMapLayoutDraft(kingdomId: string): MapLayoutDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY(kingdomId))
    if (raw) {
      const draft = JSON.parse(raw) as MapLayoutDraft
      if ((draft.schemaVersion ?? 1) < MAP_PATH_SCHEMA_VERSION) {
        clearMapLayoutDraft(kingdomId)
        return null
      }
      return draft
    }

    const legacy = localStorage.getItem(LEGACY_OVERRIDE_KEY(kingdomId))
    if (legacy) return { nodes: JSON.parse(legacy) as MapNodeOverrides, schemaVersion: MAP_PATH_SCHEMA_VERSION }
  } catch {
    /* ignore */
  }
  return null
}

export function saveMapLayoutDraft(kingdomId: string, draft: MapLayoutDraft): void {
  localStorage.setItem(
    DRAFT_KEY(kingdomId),
    JSON.stringify({ ...draft, schemaVersion: MAP_PATH_SCHEMA_VERSION }),
  )
  localStorage.removeItem(LEGACY_OVERRIDE_KEY(kingdomId))
}

export function clearMapLayoutDraft(kingdomId: string): void {
  localStorage.removeItem(DRAFT_KEY(kingdomId))
  localStorage.removeItem(LEGACY_OVERRIDE_KEY(kingdomId))
}

function levelNodeIdsOnPath(layout: KingdomBattleMapLayout): string[] {
  const ids = [...layout.spineBeforeFork, ...layout.spineAfterFork]
  return ids.filter((id) => layout.nodes[id]?.levelId)
}

function resolvePathFromDraft(
  base: KingdomBattleMapLayout,
  draft: MapLayoutDraft,
  nodes: Record<string, BattleMapNode>,
): { spineBeforeFork: string[]; spineAfterFork: string[] } {
  if (draft.linearPath?.length) {
    const draftPath = draft.linearPath.filter((id) => nodes[id])
    const missingLevelNode = levelNodeIdsOnPath(base).some((id) => !draftPath.includes(id))
    if (!missingLevelNode && draftPath.length > 0) {
      return { spineBeforeFork: draftPath, spineAfterFork: [] }
    }
  }

  return {
    spineBeforeFork: draft.spineBeforeFork ?? base.spineBeforeFork,
    spineAfterFork: draft.spineAfterFork ?? base.spineAfterFork,
  }
}

export function applyMapLayoutDraft(
  base: KingdomBattleMapLayout,
  draft: MapLayoutDraft | null,
): KingdomBattleMapLayout {
  if (!draft) return base

  const nodes: Record<string, BattleMapNode> = { ...base.nodes }

  for (const [id, patch] of Object.entries(draft.nodes)) {
    const orig = nodes[id]
    if (orig) {
      nodes[id] = {
        ...orig,
        x: patch.x,
        y: patch.y,
        ...(patch.label != null ? { label: patch.label } : {}),
        ...(patch.terrain != null ? { terrain: patch.terrain as MapTerrain } : {}),
      }
    } else if (patch.label && patch.terrain) {
      nodes[id] = {
        id,
        x: patch.x,
        y: patch.y,
        label: patch.label,
        terrain: patch.terrain as MapTerrain,
      }
    }
  }

  const branches = base.fork.branches.map((b) => ({
    ...b,
    nodeIds: draft.branchPaths?.[b.id] ?? b.nodeIds,
  }))

  let spineBeforeFork = base.spineBeforeFork
  let spineAfterFork = base.spineAfterFork

  const resolved = resolvePathFromDraft(base, draft, nodes)
  spineBeforeFork = resolved.spineBeforeFork
  spineAfterFork = resolved.spineAfterFork

  return {
    ...base,
    spineBeforeFork,
    spineAfterFork,
    fork: { ...base.fork, branches },
    nodes,
  }
}

export function layoutToDraft(
  base: KingdomBattleMapLayout,
  effective: KingdomBattleMapLayout,
): MapLayoutDraft {
  const nodes: MapNodeOverrides = {}
  for (const [id, node] of Object.entries(effective.nodes)) {
    nodes[id] = {
      x: node.x,
      y: node.y,
      label: node.label,
      terrain: node.terrain,
    }
  }

  const draft: MapLayoutDraft = { nodes, linearPath: getMainPathIds(effective) }

  if (JSON.stringify(effective.spineBeforeFork) !== JSON.stringify(base.spineBeforeFork)) {
    draft.spineBeforeFork = [...effective.spineBeforeFork]
  }
  if (JSON.stringify(effective.spineAfterFork) !== JSON.stringify(base.spineAfterFork)) {
    draft.spineAfterFork = [...effective.spineAfterFork]
  }

  const branchPaths: Record<string, string[]> = {}
  let branchChanged = false
  for (const branch of effective.fork.branches) {
    const baseBranch = base.fork.branches.find((b) => b.id === branch.id)
    if (baseBranch && JSON.stringify(branch.nodeIds) !== JSON.stringify(baseBranch.nodeIds)) {
      branchPaths[branch.id] = [...branch.nodeIds]
      branchChanged = true
    }
  }
  if (branchChanged) draft.branchPaths = branchPaths

  return draft
}

export function generateNodeId(layout: KingdomBattleMapLayout): string {
  let n = 1
  while (layout.nodes[`wp-add-${n}`]) n++
  return `wp-add-${n}`
}

/** 在当前节点后面插入新节点（线性路径） */
export function insertNodeAfter(
  layout: KingdomBattleMapLayout,
  afterNodeId: string,
  newNode: BattleMapNode,
): KingdomBattleMapLayout {
  const path = getMainPathIds(layout)
  const idx = path.indexOf(afterNodeId)
  const nodes = { ...layout.nodes, [newNode.id]: newNode }
  const newPath = [...path]
  if (idx >= 0) {
    newPath.splice(idx + 1, 0, newNode.id)
  } else {
    newPath.push(newNode.id)
  }
  return applyLinearPath(layout, newPath, nodes)
}

export function orderedNodeIds(layout: KingdomBattleMapLayout): string[] {
  const ids = new Set<string>()
  const ordered: string[] = []
  const push = (id: string) => {
    if (!ids.has(id)) {
      ids.add(id)
      ordered.push(id)
    }
  }
  layout.spineBeforeFork.forEach(push)
  layout.fork.branches.forEach((b) => b.nodeIds.forEach(push))
  push(layout.fork.mergeNodeId)
  layout.spineAfterFork.forEach(push)
  Object.keys(layout.nodes).forEach(push)
  return ordered
}

/** 标注用线性路径（不强制插入 merge，避免删不掉的幽灵节点） */
export function getMainPathIds(layout: KingdomBattleMapLayout): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  const push = (id: string) => {
    if (id && layout.nodes[id] && !seen.has(id)) {
      seen.add(id)
      result.push(id)
    }
  }
  layout.spineBeforeFork.forEach(push)
  layout.spineAfterFork.forEach(push)
  return result
}

function applyLinearPath(
  layout: KingdomBattleMapLayout,
  pathIds: string[],
  nodes: Record<string, BattleMapNode>,
): KingdomBattleMapLayout {
  const linearPath = pathIds.filter((id) => nodes[id])
  return {
    ...layout,
    spineBeforeFork: linearPath,
    spineAfterFork: [],
    nodes,
  }
}

/** 删除线性路径上的节点（至少保留 1 个） */
export function removeNodeFromMainPath(
  layout: KingdomBattleMapLayout,
  nodeId: string,
): KingdomBattleMapLayout | null {
  const path = getMainPathIds(layout)
  if (path.length <= 1 || !path.includes(nodeId)) return null

  const nodes = { ...layout.nodes }
  delete nodes[nodeId]

  const newPath = path.filter((id) => id !== nodeId)
  return applyLinearPath(layout, newPath, nodes)
}

/** 将线性路径节点数调整为 targetCount（少则补、多则删末尾） */
export function resizeMainPath(
  layout: KingdomBattleMapLayout,
  targetCount: number,
): KingdomBattleMapLayout {
  const path = getMainPathIds(layout)
  const count = Math.min(50, Math.max(1, targetCount))
  if (count === path.length) return layout

  if (count > path.length) {
    let next = layout
    for (let i = path.length; i < count; i++) {
      const ids = getMainPathIds(next)
      const lastId = ids[ids.length - 1]
      if (!lastId) break
      next = createNodeAfter(next, lastId).layout
    }
    return next
  }

  const newPath = path.slice(0, count)
  const nodes = { ...layout.nodes }
  for (const id of path.slice(count)) {
    delete nodes[id]
  }
  return applyLinearPath(layout, newPath, nodes)
}

export function createNodeAfter(
  layout: KingdomBattleMapLayout,
  afterNodeId: string,
): { layout: KingdomBattleMapLayout; newNodeId: string } {
  const current = layout.nodes[afterNodeId]
  if (!current) {
    throw new Error(`节点 ${afterNodeId} 不存在`)
  }
  const path = getMainPathIds(layout)
  const idx = path.indexOf(afterNodeId)
  const nextNode = idx >= 0 && idx < path.length - 1 ? layout.nodes[path[idx + 1]] : null
  const round1 = (n: number) => Math.round(n * 10) / 10

  const newId = generateNodeId(layout)
  const newNode: BattleMapNode = {
    id: newId,
    x: round1(nextNode ? (current.x + nextNode.x) / 2 : current.x),
    y: round1(nextNode ? (current.y + nextNode.y) / 2 : Math.max(0, current.y - 3)),
    label: '新路点',
    terrain: 'waypoint',
  }

  return {
    layout: insertNodeAfter(layout, afterNodeId, newNode),
    newNodeId: newId,
  }
}

export function exportFullLayoutCode(
  base: KingdomBattleMapLayout,
  effective: KingdomBattleMapLayout,
): string {
  const linearIds = getMainPathIds(effective)
  const nodeLines = linearIds.map((id) => effective.nodes[id]).filter(Boolean).map((n) => {
    const fields = [
      `id: '${n.id}'`,
      `x: ${n.x}`,
      `y: ${n.y}`,
      `label: '${n.label}'`,
      `terrain: '${n.terrain}'`,
    ]
    if (n.levelId) fields.push(`levelId: '${n.levelId}'`)
    return `  '${n.id}': { ${fields.join(', ')} },`
  })

  const branchLines = effective.fork.branches
    .map((b) => {
      const baseBranch = base.fork.branches.find((x) => x.id === b.id)
      if (!baseBranch) return ''
      if (JSON.stringify(b.nodeIds) === JSON.stringify(baseBranch.nodeIds)) return ''
      return `// 分支 ${b.id}: [${b.nodeIds.map((id) => `'${id}'`).join(', ')}]`
    })
    .filter(Boolean)

  const pathHints = [
    `// spineBeforeFork: [${linearIds.map((id) => `'${id}'`).join(', ')}]`,
    ...branchLines,
  ].filter(Boolean)

  return [
    ...pathHints,
    pathHints.length ? '' : null,
    'const KINGDOM_1_NODES: Record<string, BattleMapNode> = {',
    ...nodeLines,
    '}',
  ]
    .filter((line) => line !== null)
    .join('\n')
}
