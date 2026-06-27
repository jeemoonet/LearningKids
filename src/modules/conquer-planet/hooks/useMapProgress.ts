import { useCallback, useEffect, useRef, useState } from 'react'
import {
  buildActivePath,
  type BattleMapNode,
  type KingdomBattleMapLayout,
} from '../data/kingdomBattleMapLayout'
import { nodeRequiresStepChallenge } from '../data/stepChallenge'
import { getKingdomBattleMapLayout } from '../planetMapConfig'

const STORAGE_KEY = 'conquer-map-progress-v1'
const STEP_DONE_KEY = 'conquer-map-step-done-v1'
/** 单格行进耗时 */
const STEP_MS = 360

interface StoredProgress {
  pathIndex: number
  branchId: string | null
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

function forkIndex(layout: KingdomBattleMapLayout): number {
  return layout.spineBeforeFork.indexOf(layout.fork.nodeId)
}

function maxAllowedPathIndex(
  layout: KingdomBattleMapLayout,
  branchId: string | null,
  conqueredLevelIds: string[],
  stepDoneNodeIds: Set<string>,
): number {
  const pathIds = buildActivePath(layout, branchId)
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
  const [moving, setMoving] = useState(false)
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
    const allowed = maxAllowedPathIndex(layout, branch, conqueredLevelIds, readStepDone(kingdomId))
    const storedIdx = stored?.pathIndex ?? 0
    const clamped = Math.min(storedIdx, allowed)
    setPathIndex(clamped)
    setBranchId(branch)
    if (stored && stored.pathIndex !== clamped) {
      writeKingdom(kingdomId, { pathIndex: clamped, branchId: branch })
    }
  }, [kingdomId, layout, conqueredLevelIds.join(',')])

  const pathIds = layout ? buildActivePath(layout, branchId) : []
  const atFork = Boolean(
    layout &&
      pathIndex === forkIndex(layout) &&
      branchId === null &&
      pathIds[pathIndex] === layout.fork.nodeId,
  )

  // 停在岔路口且无待确认事件时，自动弹出选路（首次加载 / 关闭后重提）
  useEffect(() => {
    if (!layout || moving || pendingArrival) return
    const ids = buildActivePath(layout, branchId)
    const onFork =
      branchId === null &&
      pathIndex === forkIndex(layout) &&
      ids[pathIndex] === layout.fork.nodeId
    if (onFork) {
      setPendingArrival({ nodeId: layout.fork.nodeId, kind: 'fork-arrival' })
    }
  }, [layout, branchId, pathIndex, pendingArrival, moving])

  const persist = useCallback(
    (idx: number, branch: string | null) => {
      writeKingdom(kingdomId, { pathIndex: idx, branchId: branch })
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

  /** 沿路径前进一格，每格必经（关卡/路点试炼未完成则停留） */
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
    setMoving(true)

    const target = pathIndex + 1
    const nextNodeId = pathIds[target]
    const nextNode = layout.nodes[nextNodeId]

    const stepTimer = window.setTimeout(() => {
      setPathIndex(target)
      persist(target, branchId)
    }, STEP_MS)
    timersRef.current.push(stepTimer)

    const finalizeTimer = window.setTimeout(() => {
      setMoving(false)
      if (nextNode?.terrain === 'fork' && branchId === null && nextNodeId === layout.fork.nodeId) {
        setPendingArrival({ nodeId: nextNodeId, kind: 'fork-arrival' })
      } else {
        setPendingArrival({ nodeId: nextNodeId, kind: 'move' })
      }
    }, STEP_MS + 80)
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
    persist,
    clearTimers,
  ])

  const chooseBranch = useCallback(
    (pickedBranchId: string) => {
      if (!layout || !atFork) return

      const branch = layout.fork.branches.find((b) => b.id === pickedBranchId)
      if (!branch) return

      setBranchId(pickedBranchId)
      persist(pathIndex, pickedBranchId)
      setPendingArrival({
        nodeId: layout.fork.nodeId,
        kind: 'fork-choice',
        branchLabel: branch.label,
        branchHint: branch.hint,
      })
    },
    [layout, atFork, pathIndex, persist],
  )

  const resetMapProgress = useCallback(() => {
    clearTimers()
    clearKingdomMapProgress(kingdomId)
    clearKingdomStepProgress(kingdomId)
    setPathIndex(0)
    setBranchId(null)
    setMoving(false)
    setPendingArrival(null)
    setStepDoneNodeIds(new Set())
  }, [kingdomId, clearTimers])

  // 队伍前方的下一格（仅用于方向提示，不可点击）
  const nextNodeId =
    canAdvance && pathIndex < pathIds.length - 1 ? pathIds[pathIndex + 1] : null
  const playerNodeId = pathIds[pathIndex] ?? ''
  const playerPos = playerNode

  return {
    layout,
    pathIds,
    pathIndex,
    branchId,
    atFork,
    atEnd,
    moving,
    canAdvance,
    blockedByLevel,
    blockedByStep,
    blockedByChallenge,
    nextNodeId,
    playerPos,
    playerNodeId,
    pendingArrival,
    clearArrival,
    advanceOneStep,
    chooseBranch,
    resetMapProgress,
    markStepDone,
  }
}
