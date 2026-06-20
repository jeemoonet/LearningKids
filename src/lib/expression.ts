import { create, all, type MathNode } from 'mathjs'

const math = create(all, {})

export type FunctionKind = 'polynomial' | 'inverse'

export interface ParseResult {
  ok: true
  processed: string
  compiled: ReturnType<MathNode['compile']>
  kind: FunctionKind
  degree: number
  axisX?: number
}

export interface ParseError {
  ok: false
  message: string
}

export type ExpressionResult = ParseResult | ParseError

function collectSymbols(node: MathNode, symbols = new Set<string>()): Set<string> {
  if (node.type === 'SymbolNode' && 'name' in node) {
    symbols.add(node.name as string)
  }

  node.forEach((child) => collectSymbols(child, symbols))
  return symbols
}

export function preprocess(input: string): string {
  let expr = input.trim()
  if (!expr) return ''

  expr = expr.replace(/^y\s*=\s*/i, '')
  expr = expr.replace(/(\d+\/\d+)([x(])/gi, '$1*$2')
  expr = expr.replace(/(\d)([x(])/gi, '$1*$2')
  expr = expr.replace(/\)([x\d(])/gi, ')*$1')
  expr = expr.replace(/x(\d)/gi, 'x*$1')

  return expr
}

function getPolynomialDegree(node: MathNode): number {
  let current = node
  let degree = 0

  for (let order = 1; order <= 5; order += 1) {
    let value: number

    try {
      value = math.derivative(current, 'x').compile().evaluate({ x: 1.234 })
    } catch {
      break
    }

    if (typeof value === 'number' && Number.isFinite(value) && Math.abs(value) > 1e-9) {
      degree = order
      current = math.derivative(current, 'x')
      continue
    }

    break
  }

  return degree
}

function getQuadraticAxis(node: MathNode): number | null {
  try {
    const firstDerivative = math.derivative(node, 'x')
    const secondDerivative = math.derivative(firstDerivative, 'x')
    const a2 = secondDerivative.compile().evaluate({ x: 0 })
    const b = firstDerivative.compile().evaluate({ x: 0 })

    if (
      typeof a2 !== 'number' ||
      typeof b !== 'number' ||
      !Number.isFinite(a2) ||
      !Number.isFinite(b) ||
      Math.abs(a2) < 1e-9
    ) {
      return null
    }

    return -b / a2
  } catch {
    return null
  }
}
function isInverseProportional(compiled: ReturnType<MathNode['compile']>): boolean {
  const testXs = [0.5, 1, 2, -1, -2]
  const products: number[] = []

  for (const x of testXs) {
    const y = evaluateY(compiled, x)
    if (y === null) return false
    products.push(y * x)
  }

  const k = products[0]
  if (Math.abs(k) < 1e-9) return false

  return products.every((product) => Math.abs(product - k) < 1e-4)
}

export function parseExpression(input: string): ExpressionResult {
  const processed = preprocess(input)
  if (!processed) {
    return { ok: false, message: '' }
  }

  let node: MathNode

  try {
    node = math.parse(processed)
  } catch {
    return { ok: false, message: '表达式格式有误，请检查括号或符号' }
  }

  const symbols = collectSymbols(node)
  const invalidSymbols = [...symbols].filter((name) => name !== 'x')

  if (invalidSymbols.length > 0) {
    return { ok: false, message: '目前只支持以 x 为变量的函数' }
  }

  let compiled: ReturnType<MathNode['compile']>

  try {
    compiled = node.compile()
  } catch {
    return { ok: false, message: '表达式格式有误，请检查括号或符号' }
  }

  if (isInverseProportional(compiled)) {
    return {
      ok: true,
      processed,
      compiled,
      kind: 'inverse',
      degree: -1,
    }
  }

  const degree = getPolynomialDegree(node)

  if (degree > 2) {
    return {
      ok: false,
      message: '基础版仅支持一次函数、二次函数和反比例函数',
    }
  }

  return {
    ok: true,
    processed,
    compiled,
    kind: 'polynomial',
    degree,
    axisX: degree === 2 ? getQuadraticAxis(node) ?? undefined : undefined,
  }
}

export function evaluateY(
  compiled: ReturnType<MathNode['compile']>,
  x: number,
): number | null {
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
