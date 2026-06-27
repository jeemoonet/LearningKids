/** 王国底图原生分辨率（kingdom-1-map.png 为 1024×571） */
export const KINGDOM_MAP_VIEW = { w: 1024, h: 571 } as const

const OVERRIDE_KEY = (kingdomId: string) => `cp-map-node-overrides:${kingdomId}`

export interface MapNodeOverride {
  x: number
  y: number
  label?: string
  terrain?: string
}

export type MapNodeOverrides = Record<string, MapNodeOverride>

/** @deprecated 兼容旧版仅坐标覆盖 */
export type MapNodeCoordOverride = MapNodeOverrides

export function loadMapNodeOverrides(kingdomId: string): MapNodeOverrides | null {
  try {
    const raw = localStorage.getItem(OVERRIDE_KEY(kingdomId))
    if (!raw) return null
    return JSON.parse(raw) as MapNodeOverrides
  } catch {
    return null
  }
}

export function saveMapNodeOverrides(kingdomId: string, overrides: MapNodeOverrides): void {
  localStorage.setItem(OVERRIDE_KEY(kingdomId), JSON.stringify(overrides))
}

export function clearMapNodeOverrides(kingdomId: string): void {
  localStorage.removeItem(OVERRIDE_KEY(kingdomId))
}

/** 将 localStorage 中的覆盖合并进布局副本 */
export function applyMapNodeOverrides<
  T extends { nodes: Record<string, { x: number; y: number; label: string; terrain: string }> },
>(layout: T, overrides: MapNodeOverrides | null): T {
  if (!overrides || Object.keys(overrides).length === 0) return layout
  const nodes = { ...layout.nodes }
  for (const [id, patch] of Object.entries(overrides)) {
    if (!nodes[id]) continue
    nodes[id] = {
      ...nodes[id],
      x: patch.x,
      y: patch.y,
      ...(patch.label != null ? { label: patch.label } : {}),
      ...(patch.terrain != null ? { terrain: patch.terrain as T['nodes'][string]['terrain'] } : {}),
    }
  }
  return { ...layout, nodes }
}

export function exportNodeCoordsCode(
  nodes: Record<string, { id: string; x: number; y: number; label: string; terrain: string; levelId?: string }>,
): string {
  const lines = Object.values(nodes).map((n) => {
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
  return `const KINGDOM_1_NODES: Record<string, BattleMapNode> = {\n${lines.join('\n')}\n}`
}

export function isMapEditMode(): boolean {
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).has('mapEdit')
}
