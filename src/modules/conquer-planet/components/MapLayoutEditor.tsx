import { useCallback, useEffect, useRef, useState } from 'react'
import type { BattleMapNode, KingdomBattleMapLayout, MapTerrain } from '../data/kingdomBattleMapLayout'
import {
  createNodeAfter,
  exportFullLayoutCode,
  getMainPathIds,
  layoutToDraft,
  removeNodeFromMainPath,
  resizeMainPath,
  saveMapLayoutDraft,
} from '../data/mapLayoutDraft'

interface MapLayoutEditorProps {
  kingdomId: string
  layout: KingdomBattleMapLayout
  originalLayout: KingdomBattleMapLayout
  canvasRef: React.RefObject<HTMLDivElement | null>
  onLayoutChange: (layout: KingdomBattleMapLayout) => void
  onClose: () => void
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

function round1(n: number) {
  return Math.round(n * 10) / 10
}

function clientToPct(canvas: HTMLElement, clientX: number, clientY: number) {
  const rect = canvas.getBoundingClientRect()
  const x = ((clientX - rect.left) / rect.width) * 100
  const y = ((clientY - rect.top) / rect.height) * 100
  return {
    x: round1(Math.min(100, Math.max(0, x))),
    y: round1(Math.min(100, Math.max(0, y))),
  }
}

export function MapLayoutEditor({
  kingdomId,
  layout,
  originalLayout,
  canvasRef,
  onLayoutChange,
  onClose,
}: MapLayoutEditorProps) {
  const [workingLayout, setWorkingLayout] = useState<KingdomBattleMapLayout>(() => layout)
  const [selectedId, setSelectedId] = useState<string>(() => getMainPathIds(layout)[0] ?? 'start')
  const [countInput, setCountInput] = useState(() => String(getMainPathIds(layout).length))
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [panelPos, setPanelPos] = useState<{ x: number; y: number } | null>(null)
  const nodeDragRef = useRef<{ id: string; pointerId: number } | null>(null)
  const panelDragRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    origX: number
    origY: number
  } | null>(null)
  const panelRef = useRef<HTMLElement>(null)

  const pathIds = getMainPathIds(workingLayout)

  const commitLayout = useCallback(
    (next: KingdomBattleMapLayout) => {
      setWorkingLayout(next)
      onLayoutChange(next)
      saveMapLayoutDraft(kingdomId, layoutToDraft(originalLayout, next))
      setCountInput(String(getMainPathIds(next).length))
    },
    [kingdomId, onLayoutChange, originalLayout],
  )

  const updateNode = useCallback(
    (id: string, patch: Partial<Pick<BattleMapNode, 'x' | 'y' | 'label' | 'terrain'>>) => {
      commitLayout({
        ...workingLayout,
        nodes: {
          ...workingLayout.nodes,
          [id]: { ...workingLayout.nodes[id], ...patch },
        },
      })
    },
    [commitLayout, workingLayout],
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const onPointerMove = (e: PointerEvent) => {
      if (nodeDragRef.current && nodeDragRef.current.pointerId === e.pointerId) {
        const { x, y } = clientToPct(canvas, e.clientX, e.clientY)
        setWorkingLayout((prev) => {
          const next = {
            ...prev,
            nodes: {
              ...prev.nodes,
              [nodeDragRef.current!.id]: { ...prev.nodes[nodeDragRef.current!.id], x, y },
            },
          }
          onLayoutChange(next)
          saveMapLayoutDraft(kingdomId, layoutToDraft(originalLayout, next))
          return next
        })
        return
      }

      if (panelDragRef.current && panelDragRef.current.pointerId === e.pointerId) {
        const drag = panelDragRef.current
        const canvasRect = canvas.getBoundingClientRect()
        const panel = panelRef.current
        const panelW = panel?.offsetWidth ?? 280
        const panelH = panel?.offsetHeight ?? 400
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
  }, [canvasRef, kingdomId, onLayoutChange, originalLayout])

  const handleHandlePointerDown = (id: string, e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedId(id)
    setDraggingId(id)
    nodeDragRef.current = { id, pointerId: e.pointerId }
  }

  const handlePanelHeadPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button, input')) return
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

  const handleCanvasClick = (e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas || draggingId || !selectedId) return
    const { x, y } = clientToPct(canvas, e.clientX, e.clientY)
    updateNode(selectedId, { x, y })
  }

