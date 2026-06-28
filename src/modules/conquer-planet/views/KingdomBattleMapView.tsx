import { useEffect, useMemo, useRef, useState } from 'react'
import { ForwardMovePanel } from '../components/ForwardMovePanel'
import { MapHud } from '../components/MapHud'
import { MapStepChallenge } from '../components/MapStepChallenge'
import { MonsterSprite } from '../components/monsters/MonsterIllustrations'
import { RoadbookSheet } from '../components/RoadbookPanel'
import { SceneArrivalModal } from '../components/SceneArrivalModal'
import {
  buildForkPreviewPaths,
  terrainIcon,
  type BattleMapNode,
  type KingdomBattleMapLayout,
} from '../data/kingdomBattleMapLayout'
import { getKingdomBattleMapLayout } from '../planetMapConfig'
import { getForkArrivalEvent, getForkChoiceEvent, getKingdomRegionLabel, getWaypointEvent } from '../data/sceneEvents'
import { nodeNeedsArrivalChallenge, nodeRequiresStepChallenge } from '../data/stepChallenge'
import { BoardGameMapScene } from '../components/BoardGameMapScene'
import { FantasyTopDownMapScene } from '../components/FantasyTopDownMapScene'
import {
  getKingdomMapImage,
  getKingdomMapVisualStyle,
  ImageKingdomMapScene,
} from '../components/ImageKingdomMapScene'
import { buildParchmentPathD, buildStraightPathD, ParchmentMapScene } from '../components/ParchmentMapScene'
import { KINGDOM_MAP_VIEW } from '../data/mapViewBox'
import { resetKingdomProgress } from '../api'
import { useConquer } from '../ConquerContext'
import { MAP_STEP_MS, useMapProgress, type MapArrival } from '../hooks/useMapProgress'
import { clearKingdomRoadbook } from '../lib/roadbook'
import type { PlanetKingdomSummary, PlanetLevel } from '../types'

interface KingdomBattleMapViewProps {
  kingdom: PlanetKingdomSummary
  onOpenContinentOverview: () => void
  onEnter: (level: PlanetLevel) => void
}

const LEGACY_START = { x: 50, y: 86, label: '出发营地' }
const LEGACY_LEVEL_POSITIONS = [
  { x: 22, y: 62 },
  { x: 78, y: 42 },
  { x: 50, y: 16 },
]

function nodeIcon(level: PlanetLevel): string {
  if (level.kind === 'boss') return '🏯'
  if (level.kind === 'recruit') return '🏘️'
  if (level.kind === 'review') return '🌫️'
  if (level.kind === 'forest') return '🌲'
  return level.icon
}

function pathPointsFromLayout(layout: KingdomBattleMapLayout, pathIds: string[]) {
  return pathIds
    .map((id) => layout.nodes[id])
    .filter((n): n is BattleMapNode => Boolean(n))
    .map((n) => ({ x: n.x, y: n.y }))
}

interface SceneModalContent {
  icon: string
  title: string
  location: string
  body: string
  primaryLabel: string
  enterable?: boolean
  requiresStepChallenge?: boolean
  note?: string
  branchChoices?: Array<{ id: string; label: string; hint: string }>
}

function buildSceneModal(
  arrival: MapArrival,
  node: BattleMapNode,
  level: PlanetLevel | undefined,
  layout: KingdomBattleMapLayout,
  kingdomId: string,
): SceneModalContent | null {
  if (arrival.kind === 'fork-arrival') {
    const branches =
      arrival.nodeId === layout.fork.nodeId
        ? layout.fork.branches
        : layout.fork2?.nodeId === arrival.nodeId
          ? layout.fork2.branches
          : layout.fork.branches
    return {
      icon: '⑂',
      title: '三岔路口',
      location: node.label,
      body: getForkArrivalEvent(),
      primaryLabel: '选择道路',
      branchChoices: branches.map((b) => ({
        id: b.id,
        label: b.label,
        hint: b.hint,
      })),
    }
  }

  if (arrival.kind === 'fork-choice') {
    return {
      icon: '🛤️',
      title: '道路已定',
      location: node.label,
      body: getForkChoiceEvent(arrival.branchLabel ?? '', arrival.branchHint ?? ''),
      primaryLabel: '沿此路前进',
    }
  }

  if (level) return null

  if (nodeRequiresStepChallenge(node)) return null

  return {
    icon: terrainIcon(node.terrain),
    title: node.label,
    location: getKingdomRegionLabel(kingdomId),
    body: getWaypointEvent(node, kingdomId),
    primaryLabel: '继续探索',
    enterable: false,
  }
}

