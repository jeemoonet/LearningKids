import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { BattleMapLayoutConfig, BattleMapNodeConfig } from '../adminApi'
import {
  createNodeAfter,
  getMainPathIds,
  removeNodeFromMainPath,
  resizeMainPath,
} from '../../modules/conquer-planet/data/mapLayoutDraft'
import type { KingdomBattleMapLayout, MapTerrain } from '../../modules/conquer-planet/data/kingdomBattleMapLayout'
import { buildStraightPathD } from '../../modules/conquer-planet/components/ParchmentMapScene'
import { KINGDOM_MAP_VIEW } from '../../modules/conquer-planet/data/mapViewBox'

interface AdminBattleMapEditorProps {
  layout: BattleMapLayoutConfig
  mapImage?: string | null
  mapLabel?: string
  onLayoutChange: (layout: BattleMapLayoutConfig) => void
}

const TERRAIN_OPTIONS: Array<{ value: MapTerrain; label: string }> = [
  { value: 'camp', label: '营地' },
  { value: 'village', label: '村庄' },
  { value: 'forest', label: '树林' },
  { value: 'valley', label: '山谷' },
  { value: 'castle', label: '城堡' },
  { value: 'fork', label: '分叉' },
  { value: 'waypoint', label: '路点' },
  { value: 'tower', label: '哨塔' },
]

const ZOOM_MIN = 0.75
const ZOOM_MAX = 3
const ZOOM_STEP = 0.25

function round1(n: number) {
  return Math.round(n * 10) / 10
}

function clampZoom(z: number) {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, round1(z)))
}

function clientToPct(viewport: HTMLElement, clientX: number, clientY: number) {
  const rect = viewport.getBoundingClientRect()
  const x = ((clientX - rect.left) / rect.width) * 100
  const y = ((clientY - rect.top) / rect.height) * 100
  return {
    x: round1(Math.min(100, Math.max(0, x))),
    y: round1(Math.min(100, Math.max(0, y))),
  }
}

function toKingdomLayout(layout: BattleMapLayoutConfig): KingdomBattleMapLayout {
  return layout as unknown as KingdomBattleMapLayout
}

function fromKingdomLayout(layout: KingdomBattleMapLayout): BattleMapLayoutConfig {
  return layout as unknown as BattleMapLayoutConfig
}

