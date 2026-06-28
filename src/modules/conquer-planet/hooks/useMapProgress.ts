import { useCallback, useEffect, useRef, useState } from 'react'
import {
  activeForkNodeId,
  buildActivePath,
  type BattleMapNode,
  type KingdomBattleMapLayout,
} from '../data/kingdomBattleMapLayout'
import { nodeRequiresStepChallenge } from '../data/stepChallenge'
import { getKingdomBattleMapLayout } from '../planetMapConfig'

const STORAGE_KEY = 'conquer-map-progress-v1'
const STEP_DONE_KEY = 'conquer-map-step-done-v1'
/** 单格行进耗时 */
export const MAP_STEP_MS = 680

interface StoredProgress {
  pathIndex: number
  branchId: string | null
  branchId2?: string | null
}

export type MapArrivalKind = 'move' | 'fork-arrival' | 'fork-choice'

export interface MapArrival {
  nodeId: string
  kind: MapArrivalKind
  branchLabel?: string
  branchHint?: string
}

function readAll(): Record<string, StoredProgress> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, StoredProgress>
  } catch {
    return {}
  }
}

function writeKingdom(kingdomId: string, data: StoredProgress) {
  const all = readAll()
  all[kingdomId] = data
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
}

function readStepDone(kingdomId: string): Set<string> {
  try {
    const raw = localStorage.getItem(STEP_DONE_KEY)
    if (!raw) return new Set()
    const all = JSON.parse(raw) as Record<string, string[]>
    return new Set(all[kingdomId] ?? [])
  } catch {
    return new Set()
  }
}

function writeStepDone(kingdomId: string, nodeIds: Set<string>) {
  const all: Record<string, string[]> = {}
  try {
    const raw = localStorage.getItem(STEP_DONE_KEY)
    if (raw) Object.assign(all, JSON.parse(raw) as Record<string, string[]>)
  } catch {
    /* ignore */
  }
  all[kingdomId] = [...nodeIds]
  localStorage.setItem(STEP_DONE_KEY, JSON.stringify(all))
}

export function clearKingdomStepProgress(kingdomId: string) {
  const all: Record<string, string[]> = {}
  try {
    const raw = localStorage.getItem(STEP_DONE_KEY)
    if (raw) Object.assign(all, JSON.parse(raw) as Record<string, string[]>)
  } catch {
    /* ignore */
  }
  delete all[kingdomId]
  localStorage.setItem(STEP_DONE_KEY, JSON.stringify(all))
}

export function clearKingdomMapProgress(kingdomId: string) {
  const all = readAll()
  delete all[kingdomId]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
}

function layoutForkIsActive(layout: KingdomBattleMapLayout): boolean {
  if (!layout.nodes[layout.fork.nodeId]) return false
  return layout.fork.branches.some((b) => b.nodeIds.length > 0)
}

function layoutFork2IsActive(layout: KingdomBattleMapLayout): boolean {
  if (!layout.fork2) return false
  if (!layout.nodes[layout.fork2.nodeId]) return false
  return layout.fork2.branches.some((b) => b.nodeIds.length > 0)
}

function activeForkBranches(
  layout: KingdomBattleMapLayout,
  branchId: string | null,
  branchId2: string | null,
) {
  const pendingForkId = activeForkNodeId(layout, branchId, branchId2)
  if (!pendingForkId) return null
  if (pendingForkId === layout.fork.nodeId) return layout.fork.branches
  if (layout.fork2 && pendingForkId === layout.fork2.nodeId) return layout.fork2.branches
  return null
}

function maxAllowedPathIndex(
  layout: KingdomBattleMapLayout,
  branchId: string | null,
  branchId2: string | null,
  conqueredLevelIds: string[],
  stepDoneNodeIds: Set<string>,
): number {
  const pathIds = buildActivePath(layout, branchId, branchId2)
  for (let i = 0; i < pathIds.length; i++) {
    const node = layout.nodes[pathIds[i]]
    if (node?.levelId && !conqueredLevelIds.includes(node.levelId)) {
      return i
    }
    if (node && nodeRequiresStepChallenge(node) && !stepDoneNodeIds.has(node.id)) {
      return i
    }
  }
  return Math.max(0, pathIds.length - 1)
}

