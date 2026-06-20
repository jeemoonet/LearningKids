import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react'
import { CANVAS_SIZE } from '../constants'
import { useContainerSize } from '../hooks/useContainerSize'
import { formatTick } from '../lib/format'
import {
  buildPlotTransform,
  getGridStep,
  toCanvasPoint,
  type CurveData,
  type Viewport,
} from '../lib/graph'
import { formatAxisLabel } from '../lib/keyPoints'

const KEY_POINT_RADIUS = 8
const KEY_POINT_HIT_RADIUS = 16

interface HoveredPoint {
  label: string
  color: string
  x: number
  y: number
}

interface GraphCanvasProps {
  curves: CurveData[]
  viewport: Viewport
  maxSize?: number
  responsive?: boolean
  compact?: boolean
  showLegend?: boolean
  showAxisLabels?: boolean
  showSymmetryAxisLabel?: boolean
  showKeyPointLabels?: boolean
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  transform: ReturnType<typeof buildPlotTransform>,
) {
  const { offsetX, offsetY, usedWidth, usedHeight, viewport } = transform
  const step = getGridStep(viewport)

  ctx.strokeStyle = '#e5e7eb'
  ctx.lineWidth = 1

  for (let x = Math.ceil(viewport.xMin / step) * step; x <= viewport.xMax; x += step) {
    const { px } = toCanvasPoint(x, 0, transform)
    ctx.beginPath()
    ctx.moveTo(px, offsetY)
    ctx.lineTo(px, offsetY + usedHeight)
    ctx.stroke()
  }

  for (let y = Math.ceil(viewport.yMin / step) * step; y <= viewport.yMax; y += step) {
    if (Math.abs(y) < 1e-9) continue
    const { py } = toCanvasPoint(0, y, transform)
    ctx.beginPath()
    ctx.moveTo(offsetX, py)
    ctx.lineTo(offsetX + usedWidth, py)
    ctx.stroke()
  }
}

function drawAxes(
  ctx: CanvasRenderingContext2D,
  transform: ReturnType<typeof buildPlotTransform>,
  showLabels: boolean,
) {
  const { offsetX, offsetY, usedWidth, usedHeight, viewport } = transform
  const step = getGridStep(viewport)
  const yAxisInView = viewport.xMin <= 0 && viewport.xMax >= 0
  const xAxisInView = viewport.yMin <= 0 && viewport.yMax >= 0
  const originInView = yAxisInView && xAxisInView
  const origin = toCanvasPoint(0, 0, transform)

  ctx.strokeStyle = '#374151'
  ctx.lineWidth = 2

  if (xAxisInView) {
    ctx.beginPath()
    ctx.moveTo(offsetX, origin.py)
    ctx.lineTo(offsetX + usedWidth, origin.py)
    ctx.stroke()
  }

  if (yAxisInView) {
    ctx.beginPath()
    ctx.moveTo(origin.px, offsetY)
    ctx.lineTo(origin.px, offsetY + usedHeight)
    ctx.stroke()
  }

  if (!showLabels) return

  ctx.fillStyle = '#374151'
  ctx.font = '14px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif'

  if (originInView) {
    ctx.fillText('x', offsetX + usedWidth + 6, origin.py + 4)
    ctx.fillText('y', origin.px + 6, offsetY - 6)
    ctx.fillText('O', origin.px - 16, origin.py + 16)
  }

  if (xAxisInView) {
    for (let x = Math.ceil(viewport.xMin / step) * step; x <= viewport.xMax; x += step) {
      if (x === 0) continue
      const { px } = toCanvasPoint(x, 0, transform)

      ctx.beginPath()
      ctx.moveTo(px, origin.py - 4)
      ctx.lineTo(px, origin.py + 4)
      ctx.stroke()
      ctx.fillText(formatTick(x), px - 6, origin.py + 18)
    }
  }

  if (yAxisInView) {
    for (let y = Math.ceil(viewport.yMin / step) * step; y <= viewport.yMax; y += step) {
      if (y === 0) continue
      const { py } = toCanvasPoint(0, y, transform)

      ctx.beginPath()
      ctx.moveTo(origin.px - 4, py)
      ctx.lineTo(origin.px + 4, py)
      ctx.stroke()
      ctx.fillText(formatTick(y), origin.px + 8, py + 4)
    }
  }
}

