import { create, all, type MathNode } from 'mathjs'
import type { FunctionKind } from './expression'
import { formatCoordinate, formatFraction } from './format'

const math = create(all, {})

export type KeyPointKind = 'x-intercept' | 'y-intercept' | 'vertex'

export interface KeyPoint {
  x: number
  y: number
  kind: KeyPointKind
  label: string
}

function evaluateY(compiled: ReturnType<MathNode['compile']>, x: number): number | null {
  try {
    const y = compiled.evaluate({ x })
    if (typeof y !== 'number' || !Number.isFinite(y)) {
      return null
    }
    return y
  } catch {
    return null
  }
}

function formatPointCoordinate(x: number, y: number): string {
  return formatCoordinate(x, y)
}

function getLinearCoeffs(node: MathNode): { a: number; b: number } | null {
  try {
    const firstDerivative = math.derivative(node, 'x')
    const a = firstDerivative.compile().evaluate({ x: 0 })
    const b = node.compile().evaluate({ x: 0 })

    if (
      typeof a !== 'number' ||
      typeof b !== 'number' ||
      !Number.isFinite(a) ||
      !Number.isFinite(b)
    ) {
      return null
    }

    return { a, b }
  } catch {
    return null
  }
}

function getQuadraticCoeffs(node: MathNode): { a: number; b: number; c: number } | null {
  try {
    const firstDerivative = math.derivative(node, 'x')
    const secondDerivative = math.derivative(firstDerivative, 'x')
    const a2 = secondDerivative.compile().evaluate({ x: 0 })
    const b = firstDerivative.compile().evaluate({ x: 0 })
    const c = node.compile().evaluate({ x: 0 })

    if (
      typeof a2 !== 'number' ||
      typeof b !== 'number' ||
      typeof c !== 'number' ||
      !Number.isFinite(a2) ||
      !Number.isFinite(b) ||
      !Number.isFinite(c) ||
      Math.abs(a2) < 1e-9
    ) {
      return null
    }

    return { a: a2 / 2, b, c }
  } catch {
    return null
  }
}

function addYIntercept(compiled: ReturnType<MathNode['compile']>, points: KeyPoint[]) {
  const y = evaluateY(compiled, 0)
  if (y === null) return

  addKeyPoint(points, {
    x: 0,
    y,
    kind: 'y-intercept',
    label: `与 y 轴交点 ${formatPointCoordinate(0, y)}`,
  })
}

function addXIntercept(x: number, points: KeyPoint[]) {
  if (!Number.isFinite(x)) return

  addKeyPoint(points, {
    x,
    y: 0,
    kind: 'x-intercept',
    label: `与 x 轴交点 ${formatPointCoordinate(x, 0)}`,
  })
}

function addKeyPoint(points: KeyPoint[], point: KeyPoint) {
  const existing = points.find(
    (item) => Math.abs(item.x - point.x) < 1e-6 && Math.abs(item.y - point.y) < 1e-6,
  )

  if (existing) {
    if (!existing.label.includes(point.label)) {
      existing.label = `${existing.label}；${point.label}`
    }
    return
  }

  points.push(point)
}

function addVertex(
  compiled: ReturnType<MathNode['compile']>,
  vertexX: number,
  points: KeyPoint[],
) {
  const vertexY = evaluateY(compiled, vertexX)
  if (vertexY === null) return

  addKeyPoint(points, {
    x: vertexX,
    y: vertexY,
    kind: 'vertex',
    label: `顶点 ${formatPointCoordinate(vertexX, vertexY)}`,
  })
}

export function getKeyPoints(
  processed: string,
  kind: FunctionKind,
  degree: number,
): KeyPoint[] {
  if (kind === 'inverse') {
    return []
  }

  let node: MathNode
  try {
    node = math.parse(processed)
  } catch {
    return []
  }

  const compiled = node.compile()
  const points: KeyPoint[] = []

  if (degree === 1) {
    const coeffs = getLinearCoeffs(node)
    if (!coeffs) return []

    addYIntercept(compiled, points)

    if (Math.abs(coeffs.a) > 1e-9) {
      addXIntercept(-coeffs.b / coeffs.a, points)
    }

    return points
  }

  if (degree === 2) {
    const coeffs = getQuadraticCoeffs(node)
    if (!coeffs) return []

    addYIntercept(compiled, points)
    addVertex(compiled, -coeffs.b / (2 * coeffs.a), points)

    const discriminant = coeffs.b * coeffs.b - 4 * coeffs.a * coeffs.c
    if (discriminant < -1e-9) {
      return points
    }

    if (Math.abs(discriminant) <= 1e-9) {
      addXIntercept(-coeffs.b / (2 * coeffs.a), points)
      return points
    }

    const sqrtD = Math.sqrt(discriminant)
    addXIntercept((-coeffs.b - sqrtD) / (2 * coeffs.a), points)
    addXIntercept((-coeffs.b + sqrtD) / (2 * coeffs.a), points)
    return points
  }

  return points
}

export function formatAxisLabel(axisX: number): string {
  return `对称轴 x = ${formatFraction(axisX)}`
}