function MapNodeMarker({
  node,
  level,
  isDone,
  isPlayerHere,
  isNext,
  isCurrentLevel,
  reviewBadge,
  onActivate,
}: {
  node: BattleMapNode
  level?: PlanetLevel
  isDone: boolean
  isPlayerHere: boolean
  isNext: boolean
  isCurrentLevel: boolean
  reviewBadge: string
  onActivate?: () => void
}) {
  const isBoss = level?.kind === 'boss'
  const seal = level ? nodeIcon(level) : terrainIcon(node.terrain)
  const label = level ? (isBoss ? `王宫 · ${level.name}` : node.label) : node.label
  const interactive = Boolean(onActivate)

  const className = [
    'cp-map-node',
    level ? `cp-map-node--${level.kind}` : `cp-map-node--${node.terrain}`,
    isDone ? 'cp-map-node--done' : '',
    isBoss ? 'cp-map-node--palace' : '',
    !level ? 'cp-map-node--waypoint' : '',
    isPlayerHere ? 'cp-map-node--player-here' : '',
    isNext ? 'cp-map-node--next' : '',
    isCurrentLevel ? 'cp-map-node--current' : '',
    interactive ? 'cp-map-node--interactive' : 'cp-map-node--marker',
  ]
    .filter(Boolean)
    .join(' ')

  const content = (
    <>
      <span className="cp-map-node__seal">{seal}</span>
      <span className="cp-map-node__label">{label}</span>
      {isDone && <span className="cp-map-node__badge cp-map-node__badge--done">已征服</span>}
      {isCurrentLevel && !isDone && (
        <span className="cp-map-node__badge cp-map-node__badge--current">当前</span>
      )}
      {isNext && <span className="cp-map-node__badge cp-map-node__badge--next">下一站</span>}
      {reviewBadge && (
        <span className="cp-map-node__badge cp-map-node__badge--review">{reviewBadge}</span>
      )}
    </>
  )

  if (!interactive) {
    return (
      <div
        className={className}
        style={{ left: `${node.x}%`, top: `${node.y}%` }}
        aria-hidden={!isPlayerHere && !level}
      >
        {content}
      </div>
    )
  }

  return (
    <button
      type="button"
      className={className}
      style={{ left: `${node.x}%`, top: `${node.y}%` }}
      onClick={onActivate}
      aria-label={
        isCurrentLevel && level
          ? `进入关卡：${level.name}`
          : isNext
            ? `前进至：${label}`
            : label
      }
    >
      {content}
    </button>
  )
}

