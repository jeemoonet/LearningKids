import { formatFraction } from './format'
import type { CurveData } from './graph'

function formatVertexCoordinate(x: number, y: number): string {
  return `(${formatFraction(x)}, ${formatFraction(y)})`
}

function formatAxisCoordinate(x: number, y: number): string {
  return `（${formatFraction(x)},${formatFraction(y)}）`
}

export function buildQuizAnnotationLines(
  curve: Pick<CurveData, 'axisX' | 'keyPoints'>,
): string[] {
  const lines: string[] = []

  if (curve.axisX !== undefined) {
    lines.push(`对称轴：x=${formatFraction(curve.axisX)}`)
  }

  const vertex = curve.keyPoints.find((point) => point.kind === 'vertex')
  if (vertex) {
    lines.push(`顶点：${formatVertexCoordinate(vertex.x, vertex.y)}`)
  }

  const xIntercepts = curve.keyPoints.filter((point) => point.kind === 'x-intercept')
  if (xIntercepts.length > 0) {
    lines.push(`X轴：${xIntercepts.map((point) => formatAxisCoordinate(point.x, point.y)).join('')}`)
  }

  const yIntercepts = curve.keyPoints.filter((point) => point.kind === 'y-intercept')
  if (yIntercepts.length > 0) {
    lines.push(`Y轴：${yIntercepts.map((point) => formatAxisCoordinate(point.x, point.y)).join('')}`)
  }

  return lines
}
