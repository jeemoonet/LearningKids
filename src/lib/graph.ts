import {
  ASYMPTOTE_EPS,
  DEFAULT_X_MAX,
  DEFAULT_X_MIN,
  INVERSE_VIEWPORT_HALF,
  MAX_POLYNOMIAL_VIEWPORT_HALF,
  MIN_VIEWPORT_HALF,
  SAMPLE_STEP,
  VIEWPORT_Y_CAP,
} from '../constants'
import { evaluateY, type ParseResult } from './expression'
import { getKeyPoints, type KeyPoint } from './keyPoints'

export interface Point {
  x: number
  y: number
}

export interface CurveData {
  id: string
  label: string
  color: string
  segments: Point[][]
  axisX?: number
  keyPoints: KeyPoint[]
}

export interface Viewport {
  xMin: number
  xMax: number
  yMin: number
  yMax: number
}

export interface PlotTransform {
  scale: number
  offsetX: number
  offsetY: number
  usedWidth: number
  usedHeight: number
  viewport: Viewport
}

export function buildPlotTransform(
  width: number,
  height: number,
  padding: number,
  viewport: Viewport,
): PlotTransform {
  const plotWidth = width - padding * 2
  const plotHeight = height - padding * 2
  const xSpan = viewport.xMax - viewport.xMin
  const ySpan = viewport.yMax - viewport.yMin

  const scale = Math.min(plotWidth / xSpan, plotHeight / ySpan)
  const usedWidth = xSpan * scale
  const usedHeight = ySpan * scale

  return {
    scale,
    offsetX: padding + (plotWidth - usedWidth) / 2,
    offsetY: padding + (plotHeight - usedHeight) / 2,
    usedWidth,
    usedHeight,
    viewport,
  }
}

export function toCanvasPoint(x: number, y: number, transform: PlotTransform) {
  const { scale, offsetX, offsetY, viewport } = transform

  return {
    px: offsetX + (x - viewport.xMin) * scale,
    py: offsetY + (viewport.yMax - y) * scale,
  }
}

export function getGridStep(viewport: Viewport): number {
  const span = Math.max(viewport.xMax - viewport.xMin, viewport.yMax - viewport.yMin)

  if (span <= 12) return 1
  if (span <= 24) return 2
  if (span <= 40) return 2
  return 5
}

export function getSampleStep(xMin: number, xMax: number): number {
  const span = xMax - xMin

  if (span <= 20) return SAMPLE_STEP
  if (span <= 60) return 0.1
  if (span <= 120) return 0.2
  return 0.5
}
function sampleRange(
  compiled: ParseResult['compiled'],
  xMin: number,
  xMax: number,
  step = getSampleStep(xMin, xMax),
): Point[] {
  const points: Point[] = []
  const count = Math.ceil((xMax - xMin) / step)

  for (let i = 0; i <= count; i += 1) {
    const x = Math.min(xMin + i * step, xMax)
    const y = evaluateY(compiled, x)

    if (y !== null) {
      points.push({ x, y: Number(y.toFixed(8)) })
    }
  }

  return points
}

export function sampleCurve(
  parsed: ParseResult,
  xMin: number,
  xMax: number,
): Point[][] {
  const step = getSampleStep(xMin, xMax)

  if (parsed.kind === 'inverse') {
    const segments: Point[][] = []

    if (xMin < -ASYMPTOTE_EPS) {
      segments.push(sampleRange(parsed.compiled, xMin, -ASYMPTOTE_EPS, step))
    }

    if (xMax > ASYMPTOTE_EPS) {
      segments.push(sampleRange(parsed.compiled, ASYMPTOTE_EPS, xMax, step))
    }

    return segments.filter((segment) => segment.length > 0)
  }

  return [sampleRange(parsed.compiled, xMin, xMax, step)]
}