  const handleApplyCount = () => {
    const n = parseInt(countInput, 10)
    if (Number.isNaN(n) || n < 1 || n > 50) return
    const next = resizeMainPath(workingLayout, n)
    commitLayout(next)
    const ids = getMainPathIds(next)
    if (!ids.includes(selectedId)) setSelectedId(ids[0] ?? '')
  }

  const handleAddBelow = (afterNodeId: string) => {
    const { layout: next, newNodeId } = createNodeAfter(workingLayout, afterNodeId)
    commitLayout(next)
    setSelectedId(newNodeId)
  }

  const handleDelete = (nodeId: string) => {
    try {
      const next = removeNodeFromMainPath(workingLayout, nodeId)
      if (!next) return
      commitLayout(next)
      const ids = getMainPathIds(next)
      if (selectedId === nodeId || !ids.includes(selectedId)) {
        setSelectedId(ids[ids.length - 1] ?? ids[0] ?? '')
      }
    } catch {
      /* 忽略异常，避免崩溃 */
    }
  }

  const handleCopy = async () => {
    const code = exportFullLayoutCode(originalLayout, workingLayout)
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <button
        type="button"
        className="cp-map-edit-hitlayer"
        aria-label="点击地图放置当前选中节点"
        onClick={handleCanvasClick}
      />

      {pathIds.map((nodeId) => {
        const node = workingLayout.nodes[nodeId]
        if (!node) return null
        const active = selectedId === nodeId
        return (
          <div
            key={`edit-${nodeId}`}
            className={[
              'cp-map-edit-handle',
              active ? 'cp-map-edit-handle--active' : '',
              draggingId === nodeId ? 'cp-map-edit-handle--dragging' : '',
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
            <span className="cp-map-edit-handle__dot" />
            <span className="cp-map-edit-handle__id">{node.label}</span>
          </div>
        )
      })}

      <aside
        ref={panelRef}
        className={['cp-map-edit-panel', panelPos ? 'cp-map-edit-panel--placed' : '']
          .filter(Boolean)
          .join(' ')}
        style={panelPos ? { left: panelPos.x, top: panelPos.y } : undefined}
      >
        <header className="cp-map-edit-panel__head" onPointerDown={handlePanelHeadPointerDown}>
          <h3>地图标注</h3>
          <button type="button" className="cp-map-edit-panel__close" onClick={onClose}>
            完成
          </button>
        </header>

        <div className="cp-map-edit-panel__count-row">
          <label htmlFor="cp-map-node-count">节点数量</label>
          <input
            id="cp-map-node-count"
            type="number"
            min={1}
            max={50}
            value={countInput}
            onChange={(e) => setCountInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleApplyCount()}
          />
          <button type="button" className="cp-btn cp-btn--compact" onClick={handleApplyCount}>
            重设
          </button>
        </div>

        <p className="cp-map-edit-panel__tip">点击列表选中 · 拖拽圆点或点击地图定位 · 行内编辑</p>

        <ul className="cp-map-edit-panel__list cp-map-edit-panel__list--inline">
          {pathIds.map((id, idx) => {
            const n = workingLayout.nodes[id]
            const active = selectedId === id
            return (
              <li key={id} className={active ? 'is-active' : ''}>
                <div
                  className="cp-map-edit-row"
                  onClick={() => setSelectedId(id)}
                  onKeyDown={() => {}}
                  role="button"
                  tabIndex={0}
                >
                  <span className="cp-map-edit-row__idx">{idx + 1}</span>
                  <select
                    className="cp-map-edit-row__type"
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
                    className="cp-map-edit-row__name"
                    type="text"
                    value={n.label}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => updateNode(id, { label: e.target.value })}
                  />
                  <code className="cp-map-edit-row__xy">
                    {n.x},{n.y}
                  </code>
                  <button
                    type="button"
                    className="cp-map-edit-row__del"
                    title="删除"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(id)
                    }}
                  >
                    ×
                  </button>
                </div>
                <button
                  type="button"
                  className="cp-map-edit-row__add"
                  onClick={() => handleAddBelow(id)}
                >
                  + 下方添加
                </button>
              </li>
            )
          })}
        </ul>

        <div className="cp-map-edit-panel__actions cp-map-edit-panel__actions--single">
          <button type="button" className="cp-btn cp-btn--primary cp-btn--full" onClick={handleCopy}>
            {copied ? '已复制' : '复制 TS 代码'}
          </button>
        </div>
      </aside>
    </>
  )
}
