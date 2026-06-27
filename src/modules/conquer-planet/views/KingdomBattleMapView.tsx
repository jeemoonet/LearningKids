import { useEffect, useMemo, useRef, useState } from 'react'
import { ForwardMovePanel } from '../components/ForwardMovePanel'
import { MapHud } from '../components/MapHud'
import { MapLayoutEditor } from '../components/MapLayoutEditor'
import { MonsterSprite } from '../components/monsters/MonsterIllustrations'
import { SceneArrivalModal } from '../components/SceneArrivalModal'
import {
  buildForkPreviewPaths,
  terrainIcon,
  type BattleMapNode,
  type KingdomBattleMapLayout,
} from '../data/kingdomBattleMapLayout'
import { getKingdomBattleMapLayout } from '../planetMapConfig'
import {
  getForkArrivalEvent,
  getForkChoiceEvent,
  getLevelEvent,
  getLevelLearningNote,
  getWaypointEvent,
} from '../data/sceneEvents'
import { getLevelLearningProfile } from '../data/levelLearningMethods'
import { BoardGameMapScene } from '../components/BoardGameMapScene'
import { FantasyTopDownMapScene } from '../components/FantasyTopDownMapScene'
import {
  getKingdomMapImage,
  getKingdomMapVisualStyle,
  ImageKingdomMapScene,
} from '../components/ImageKingdomMapScene'
import { buildParchmentPathD, buildStraightPathD, ParchmentMapScene } from '../components/ParchmentMapScene'
import {
  isMapEditMode,
  KINGDOM_MAP_VIEW,
} from '../data/mapViewBox'
import {
  applyMapLayoutDraft,
  getMainPathIds,
  layoutToDraft,
  loadMapLayoutDraft,
} from '../data/mapLayoutDraft'
import { resetKingdomProgress } from '../api'
import { useConquer } from '../ConquerContext'
import { useMapProgress, type MapArrival } from '../hooks/useMapProgress'
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
  note?: string
  branchChoices?: Array<{ id: string; label: string; hint: string }>
}