function MapPlayerToken({
  node,
  fromNode,
  toNode,
  moving,
}: {
  node: BattleMapNode | undefined
  fromNode?: BattleMapNode
  toNode?: BattleMapNode
  moving: boolean
}) {
  const rafRef = useRef<number | undefined>(undefined)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const animating = moving && fromNode && toNode

  useEffect(() => {
    if (!node) {
      setPos(null)
      return
    }

    if (!animating) {
      setPos({ x: node.x, y: node.y })
      return
    }

    setPos({ x: fromNode.x, y: fromNode.y })
    const start = performance.now()

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / MAP_STEP_MS)
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
      setPos({
        x: fromNode.x + (toNode.x - fromNode.x) * eased,
        y: fromNode.y + (toNode.y - fromNode.y) * eased,
      })
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [node, animating, fromNode, toNode])

  if (!node || !pos) return null

  return (
    <>
      {animating && (
        <div className="cp-map-move-trail" aria-hidden="true">
          <span
            className="cp-map-move-trail__dust"
            style={{ left: `${fromNode!.x}%`, top: `${fromNode!.y}%` }}
          />
          <span
            className="cp-map-move-trail__dust cp-map-move-trail__dust--mid"
            style={{
              left: `${(fromNode!.x + toNode!.x) / 2}%`,
              top: `${(fromNode!.y + toNode!.y) / 2}%`,
            }}
          />
        </div>
      )}
      <div
        className={[
          'cp-map-player-floater',
          moving ? 'cp-map-player-floater--moving' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
        aria-hidden="true"
      >
        <span className="cp-map-player-marker">
          <span className="cp-map-player-marker__pin">
            <span className="cp-map-player-marker__avatar">🧝</span>
          </span>
        </span>
        <span className="cp-map-player-anchor">
          <span className="cp-map-player-anchor__dot" />
          <span className="cp-map-player-anchor__ring" />
          {moving && <span className="cp-map-player-anchor__ping" />}
        </span>
      </div>
    </>
  )
}

function RichKingdomMap({
  kingdom,
  onOpenContinentOverview,
  onEnter,
}: KingdomBattleMapViewProps) {
  const { session, setSession } = useConquer()
  const conquered = session?.conqueredLevelIds ?? []
  const [resetting, setResetting] = useState(false)
  const [roadbookOpen, setRoadbookOpen] = useState(false)
  const [stepChallengeNodeId, setStepChallengeNodeId] = useState<string | null>(null)
  const layout = getKingdomBattleMapLayout(kingdom.id)

  const {
    pathIds,
    pathIndex,
    branchId,
    branchId2,
    moving,
    canAdvance,
    atEnd,
    nextNodeId,
    blockedByLevel,
    blockedByStep,
    moveFromNode,
    moveToNode,
    pendingArrival,
    clearArrival,
    advanceOneStep,
    chooseBranch,
    resetMapProgress,
    markStepDone,
  } = useMapProgress(kingdom.id, conquered, layout)
  const levels = kingdom.levels
  const levelById = useMemo(() => new Map(levels.map((l) => [l.id, l])), [levels])
  const bossLevel = levels.find((l) => l.kind === 'boss')
  const mapStyle = getKingdomMapVisualStyle(kingdom.id)
  const mapImage = getKingdomMapImage(kingdom.id)
  const usesRealBg = Boolean(mapImage) && (mapStyle === 'image' || mapStyle === 'boardgame')
  const viewW = usesRealBg ? KINGDOM_MAP_VIEW.w : 1000
  const viewH = usesRealBg ? KINGDOM_MAP_VIEW.h : 700
  const swayScale = usesRealBg ? 0.25 : 1

  const pathD = useMemo(() => {
    if (!layout) return ''
    const points = pathPointsFromLayout(layout, pathIds)
    if (usesRealBg) {
      return buildStraightPathD(points, viewW, viewH)
    }
    return buildParchmentPathD(points, viewW, viewH, swayScale)
  }, [layout, pathIds, swayScale, viewW, viewH, usesRealBg])

  const alternatePaths = useMemo(() => {
    if (!layout) return undefined
    if (branchId) {
      const unchosen = layout.fork.branches.find((b) => b.id !== branchId)
      if (!unchosen) return undefined
      const before = layout.spineBeforeFork.slice(0, -1)
      const after = [layout.fork.mergeNodeId, ...layout.spineAfterFork]
      const ids = [...before, layout.fork.nodeId, ...unchosen.nodeIds, ...after]
      return [buildStraightPathD(pathPointsFromLayout(layout, ids), viewW, viewH)]
    }
    return buildForkPreviewPaths(layout, branchId).map((ids) =>
      buildStraightPathD(pathPointsFromLayout(layout, ids), viewW, viewH),
    )
  }, [layout, branchId, branchId2, swayScale, viewW, viewH, usesRealBg])
  const playerNodeId = pathIds[pathIndex]
  const playerNode = layout?.nodes[playerNodeId]
  const currentLevel = playerNode?.levelId ? levelById.get(playerNode.levelId) : undefined

  const sceneModal = useMemo(() => {
    if (!pendingArrival || !layout) return null
    const node = layout.nodes[pendingArrival.nodeId]
    if (!node) return null
    const level = node.levelId ? levelById.get(node.levelId) : undefined
    return buildSceneModal(pendingArrival, node, level, layout, kingdom.id)
  }, [pendingArrival, layout, levelById])

  const startStepChallenge = (nodeId: string) => {
    setStepChallengeNodeId(nodeId)
  }

  useEffect(() => {
    if (!pendingArrival || pendingArrival.kind !== 'move' || !layout) return
    const node = layout.nodes[pendingArrival.nodeId]
    if (!node) return
    const level = node.levelId ? levelById.get(node.levelId) : undefined

    if (level && !level.done) {
      clearArrival()
      onEnter(level)
      return
    }

    if (nodeNeedsArrivalChallenge(node, level)) {
      clearArrival()
      startStepChallenge(node.id)
    }
  }, [pendingArrival, layout, levelById, clearArrival, onEnter])

  const handleSceneConfirm = () => {
    if (!pendingArrival || !layout || !sceneModal) {
      clearArrival()
      return
    }
    const node = layout.nodes[pendingArrival.nodeId]
    const level = node?.levelId ? levelById.get(node.levelId) : undefined

    if (sceneModal.requiresStepChallenge && node) {
      clearArrival()
      startStepChallenge(node.id)
      return
    }

    clearArrival()

    if (sceneModal.enterable && level) {
      onEnter(level)
    }
  }

  const handleNodeActivate = (nodeId: string) => {
    if (!layout) return
    const node = layout.nodes[nodeId]
    if (!node) return

    if (nodeId === playerNodeId && node.levelId) {
      const level = levelById.get(node.levelId)
      if (level && !level.done) {
        onEnter(level)
      }
      return
    }

    if (nodeId === playerNodeId && blockedByStep) {
      startStepChallenge(nodeId)
    }
  }

  const handleResetToStart = async () => {
    if (
      !window.confirm(
        '确定回到起点？本王国的关卡征服进度与地图位置将清零。',
      )
    ) {
      return
    }
    setResetting(true)
    try {
      const { session: next } = await resetKingdomProgress(kingdom.id)
      resetMapProgress()
      clearKingdomRoadbook(kingdom.id)
      setSession(next)
    } catch (err) {
      window.alert(err instanceof Error ? err.message : '重置失败')
    } finally {
      setResetting(false)
    }
  }

  const useIllustratedMap =
    mapStyle === 'fantasy-topdown' || mapStyle === 'image' || mapStyle === 'boardgame'

  if (!session || !layout) return null

  return (
    <div className={`cp-map-layout cp-map-layout--immersive${useIllustratedMap ? ' cp-map-layout--fantasy' : ''}`}>
      <div
        className={[
          'cp-world-map',
          'cp-world-map--immersive',
          mapStyle === 'image' ? 'cp-world-map--image' : '',
          usesRealBg ? 'cp-world-map--real-bg' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className="cp-world-map__canvas cp-world-map__canvas--immersive">
          {mapStyle === 'boardgame' ? (
            <BoardGameMapScene
              pathD=""
              kingdomName={kingdom.name}
              immersive
              layout={layout}
              backgroundSrc={mapImage ?? undefined}
            />
          ) : mapStyle === 'image' && mapImage ? (
            <ImageKingdomMapScene imageSrc={mapImage} pathD="" immersive />
          ) : mapStyle === 'fantasy-topdown' ? (
            <FantasyTopDownMapScene
              pathD=""
              kingdomName={kingdom.name}
              monsterName={kingdom.monster.name}
              immersive
              layout={layout}
            />
          ) : (
            <ParchmentMapScene
              pathD={pathD}
              kingdomName={kingdom.name}
              monsterId={kingdom.monster.id}
              monsterName={kingdom.monster.name}
              immersive
              alternatePaths={alternatePaths}
            />
          )}

          <MapHud
            title={`王国 ${kingdom.order} · ${kingdom.name}`}
            subtitle={kingdom.subtitle}
            leading={
              <button type="button" className="cp-map-hud__back" onClick={onOpenContinentOverview}>
                大陆
              </button>
            }
            trailing={
              <div className="cp-map-hud__monster" title={kingdom.monster.epithet}>
                <MonsterSprite id={kingdom.monster.id} size={40} title={kingdom.monster.name} />
                <span>{kingdom.monster.name}</span>
              </div>
            }
          />

          {bossLevel && !useIllustratedMap && (
            <div
              className="cp-battle-map-monster"
              style={{
                left: `${layout.nodes['wp-add-1']?.x ?? layout.nodes['boss-1']?.x ?? 48}%`,
                top: `${(layout.nodes['wp-add-1']?.y ?? layout.nodes['boss-1']?.y ?? 5) - 6}%`,
              }}
              aria-hidden="true"
            >
              <MonsterSprite id={kingdom.monster.id} size={72} title={kingdom.monster.name} />
            </div>
          )}

          <div className="cp-world-map__nodes">
            {pathIds.map((nodeId) => {
              const node = layout.nodes[nodeId]
              if (!node) return null
              const level = node.levelId ? levelById.get(node.levelId) : undefined
              const isPlayerHere = nodeId === playerNodeId
              const pathOrder = pathIds.indexOf(nodeId)
              const isReachable = pathOrder >= 0 && pathOrder <= pathIndex

              if (!isReachable && !level) return null

              const isNext = nodeId === nextNodeId
              const isCurrentLevel =
                isPlayerHere && level && !level.done && blockedByLevel
              const isCurrentStep = isPlayerHere && !level && blockedByStep

              const reviewBadge =
                level?.kind === 'review' && session.dueReviewCount > 0
                  ? `${session.dueReviewCount} 名走散`
                  : ''

              return (
                <MapNodeMarker
                  key={nodeId}
                  node={node}
                  level={level}
                  isDone={!!level?.done}
                  isPlayerHere={isPlayerHere}
                  isNext={isNext}
                  isCurrentLevel={!!isCurrentLevel || !!isCurrentStep}
                  reviewBadge={reviewBadge}
                  onActivate={
                    isCurrentLevel || isCurrentStep ? () => handleNodeActivate(nodeId) : undefined
                  }
                />
              )
            })}
          </div>

          <MapPlayerToken
            node={playerNode}
            fromNode={moveFromNode}
            toNode={moveToNode}
            moving={moving}
          />
        </div>

        <div className={`cp-map-overlay${moving ? ' cp-map-overlay--moving' : ''}`}>
            <ForwardMovePanel
            canAdvance={canAdvance}
            moving={moving}
            atEnd={atEnd}
            blockedByLevel={blockedByLevel}
            blockedByStep={blockedByStep}
            onAdvance={advanceOneStep}
            onReset={handleResetToStart}
            resetting={resetting}
            onOpenRoadbook={() => setRoadbookOpen(true)}
            onEnterLevel={
              blockedByLevel && currentLevel && !currentLevel.done
                ? () => onEnter(currentLevel)
                : undefined
            }
            onEnterStep={
              blockedByStep && !blockedByLevel && playerNode
                ? () => startStepChallenge(playerNode.id)
                : undefined
            }
          />

          {roadbookOpen && (
            <RoadbookSheet
              open
              kingdomId={kingdom.id}
              conqueredLevels={levels.filter((l) => l.done)}
              onClose={() => setRoadbookOpen(false)}
            />
          )}

          {stepChallengeNodeId && session && layout.nodes[stepChallengeNodeId] && (
            <MapStepChallenge
              session={session}
              kingdomId={kingdom.id}
              node={layout.nodes[stepChallengeNodeId]}
              level={
                layout.nodes[stepChallengeNodeId].levelId
                  ? levelById.get(layout.nodes[stepChallengeNodeId].levelId!)
                  : undefined
              }
              variant={
                layout.nodes[stepChallengeNodeId].levelId ? 'consolidate' : 'waypoint'
              }
              onComplete={() => {
                const node = layout.nodes[stepChallengeNodeId]
                if (node && nodeRequiresStepChallenge(node)) {
                  markStepDone(stepChallengeNodeId)
                }
                setStepChallengeNodeId(null)
              }}
              onExit={() => setStepChallengeNodeId(null)}
            />
          )}

          {sceneModal && pendingArrival && (
            <SceneArrivalModal
              open
              icon={sceneModal.icon}
              title={sceneModal.title}
              location={sceneModal.location}
              body={sceneModal.body}
              note={sceneModal.note}
              primaryLabel={sceneModal.primaryLabel}
              branchChoices={sceneModal.branchChoices}
              onBranchChoice={(id) => {
                chooseBranch(id)
              }}
              onConfirm={handleSceneConfirm}
            />
          )}
        </div>

        <p className="cp-world-map__hint cp-world-map__hint--float">
          点击右下角箭头逐格前进；每站须完成关卡或路途试炼，通关后再继续
        </p>
      </div>
    </div>
  )
}

function LegacyKingdomMap({ kingdom, onOpenContinentOverview, onEnter }: KingdomBattleMapViewProps) {
  const { session } = useConquer()
  const levels = kingdom.levels
  const bossLevel = levels.find((l) => l.kind === 'boss')

  const currentLevelIdx = useMemo(() => {
    const idx = levels.findIndex((lv) => !lv.done)
    return idx === -1 ? levels.length : idx
  }, [levels])

  const pathPoints = useMemo(() => {
    const levelPts = levels.map((_, i) => LEGACY_LEVEL_POSITIONS[i] ?? LEGACY_LEVEL_POSITIONS.at(-1)!)
    return [LEGACY_START, ...levelPts]
  }, [levels])

  const pathD = useMemo(() => buildParchmentPathD(pathPoints), [pathPoints])

  if (!session) return null

  return (
    <div className="cp-map-layout cp-map-layout--immersive">
      <div className="cp-world-map cp-world-map--immersive">
        <div className="cp-world-map__canvas cp-world-map__canvas--immersive">
          <ParchmentMapScene
            pathD={pathD}
            kingdomName={kingdom.name}
            monsterId={kingdom.monster.id}
            monsterName={kingdom.monster.name}
            immersive
          />

          <MapHud
            title={`王国 ${kingdom.order} · ${kingdom.name}`}
            subtitle={kingdom.subtitle}
            leading={
              <button type="button" className="cp-map-hud__back" onClick={onOpenContinentOverview}>
                大陆
              </button>
            }
            trailing={
              <div className="cp-map-hud__monster" title={kingdom.monster.epithet}>
                <MonsterSprite id={kingdom.monster.id} size={40} title={kingdom.monster.name} />
                <span>{kingdom.monster.name}</span>
              </div>
            }
          />

          {bossLevel && (
            <div
              className="cp-battle-map-monster"
              style={{
                left: `${LEGACY_LEVEL_POSITIONS[levels.length - 1]?.x ?? 50}%`,
                top: `${(LEGACY_LEVEL_POSITIONS[levels.length - 1]?.y ?? 16) - 14}%`,
              }}
              aria-hidden="true"
            >
              <MonsterSprite id={kingdom.monster.id} size={72} title={kingdom.monster.name} />
            </div>
          )}

          <div className="cp-world-map__nodes">
            <div
              className="cp-map-node cp-map-node--start"
              style={{ left: `${LEGACY_START.x}%`, top: `${LEGACY_START.y}%` }}
            >
              <span className="cp-map-node__seal">⚑</span>
              <span className="cp-map-node__label">{LEGACY_START.label}</span>
            </div>

            {levels.map((lv, idx) => {
              const pos = LEGACY_LEVEL_POSITIONS[idx] ?? LEGACY_LEVEL_POSITIONS.at(-1)!
              const isDone = !!lv.done
              const isCurrent = idx === currentLevelIdx
              const isBoss = lv.kind === 'boss'
              const reviewBadge =
                lv.kind === 'review' && session.dueReviewCount > 0
                  ? `${session.dueReviewCount} 名走散`
                  : ''

              return (
                <button
                  key={lv.id}
                  type="button"
                  className={[
                    'cp-map-node',
                    `cp-map-node--${lv.kind}`,
                    isDone ? 'cp-map-node--done' : '',
                    isCurrent ? 'cp-map-node--current' : '',
                    isBoss ? 'cp-map-node--palace' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                  onClick={() => onEnter(lv)}
                  aria-label={`${isBoss ? '王宫' : `关卡 ${idx + 1}`}：${lv.name}`}
                >
                  <span className="cp-map-node__seal">{nodeIcon(lv)}</span>
                  <span className="cp-map-node__label">
                    {isBoss ? '王宫' : `关卡 ${idx + 1}`} · {lv.name}
                  </span>
                  {isDone && <span className="cp-map-node__badge cp-map-node__badge--done">已征服</span>}
                  {reviewBadge && (
                    <span className="cp-map-node__badge cp-map-node__badge--review">{reviewBadge}</span>
                  )}
                  {isCurrent && !isDone && (
                    <span className="cp-map-node__badge cp-map-node__badge--current">当前</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <p className="cp-world-map__hint cp-world-map__hint--float">
          循路穿越山谷森林，直取 {kingdom.monster.name} 盘踞的王宫
        </p>
      </div>
    </div>
  )
}

export function KingdomBattleMapView(props: KingdomBattleMapViewProps) {
  const { kingdom } = props

  if (kingdom.levels.length === 0) {
    return (
      <div className="cp-map-layout">
        <div className="cp-kingdom-soon">
          <MonsterSprite id={kingdom.monster.id} size={140} title={kingdom.monster.name} />
          <h3>{kingdom.name} 即将开放</h3>
          <p>下一版将加入完整关卡与 {kingdom.monster.name} 决战。</p>
          <button type="button" className="cp-btn" onClick={props.onOpenContinentOverview}>
            查看大陆概览
          </button>
        </div>
      </div>
    )
  }

  if (getKingdomBattleMapLayout(kingdom.id)) {
    return <RichKingdomMap {...props} />
  }

  return <LegacyKingdomMap {...props} />
}