export function AdminBattleMapEditor({
  layout,
  mapImage,
  mapLabel = '战斗地图',
  onLayoutChange,
}: AdminBattleMapEditorProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLElement>(null)

  const [selectedId, setSelectedId] = useState<string>(() => getMainPathIds(toKingdomLayout(layout))[0] ?? 'start')
  const [countInput, setCountInput] = useState(() => String(getMainPathIds(toKingdomLayout(layout)).length))
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [panelPos, setPanelPos] = useState<{ x: number; y: number } | null>(null)
  const [zoom, setZoom] = useState(1)

  const nodeDragRef = useRef<{ id: string; pointerId: number } | null>(null)
  const panelDragRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    origX: number
    origY: number
  } | null>(null)

  const pathIds = useMemo(() => getMainPathIds(toKingdomLayout(layout)), [layout])

  const pathD = useMemo(() => {
    const points = pathIds
      .map((id) => layout.nodes[id])
      .filter(Boolean)
      .map((n) => ({ x: n.x, y: n.y }))
    return buildStraightPathD(points, KINGDOM_MAP_VIEW.w, KINGDOM_MAP_VIEW.h)
  }, [layout.nodes, pathIds])

  useEffect(() => {
    setCountInput(String(pathIds.length))
  }, [pathIds.length])

  const commitLayout = useCallback(
    (next: KingdomBattleMapLayout) => {
      onLayoutChange(fromKingdomLayout(next))
    },
    [onLayoutChange],
  )

  const updateNode = useCallback(
    (id: string, patch: Partial<Pick<BattleMapNodeConfig, 'x' | 'y' | 'label'>> & { terrain?: MapTerrain }) => {
      const kingdom = toKingdomLayout(layout)
      commitLayout({
        ...kingdom,
        nodes: {
          ...kingdom.nodes,
          [id]: { ...kingdom.nodes[id], ...patch },
        },
      })
    },
    [commitLayout, layout],
  )

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const onPointerMove = (e: PointerEvent) => {
      if (nodeDragRef.current && nodeDragRef.current.pointerId === e.pointerId) {
        const kingdom = toKingdomLayout(layout)
        const { x, y } = clientToPct(viewport, e.clientX, e.clientY)
        commitLayout({
          ...kingdom,
          nodes: {
            ...kingdom.nodes,
            [nodeDragRef.current.id]: { ...kingdom.nodes[nodeDragRef.current.id], x, y },
          },
        })
        return
      }

      if (panelDragRef.current && panelDragRef.current.pointerId === e.pointerId) {
        const canvas = canvasRef.current
        const panel = panelRef.current
        if (!canvas || !panel) return
        const canvasRect = canvas.getBoundingClientRect()
        const panelW = panel.offsetWidth
        const panelH = panel.offsetHeight
        const drag = panelDragRef.current
        const dx = e.clientX - drag.startX
        const dy = e.clientY - drag.startY
        setPanelPos({
          x: Math.min(Math.max(0, canvasRect.width - panelW), Math.max(0, drag.origX + dx)),
          y: Math.min(Math.max(0, canvasRect.height - panelH), Math.max(0, drag.origY + dy)),
        })
      }
    }

    const onPointerUp = (e: PointerEvent) => {
      if (nodeDragRef.current?.pointerId === e.pointerId) {
        nodeDragRef.current = null
        setDraggingId(null)
      }
      if (panelDragRef.current?.pointerId === e.pointerId) {
        panelDragRef.current = null
      }
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
    }
  }, [commitLayout, layout])

  const handleHandlePointerDown = (id: string, e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedId(id)
    setDraggingId(id)
    nodeDragRef.current = { id, pointerId: e.pointerId }
  }

  const handleCanvasClick = (e: React.MouseEvent) => {
    const viewport = viewportRef.current
    if (!viewport || draggingId || !selectedId) return
    const { x, y } = clientToPct(viewport, e.clientX, e.clientY)
    updateNode(selectedId, { x, y })
  }

  const handlePanelHeadPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button, input, select')) return
    e.preventDefault()
    const canvas = canvasRef.current
    const panel = panelRef.current
    if (!canvas || !panel) return

    const canvasRect = canvas.getBoundingClientRect()
    const panelRect = panel.getBoundingClientRect()
    const origX = panelPos?.x ?? panelRect.left - canvasRect.left
    const origY = panelPos?.y ?? panelRect.top - canvasRect.top

    panelDragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      origX,
      origY,
    }
    if (!panelPos) setPanelPos({ x: origX, y: origY })
  }

  const handleApplyCount = () => {
    const n = parseInt(countInput, 10)
    if (Number.isNaN(n) || n < 1 || n > 50) return
    const next = resizeMainPath(toKingdomLayout(layout), n)
    commitLayout(next)
    const ids = getMainPathIds(next)
    if (!ids.includes(selectedId)) setSelectedId(ids[0] ?? '')
  }

  const handleAddBelow = (afterNodeId: string) => {
    const { layout: next, newNodeId } = createNodeAfter(toKingdomLayout(layout), afterNodeId)
    commitLayout(next)
    setSelectedId(newNodeId)
  }

  const handleDelete = (nodeId: string) => {
    try {
      const next = removeNodeFromMainPath(toKingdomLayout(layout), nodeId)
      if (!next) return
      commitLayout(next)
      const ids = getMainPathIds(next)
      if (selectedId === nodeId || !ids.includes(selectedId)) {
        setSelectedId(ids[ids.length - 1] ?? ids[0] ?? '')
      }
    } catch {
      /* ignore */
    }
  }

  const changeZoom = (delta: number) => {
    setZoom((prev) => clampZoom(prev + delta))
  }

  const resetZoom = () => {
    setZoom(1)
    scrollRef.current?.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
  }

  return (
    <div ref={canvasRef} className="admin-battle-map__canvas">
      <div className="admin-battle-map__zoom-controls">
        <button
          type="button"
          className="admin-battle-map__zoom-btn"
          title="缩小"
          disabled={zoom <= ZOOM_MIN}
          onClick={() => changeZoom(-ZOOM_STEP)}
        >
          −
        </button>
        <span className="admin-battle-map__zoom-label">{Math.round(zoom * 100)}%</span>
        <button
          type="button"
          className="admin-battle-map__zoom-btn"
          title="放大"
          disabled={zoom >= ZOOM_MAX}
          onClick={() => changeZoom(ZOOM_STEP)}
        >
          +
        </button>
        <button type="button" className="admin-battle-map__zoom-reset" title="重置缩放" onClick={resetZoom}>
          重置
        </button>
      </div>

      <div ref={scrollRef} className="admin-battle-map__scroll">
        <div
          ref={viewportRef}
          className="admin-battle-map__viewport"
          style={{
            width: `${zoom * 100}%`,
            aspectRatio: `${KINGDOM_MAP_VIEW.w} / ${KINGDOM_MAP_VIEW.h}`,
          }}
        >
          {mapImage ? (
            <img className="admin-battle-map__bg" src={mapImage} alt={mapLabel} />
          ) : (
            <div className="admin-battle-map__bg admin-battle-map__bg--placeholder">
              暂无底图，可直接按百分比坐标标注
            </div>
          )}

          <svg
            className="admin-battle-map__path"
            viewBox={`0 0 ${KINGDOM_MAP_VIEW.w} ${KINGDOM_MAP_VIEW.h}`}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path className="admin-battle-map__path-line" d={pathD} />
          </svg>

          <button
            type="button"
            className="admin-battle-map__hitlayer"
            aria-label="点击地图放置当前选中节点"
            onClick={handleCanvasClick}
          />

          {pathIds.map((nodeId) => {
            const node = layout.nodes[nodeId]
            if (!node) return null
            const active = selectedId === nodeId
            return (
              <div
                key={`edit-${nodeId}`}
                className={[
                  'admin-battle-map__handle',
                  active ? 'is-active' : '',
                  draggingId === nodeId ? 'is-dragging' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                style={{ left: `${node.x}%`, top: `${node.y}%` }}
                onPointerDown={(e) => handleHandlePointerDown(nodeId, e)}
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedId(nodeId)
                }}
                title={`${node.label} (${node.x}, ${node.y})`}
              >
                <span className="admin-battle-map__handle-dot" />
                <span className="admin-battle-map__handle-label">{node.label}</span>
              </div>
            )
          })}
        </div>
      </div>

      <aside
        ref={panelRef}
        className={['admin-battle-map__panel', panelPos ? 'is-placed' : ''].filter(Boolean).join(' ')}
        style={panelPos ? { left: panelPos.x, top: panelPos.y } : undefined}
      >
        <header className="admin-battle-map__panel-head" onPointerDown={handlePanelHeadPointerDown}>
          <h3>节点标注</h3>
          <span className="admin-battle-map__panel-drag-hint">拖拽移动</span>
          <span className="admin-status">{pathIds.length} 个节点</span>
        </header>

        <div className="admin-battle-map__count-row">
          <label htmlFor="admin-map-node-count">节点数量</label>
          <input
            id="admin-map-node-count"
            type="number"
            min={1}
            max={50}
            value={countInput}
            onChange={(e) => setCountInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleApplyCount()}
          />
          <button type="button" className="admin-btn admin-btn-outline" onClick={handleApplyCount}>
            重设
          </button>
        </div>

        <p className="admin-battle-map__tip">
          拖拽标题栏移动面板 · 缩放后可滚动平移 · 修改后点页顶「保存」
        </p>

        <ul className="admin-battle-map__list">
          {pathIds.map((id, idx) => {
            const n = layout.nodes[id]
            const active = selectedId === id
            return (
              <li key={id} className={active ? 'is-active' : ''}>
                <div
                  className="admin-battle-map__row"
                  onClick={() => setSelectedId(id)}
                  onKeyDown={() => {}}
                  role="button"
                  tabIndex={0}
                >
                  <span className="admin-battle-map__row-idx">{idx + 1}</span>
                  <select
                    className="admin-battle-map__row-type"
                    value={n.terrain}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => updateNode(id, { terrain: e.target.value as MapTerrain })}
                  >
                    {TERRAIN_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <input
                    className="admin-battle-map__row-name"
                    type="text"
                    value={n.label}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => updateNode(id, { label: e.target.value })}
                  />
                  <code className="admin-battle-map__row-xy">
                    {n.x},{n.y}
                  </code>
                  {n.levelId && <span className="admin-battle-map__row-level">{n.levelId}</span>}
                  <button
                    type="button"
                    className="admin-battle-map__row-del"
                    title="删除"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(id)
                    }}
                  >
                    ×
                  </button>
                </div>
                <button type="button" className="admin-battle-map__row-add" onClick={() => handleAddBelow(id)}>
                  + 下方添加
                </button>
              </li>
            )
          })}
        </ul>
      </aside>
    </div>
  )
}