function buildSceneModal(
  arrival: MapArrival,
  node: BattleMapNode,
  level: PlanetLevel | undefined,
  levelDone: boolean,
  layout: KingdomBattleMapLayout,
): SceneModalContent {
  if (arrival.kind === 'fork-arrival') {
    return {
      icon: '⑂',
      title: '三岔路口',
      location: node.label,
      body: getForkArrivalEvent(),
      primaryLabel: '选择道路',
      branchChoices: layout.fork.branches.map((b) => ({
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

  if (level) {
    const enterable = !levelDone
    const profile = getLevelLearningProfile(level.kind)
    return {
      icon: nodeIcon(level),
      title: level.name,
      location: node.label,
      body: getLevelEvent(level, levelDone),
      note: getLevelLearningNote(level, levelDone),
      primaryLabel: enterable ? profile.enterCta : '继续探索',
      enterable,
    }
  }

  return {
    icon: terrainIcon(node.terrain),
    title: node.label,
    location: '微光村国 · 远征途中',
    body: getWaypointEvent(node),
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
  moving,
}: {
  node: BattleMapNode | undefined
  moving: boolean
}) {
  if (!node) return null

  return (
    <div
      className={[
        'cp-map-player-floater',
        moving ? 'cp-map-player-floater--moving' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ left: `${node.x}%`, top: `${node.y}%` }}
      aria-hidden="true"
    >
      <span className="cp-map-player-floater__flag">🚩</span>
    </div>
  )
}

function RichKingdomMap({
  kingdom,
  onOpenContinentOverview,
  onEnter,
}: KingdomBattleMapViewProps) {
  const { session, setSession } = useConquer()
  const conquered = session?.conqueredLevelIds ?? []
  const canvasRef = useRef<HTMLDivElement>(null)
  const [editMode, setEditMode] = useState(isMapEditMode)
  const [resetting, setResetting] = useState(false)
  const fileLayout = getKingdomBattleMapLayout(kingdom.id)
  const [layoutDraft, setLayoutDraft] = useState(() => loadMapLayoutDraft(kingdom.id))

  const effectiveLayout = useMemo(() => {
    if (!fileLayout) return null
    return applyMapLayoutDraft(fileLayout, layoutDraft)
  }, [fileLayout, layoutDraft])

  const {
    pathIds,
    pathIndex,
    branchId,
    moving,
    canAdvance,
    atEnd,
    nextNodeId,
    blockedByLevel,
    pendingArrival,
    clearArrival,
    advanceOneStep,
    chooseBranch,
    resetMapProgress,
  } = useMapProgress(kingdom.id, conquered, effectiveLayout)

  const layout = effectiveLayout
  const levels = kingdom.levels
  const levelById = useMemo(() => new Map(levels.map((l) => [l.id, l])), [levels])
  const bossLevel = levels.find((l) => l.kind === 'boss')
  const mapStyle = getKingdomMapVisualStyle(kingdom.id)
  const mapImage = getKingdomMapImage(kingdom.id)
  const usesRealBg = Boolean(mapImage) && (mapStyle === 'image' || mapStyle === 'boardgame')
  const viewW = usesRealBg ? KINGDOM_MAP_VIEW.w : 1000
  const viewH = usesRealBg ? KINGDOM_MAP_VIEW.h : 700
  const swayScale = editMode ? 0 : usesRealBg ? 0.25 : 1
  const editPathIds = layout ? getMainPathIds(layout) : []

  const pathD = useMemo(() => {
    if (!layout) return ''
    const ids = editMode ? editPathIds : pathIds
    const points = pathPointsFromLayout(layout, ids)
    if (editMode || usesRealBg) {
      return buildStraightPathD(points, viewW, viewH)
    }
    return buildParchmentPathD(points, viewW, viewH, swayScale)
  }, [layout, pathIds, editPathIds, editMode, swayScale, viewW, viewH, usesRealBg])

  const alternatePaths = useMemo(() => {
    if (!layout || editMode) return undefined
    if (branchId) {
      const unchosen = layout.fork.branches.find((b) => b.id !== branchId)
      if (!unchosen) return undefined
      const before = layout.spineBeforeFork.slice(0, -1)
      const after = [layout.fork.mergeNodeId, ...layout.spineAfterFork]
      const ids = [...before, layout.fork.nodeId, ...unchosen.nodeIds, ...after]
      return [buildStraightPathD(pathPointsFromLayout(layout, ids), viewW, viewH)]
    }
    return buildForkPreviewPaths(layout).map((ids) =>
      buildStraightPathD(pathPointsFromLayout(layout, ids), viewW, viewH),
    )
  }, [layout, branchId, swayScale, viewW, viewH, editMode, usesRealBg])
  const playerNodeId = pathIds[pathIndex]
  const playerNode = layout?.nodes[playerNodeId]
  const currentLevel = playerNode?.levelId ? levelById.get(playerNode.levelId) : undefined

  const sceneModal = useMemo(() => {
    if (!pendingArrival || !layout) return null
    const node = layout.nodes[pendingArrival.nodeId]
    if (!node) return null
    const level = node.levelId ? levelById.get(node.levelId) : undefined
    const levelDone = level ? !!level.done : false
    const content = buildSceneModal(pendingArrival, node, level, levelDone, layout)
    return content
  }, [pendingArrival, layout, levelById])

  useEffect(() => {
    if (pendingArrival && !sceneModal) {
      clearArrival()
    }
  }, [pendingArrival, sceneModal, clearArrival])

  const handleSceneConfirm = () => {
    if (!pendingArrival || !layout || !sceneModal) {
      clearArrival()
      return
    }
    const node = layout.nodes[pendingArrival.nodeId]
    const level = node?.levelId ? levelById.get(node.levelId) : undefined
    const canEnter = !!sceneModal.enterable && !!level

    clearArrival()

    if (canEnter && level) {
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
    }
  }

  const handleResetToStart = async () => {
    if (
      !window.confirm(
        '确定回到起点？本王国的关卡征服进度与地图位置将清零（标注坐标不受影响）。',
      )
    ) {
      return
    }
    setResetting(true)
    try {
      const { session: next } = await resetKingdomProgress(kingdom.id)
      resetMapProgress()
      setSession(next)
    } catch (err) {
      window.alert(err instanceof Error ? err.message : '重置失败')
    } finally {
      setResetting(false)
    }
  }

  const useIllustratedMap =
    mapStyle === 'fantasy-topdown' || mapStyle === 'image' || mapStyle === 'boardgame'
  /** 连线仅用于标注对齐，正常游玩不显示 */
  const displayPathD = editMode ? pathD : ''
  const displayAlternatePaths = editMode ? alternatePaths : undefined

  if (!session || !layout || !fileLayout) return null

  return (
    <div className={`cp-map-layout cp-map-layout--immersive${useIllustratedMap ? ' cp-map-layout--fantasy' : ''}${editMode ? ' cp-map-layout--edit' : ''}`}>
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
        <div ref={canvasRef} className="cp-world-map__canvas cp-world-map__canvas--immersive">          {mapStyle === 'boardgame' ? (
            <BoardGameMapScene
              pathD={displayPathD}
              kingdomName={kingdom.name}
              immersive
              alternatePaths={displayAlternatePaths}
              layout={layout}
              backgroundSrc={mapImage ?? undefined}
            />
          ) : mapStyle === 'image' && mapImage ? (
            <ImageKingdomMapScene
              imageSrc={mapImage}
              pathD={displayPathD}
              immersive
              alternatePaths={displayAlternatePaths}
            />
          ) : mapStyle === 'fantasy-topdown' ? (
            <FantasyTopDownMapScene
              pathD={displayPathD}
              kingdomName={kingdom.name}
              monsterName={kingdom.monster.name}
              immersive
              alternatePaths={displayAlternatePaths}
              layout={layout}
            />
          ) : (
            <ParchmentMapScene
              pathD={displayPathD}
              kingdomName={kingdom.name}
              monsterId={kingdom.monster.id}
              monsterName={kingdom.monster.name}
              immersive
              alternatePaths={displayAlternatePaths}
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
              <>
                {!editMode && (
                  <>
                    <button
                      type="button"
                      className="cp-map-hud__reset"
                      onClick={handleResetToStart}
                      disabled={resetting}
                      title="清零本王国关卡进度与地图位置"
                    >
                      {resetting ? '重置中…' : '回到起点'}
                    </button>
                    <button
                      type="button"
                      className="cp-map-hud__edit"
                      onClick={() => setEditMode(true)}
                      title="拖拽节点调整坐标，可导出代码"
                    >
                      标注
                    </button>
                  </>
                )}
                <div className="cp-map-hud__monster" title={kingdom.monster.epithet}>
                  <MonsterSprite id={kingdom.monster.id} size={40} title={kingdom.monster.name} />
                  <span>{kingdom.monster.name}</span>
                </div>
              </>
            }
          />

          {editMode && layout && fileLayout && (
            <MapLayoutEditor
              kingdomId={kingdom.id}
              layout={layout}
              originalLayout={fileLayout}
              canvasRef={canvasRef}
              onLayoutChange={(nextLayout) => {
                setLayoutDraft(layoutToDraft(fileLayout, nextLayout))
              }}
              onClose={() => setEditMode(false)}
            />
          )}

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

          <div className={`cp-world-map__nodes${editMode ? ' cp-world-map__nodes--hidden' : ''}`}>
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
                  isCurrentLevel={!!isCurrentLevel}
                  reviewBadge={reviewBadge}
                  onActivate={isCurrentLevel ? () => handleNodeActivate(nodeId) : undefined}
                />
              )
            })}
          </div>

          {!editMode && <MapPlayerToken node={playerNode} moving={moving} />}
        </div>

        {!editMode && (
          <div className="cp-map-overlay">
            <ForwardMovePanel
            canAdvance={canAdvance}
            moving={moving}
            atEnd={atEnd}
            blockedByLevel={blockedByLevel}
            onAdvance={advanceOneStep}
            onEnterLevel={
              blockedByLevel && currentLevel && !currentLevel.done
                ? () => onEnter(currentLevel)
                : undefined
            }
          />

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
        )}

        <p className="cp-world-map__hint cp-world-map__hint--float">
          {editMode
            ? '标注模式：拖拽节点对齐道路，完成后点「保存到本地」或「复制 TS 代码」'
            : '点击右下角箭头，沿路径逐格前进；每站必经关卡，通关后再继续'}
        </p>      </div>
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