export function buildViewport(curves: CurveData[]): Viewport {
  const defaultHalf = (DEFAULT_X_MAX - DEFAULT_X_MIN) / 2
  const featureXs: number[] = []
  const featureYs: number[] = []

  curves.forEach((curve) => {
    curve.keyPoints.forEach((point) => {
      featureXs.push(point.x)
      featureYs.push(point.y)
    })

    if (curve.axisX !== undefined) {
      featureXs.push(curve.axisX)
    }
  })

  if (featureXs.length === 0) {
    const half = curves.length > 0 ? INVERSE_VIEWPORT_HALF : defaultHalf
    return { xMin: -half, xMax: half, yMin: -half, yMax: half }
  }

  const xCoreMin = Math.min(...featureXs)
  const xCoreMax = Math.max(...featureXs)
  const xCoreSpan = Math.max(xCoreMax - xCoreMin, 1)
  const xPad = Math.max(1.5, xCoreSpan * 0.45)
  const focusXMin = xCoreMin - xPad
  const focusXMax = xCoreMax + xPad

  const segmentYs = curves
    .flatMap((curve) =>
      curve.segments.flatMap((segment) =>
        segment
          .filter((point) => point.x >= focusXMin && point.x <= focusXMax)
          .map((point) => point.y),
      ),
    )
    .filter((y) => Math.abs(y) <= VIEWPORT_Y_CAP)

  const allYs = [...featureYs, ...segmentYs]

  if (allYs.length === 0) {
    const half = Math.min(defaultHalf, MAX_POLYNOMIAL_VIEWPORT_HALF)
    return { xMin: -half, xMax: half, yMin: -half, yMax: half }
  }

  let yMin = Math.min(...allYs)
  let yMax = Math.max(...allYs)

  if (yMin === yMax) {
    yMin -= 2
    yMax += 2
  } else {
    const yPad = (yMax - yMin) * 0.15
    yMin -= yPad
    yMax += yPad
  }

  const boundXMin = Math.min(focusXMin, 0)
  const boundXMax = Math.max(focusXMax, 0)
  const boundYMin = Math.min(yMin, 0)
  const boundYMax = Math.max(yMax, 0)
  const span = Math.min(
    Math.max(boundXMax - boundXMin, boundYMax - boundYMin, MIN_VIEWPORT_HALF * 2),
    MAX_POLYNOMIAL_VIEWPORT_HALF * 2,
  )
  const half = span / 2
  const xCenter = (boundXMin + boundXMax) / 2
  const yCenter = (boundYMin + boundYMax) / 2

  return {
    xMin: xCenter - half,
    xMax: xCenter + half,
    yMin: yCenter - half,
    yMax: yCenter + half,
  }
}

export function buildCurves(
  entries: Array<{
    id: string
    label: string
    color: string
    parsed: ParseResult
  }>,
): { curves: CurveData[]; viewport: Viewport } {
  if (entries.length === 0) {
    const half = (DEFAULT_X_MAX - DEFAULT_X_MIN) / 2
    return {
      curves: [],
      viewport: { xMin: -half, xMax: half, yMin: -half, yMax: half },
    }
  }

  const preview = entries.map((entry) => ({
    id: entry.id,
    label: entry.label,
    color: entry.color,
    segments: sampleCurve(entry.parsed, DEFAULT_X_MIN, DEFAULT_X_MAX),
    axisX: entry.parsed.axisX,
    keyPoints: getKeyPoints(entry.parsed.processed, entry.parsed.kind, entry.parsed.degree),
  }))

  const viewport = buildViewport(preview)

  const curves = entries.map((entry) => ({
    id: entry.id,
    label: entry.label,
    color: entry.color,
    segments: sampleCurve(entry.parsed, viewport.xMin, viewport.xMax),
    axisX: entry.parsed.axisX,
    keyPoints: getKeyPoints(entry.parsed.processed, entry.parsed.kind, entry.parsed.degree),
  }))

  return { curves, viewport }
}

export { formatTick } from './format'