function currentNode(
  layout: KingdomBattleMapLayout,
  pathIds: string[],
  pathIndex: number,
): BattleMapNode | undefined {
  return layout.nodes[pathIds[pathIndex]]
}

export function useMapProgress(
  kingdomId: string,
  conqueredLevelIds: string[],
  layoutOverride?: KingdomBattleMapLayout | null,
) {
  const fileLayout = getKingdomBattleMapLayout(kingdomId)
  const layout = layoutOverride ?? fileLayout
  const [pathIndex, setPathIndex] = useState(0)
  const [branchId, setBranchId] = useState<string | null>(null)
  const [branchId2, setBranchId2] = useState<string | null>(null)
  const [moving, setMoving] = useState(false)
  const [moveFromIndex, setMoveFromIndex] = useState<number | null>(null)
  const [pendingArrival, setPendingArrival] = useState<MapArrival | null>(null)
  const [stepDoneNodeIds, setStepDoneNodeIds] = useState<Set<string>>(() => readStepDone(kingdomId))
  const timersRef = useRef<number[]>([])

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id))
    timersRef.current = []
  }, [])

  useEffect(() => () => clearTimers(), [clearTimers])

  useEffect(() => {
    if (!layout) return
    const stored = readAll()[kingdomId]
    const branch = stored?.branchId ?? null
    const branch2 = stored?.branchId2 ?? null
    const allowed = maxAllowedPathIndex(
      layout,
      branch,
      branch2,
      conqueredLevelIds,
      readStepDone(kingdomId),
    )
    const storedIdx = stored?.pathIndex ?? 0
    const clamped = Math.min(storedIdx, allowed)
    setPathIndex(clamped)
    setBranchId(branch)
    setBranchId2(branch2)
    if (stored && stored.pathIndex !== clamped) {
      writeKingdom(kingdomId, { pathIndex: clamped, branchId: branch, branchId2: branch2 })
    }
  }, [kingdomId, layout, conqueredLevelIds.join(',')])

  const pathIds = layout ? buildActivePath(layout, branchId, branchId2) : []
  const pendingForkId = layout ? activeForkNodeId(layout, branchId, branchId2) : null
  const atFork = Boolean(
    layout &&
      pendingForkId &&
      pathIndex === pathIds.indexOf(pendingForkId) &&
      pathIds[pathIndex] === pendingForkId,
  )

  useEffect(() => {
    if (!layout || moving || pendingArrival) return
    if (!atFork || !pendingForkId) return
    setPendingArrival({ nodeId: pendingForkId, kind: 'fork-arrival' })
  }, [layout, atFork, pendingForkId, pendingArrival, moving])

  const persist = useCallback(
    (idx: number, branch: string | null, branch2: string | null) => {
      writeKingdom(kingdomId, { pathIndex: idx, branchId: branch, branchId2: branch2 })
    },
    [kingdomId],
  )

  const clearArrival = useCallback(() => setPendingArrival(null), [])

  const atEnd = pathIndex >= pathIds.length - 1 && !atFork
  const playerNode = layout ? currentNode(layout, pathIds, pathIndex) : undefined
  const blockedByLevel = Boolean(
    playerNode?.levelId && !conqueredLevelIds.includes(playerNode.levelId),
  )
  const blockedByStep = Boolean(
    playerNode &&
      nodeRequiresStepChallenge(playerNode) &&
      !stepDoneNodeIds.has(playerNode.id),
  )
  const blockedByChallenge = blockedByLevel || blockedByStep

  const canAdvance =
    !!layout &&
    !moving &&
    !pendingArrival &&
    !atFork &&
    !atEnd &&
    !blockedByChallenge

  const markStepDone = useCallback(
    (nodeId: string) => {
      setStepDoneNodeIds((prev) => {
        const next = new Set(prev)
        next.add(nodeId)
        writeStepDone(kingdomId, next)
        return next
      })
    },
    [kingdomId],
  )

  const advanceOneStep = useCallback(() => {
    if (
      !layout ||
      moving ||
      pendingArrival ||
      atFork ||
      blockedByChallenge ||
      pathIndex >= pathIds.length - 1
    ) {
      return
    }

    clearTimers()
    setMoveFromIndex(pathIndex)
    setMoving(true)

    const target = pathIndex + 1
    const nextNodeId = pathIds[target]
    const nextNode = layout.nodes[nextNodeId]

    const stepTimer = window.setTimeout(() => {
      setPathIndex(target)
      setMoveFromIndex(null)
      persist(target, branchId, branchId2)
    }, MAP_STEP_MS)
    timersRef.current.push(stepTimer)

    const finalizeTimer = window.setTimeout(() => {
      setMoving(false)
      const nextForkId = activeForkNodeId(layout, branchId, branchId2)
      if (nextNode?.terrain === 'fork' && nextNodeId === nextForkId) {
        setPendingArrival({ nodeId: nextNodeId, kind: 'fork-arrival' })
      } else {
        setPendingArrival({ nodeId: nextNodeId, kind: 'move' })
      }
    }, MAP_STEP_MS + 80)
    timersRef.current.push(finalizeTimer)
  }, [
    layout,
    moving,
    pendingArrival,
    atFork,
    blockedByChallenge,
    pathIndex,
    pathIds,
    branchId,
    branchId2,
    persist,
    clearTimers,
  ])

  const chooseBranch = useCallback(
    (pickedBranchId: string) => {
      if (!layout || !atFork || !pendingForkId) return

      const branches = activeForkBranches(layout, branchId, branchId2)
      const branch = branches?.find((b) => b.id === pickedBranchId)
      if (!branch) return

      if (pendingForkId === layout.fork.nodeId) {
        setBranchId(pickedBranchId)
        persist(pathIndex, pickedBranchId, branchId2)
      } else if (layout.fork2 && pendingForkId === layout.fork2.nodeId) {
        setBranchId2(pickedBranchId)
        persist(pathIndex, branchId, pickedBranchId)
      }

      setPendingArrival({
        nodeId: pendingForkId,
        kind: 'fork-choice',
        branchLabel: branch.label,
        branchHint: branch.hint,
      })
    },
    [layout, atFork, pendingForkId, branchId, branchId2, pathIndex, persist],
  )

  const resetMapProgress = useCallback(() => {
    clearTimers()
    clearKingdomMapProgress(kingdomId)
    clearKingdomStepProgress(kingdomId)
    setPathIndex(0)
    setBranchId(null)
    setBranchId2(null)
    setMoveFromIndex(null)
    setMoving(false)
    setPendingArrival(null)
    setStepDoneNodeIds(new Set())
  }, [kingdomId, clearTimers])

  const nextNodeId =
    canAdvance && pathIndex < pathIds.length - 1 ? pathIds[pathIndex + 1] : null
  const playerNodeId = pathIds[pathIndex] ?? ''
  const moveFromNode =
    moveFromIndex !== null && layout ? layout.nodes[pathIds[moveFromIndex]] : undefined
  const moveToNode =
    moveFromIndex !== null && layout
      ? layout.nodes[pathIds[moveFromIndex + 1]]
      : undefined

  return {
    layout,
    pathIds,
    pathIndex,
    branchId,
    branchId2,
    atFork,
    atEnd,
    moving,
    canAdvance,
    blockedByLevel,
    blockedByStep,
    blockedByChallenge,
    nextNodeId,
    playerPos: playerNode,
    playerNodeId,
    moveFromIndex,
    moveFromNode,
    moveToNode,
    pendingArrival,
    clearArrival,
    advanceOneStep,
    chooseBranch,
    resetMapProgress,
    markStepDone,
    layoutForkIsActive: layout ? layoutForkIsActive(layout) : false,
    layoutFork2IsActive: layout ? layoutFork2IsActive(layout) : false,
    activeForkBranches: layout
      ? activeForkBranches(layout, branchId, branchId2)
      : null,
  }
}