function drawSymmetryAxis(
  ctx: CanvasRenderingContext2D,
  axisX: number,
  color: string,
  transform: ReturnType<typeof buildPlotTransform>,
  showLabel: boolean,
) {
  const { offsetY, usedHeight, viewport } = transform

  if (axisX < viewport.xMin || axisX > viewport.xMax) return

  const { px } = toCanvasPoint(axisX, 0, transform)

  ctx.save()
  ctx.strokeStyle = color
  ctx.globalAlpha = 0.65
  ctx.lineWidth = 1.5
  ctx.setLineDash([6, 4])
  ctx.beginPath()
  ctx.moveTo(px, offsetY)
  ctx.lineTo(px, offsetY + usedHeight)
  ctx.stroke()
  ctx.restore()

  if (!showLabel) return

  ctx.save()
  ctx.fillStyle = color
  ctx.font = '12px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillText(formatAxisLabel(axisX), px + 6, offsetY + 14)
  ctx.restore()
}

function drawKeyPoints(
  ctx: CanvasRenderingContext2D,
  curve: CurveData,
  transform: ReturnType<typeof buildPlotTransform>,
  canvasSize: number,
  showLabels: boolean,
) {
  const { viewport } = transform
  const pointRadius = Math.max(5, KEY_POINT_RADIUS * (canvasSize / CANVAS_SIZE))
  const labelFontSize = Math.max(13, Math.round(16 * (canvasSize / CANVAS_SIZE)))

  curve.keyPoints.forEach((point) => {
    if (
      point.x < viewport.xMin ||
      point.x > viewport.xMax ||
      point.y < viewport.yMin ||
      point.y > viewport.yMax
    ) {
      return
    }

    const { px, py } = toCanvasPoint(point.x, point.y, transform)

    ctx.save()
    ctx.fillStyle = curve.color
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(px, py, pointRadius, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    if (showLabels) {
      ctx.fillStyle = '#111827'
      ctx.font = `bold ${labelFontSize}px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif`
      ctx.fillText(
        `(${formatTick(point.x)}, ${formatTick(point.y)})`,
        px + pointRadius + 4,
        py - pointRadius - 2,
      )
    }

    ctx.restore()
  })
}

function drawCurve(
  ctx: CanvasRenderingContext2D,
  curve: CurveData,
  transform: ReturnType<typeof buildPlotTransform>,
) {
  ctx.strokeStyle = curve.color
  ctx.lineWidth = 2.5

  curve.segments.forEach((segment) => {
    if (segment.length === 0) return

    ctx.beginPath()

    segment.forEach((point, index) => {
      const { px, py } = toCanvasPoint(point.x, point.y, transform)

      if (index === 0) {
        ctx.moveTo(px, py)
      } else {
        ctx.lineTo(px, py)
      }
    })

    ctx.stroke()
  })
}

function findHoveredPoint(
  mx: number,
  my: number,
  curves: CurveData[],
  transform: ReturnType<typeof buildPlotTransform>,
  canvasSize: number,
): HoveredPoint | null {
  const { viewport } = transform
  const hitRadius = Math.max(
    KEY_POINT_HIT_RADIUS,
    KEY_POINT_HIT_RADIUS * (canvasSize / CANVAS_SIZE),
  )

  for (const curve of curves) {
    for (const point of curve.keyPoints) {
      if (
        point.x < viewport.xMin ||
        point.x > viewport.xMax ||
        point.y < viewport.yMin ||
        point.y > viewport.yMax
      ) {
        continue
      }

      const { px, py } = toCanvasPoint(point.x, point.y, transform)
      const distance = Math.hypot(mx - px, my - py)

      if (distance <= hitRadius) {
        return {
          label: point.label,
          color: curve.color,
          x: px,
          y: py,
        }
      }
    }
  }

  return null
}

export function GraphCanvas({
  curves,
  viewport,
  maxSize = CANVAS_SIZE,
  responsive = true,
  compact = false,
  showLegend = true,
  showAxisLabels = true,
  showSymmetryAxisLabel = true,
  showKeyPointLabels = false,
}: GraphCanvasProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const transformRef = useRef<ReturnType<typeof buildPlotTransform> | null>(null)
  const responsiveSize = useContainerSize(wrapRef, maxSize, compact ? 180 : 240)
  const canvasSize = responsive ? responsiveSize : maxSize
  const [tooltip, setTooltip] = useState<{
    label: string
    color: string
    left: number
    top: number
  } | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = canvasSize * dpr
    canvas.height = canvasSize * dpr

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, canvasSize, canvasSize)

    const padding = Math.max(24, (compact ? 28 : 36) * (canvasSize / CANVAS_SIZE))
    const transform = buildPlotTransform(canvasSize, canvasSize, padding, viewport)
    transformRef.current = transform

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvasSize, canvasSize)

    drawGrid(ctx, transform)
    drawAxes(ctx, transform, showAxisLabels)
    curves.forEach((curve) => {
      if (curve.axisX !== undefined) {
        drawSymmetryAxis(ctx, curve.axisX, curve.color, transform, showSymmetryAxisLabel)
      }
    })
    curves.forEach((curve) => drawCurve(ctx, curve, transform))
    curves.forEach((curve) =>
      drawKeyPoints(ctx, curve, transform, canvasSize, showKeyPointLabels),
    )
  }, [
    canvasSize,
    compact,
    curves,
    showAxisLabels,
    showKeyPointLabels,
    showSymmetryAxisLabel,
    viewport,
  ])

  const updateTooltip = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current
    const transform = transformRef.current
    if (!canvas || !transform) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvasSize / rect.width
    const scaleY = canvasSize / rect.height
    const mx = (clientX - rect.left) * scaleX
    const my = (clientY - rect.top) * scaleY
    const offsetX = clientX - rect.left
    const offsetY = clientY - rect.top
    const hovered = findHoveredPoint(mx, my, curves, transform, canvasSize)

    if (!hovered) {
      setTooltip(null)
      return
    }

    setTooltip({
      label: hovered.label,
      color: hovered.color,
      left: offsetX + 14,
      top: offsetY - 12,
    })
  }

  const handleMouseMove = (event: ReactMouseEvent<HTMLDivElement>) => {
    updateTooltip(event.clientX, event.clientY)
  }

  const handleMouseLeave = () => {
    setTooltip(null)
  }

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0]
    if (!touch) return
    updateTooltip(touch.clientX, touch.clientY)
  }

  return (
    <div className={`graph-panel${compact ? ' graph-panel-compact' : ''}`}>
      <div
        ref={wrapRef}
        className="graph-canvas-wrap"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleMouseLeave}
      >
        <canvas
          ref={canvasRef}
          className={`graph-canvas${tooltip ? ' is-hovering-point' : ''}`}
          style={{ width: canvasSize, height: canvasSize }}
          aria-label="函数图像坐标系"
        />
        {tooltip && (
          <div
            className="graph-tooltip"
            style={{
              left: tooltip.left,
              top: tooltip.top,
              borderColor: tooltip.color,
            }}
          >
            {tooltip.label}
          </div>
        )}
      </div>
      {showLegend && curves.length > 0 && (
        <div className="legend">
          {curves.map((curve) => (
            <div key={curve.id} className="legend-block">
              <div className="legend-item">
                <span className="legend-color" style={{ backgroundColor: curve.color }} />
                <span className="legend-label">{curve.label}</span>
              </div>
              {(curve.axisX !== undefined || curve.keyPoints.length > 0) && (
                <ul className="legend-annotations">
                  {curve.axisX !== undefined && (
                    <li style={{ color: curve.color }}>{formatAxisLabel(curve.axisX)}</li>
                  )}
                  {curve.keyPoints.map((point) => (
                    <li key={`${point.kind}-${point.x}-${point.y}`}>{point.label}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
