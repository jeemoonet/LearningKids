export type RandomFunctionKind = 'linear' | 'quadratic' | 'inverse'

export interface SimpleFraction {
  num: number
  den: number
}

export type QuadraticCoeff = number | SimpleFraction

export const SIMPLE_QUADRATIC_FRACTIONS: SimpleFraction[] = [
  { num: 1, den: 2 },
  { num: -1, den: 2 },
  { num: 1, den: 3 },
  { num: -1, den: 3 },
  { num: 2, den: 3 },
  { num: -2, den: 3 },
]

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomNonZeroInt(min: number, max: number): number {
  let value = randomInt(min, max)
  while (value === 0) {
    value = randomInt(min, max)
  }
  return value
}

export function coeffToNumber(coefficient: QuadraticCoeff): number {
  if (typeof coefficient === 'number') {
    return coefficient
  }

  return coefficient.num / coefficient.den
}

function formatCoeffMagnitude(coefficient: QuadraticCoeff, omitUnit = false): string {
  if (typeof coefficient === 'number') {
    const abs = Math.abs(coefficient)
    if (omitUnit && abs === 1) {
      return ''
    }
    return String(abs)
  }

  const absNum = Math.abs(coefficient.num)
  if (omitUnit && absNum === coefficient.den) {
    return ''
  }

  return `${absNum}/${coefficient.den}`
}

function formatSignedTerm(
  coefficient: QuadraticCoeff,
  variable: string,
  isFirst = false,
): string {
  const value = coeffToNumber(coefficient)
  const sign = value < 0 ? '-' : isFirst ? '' : '+'
  const gap = isFirst ? '' : ' '
  const magnitude = formatCoeffMagnitude(coefficient, variable !== '')

  if (!magnitude) {
    return `${sign}${gap}${variable}`
  }

  if (!variable) {
    return `${sign}${gap}${magnitude}`
  }

  return `${sign}${gap}${magnitude}${variable}`
}

function formatLinear(a: number, b: number): string {
  const xTerm = formatSignedTerm(a, 'x', true)
  const constant = b === 0 ? '' : formatSignedTerm(b, '', false)
  return `y = ${xTerm}${constant}`
}

export function formatQuadratic(a: QuadraticCoeff, b: QuadraticCoeff, c: QuadraticCoeff): string {
  const terms = [
    formatSignedTerm(a, 'x^2', true),
    coeffToNumber(b) === 0 ? '' : formatSignedTerm(b, 'x', false),
    coeffToNumber(c) === 0 ? '' : formatSignedTerm(c, '', false),
  ].filter(Boolean)

  return terms.join(' ')
}

export function pickQuadraticCoeff(isLeading: boolean, allowFraction: boolean): QuadraticCoeff {
  const useFraction = allowFraction && Math.random() < (isLeading ? 0.4 : 0.3)

  if (!useFraction) {
    return isLeading ? randomNonZeroInt(-2, 2) : randomInt(-5, 5)
  }

  const fraction =
    SIMPLE_QUADRATIC_FRACTIONS[randomInt(0, SIMPLE_QUADRATIC_FRACTIONS.length - 1)]

  if (isLeading && coeffToNumber(fraction) === 0) {
    return { num: 1, den: 2 }
  }

  return fraction
}

function formatInverse(k: number): string {
  if (k === 1) return '1/x'
  if (k === -1) return '-1/x'
  return `${k}/x`
}

function pickKind(): RandomFunctionKind {
  const kinds: RandomFunctionKind[] = ['linear', 'quadratic', 'inverse']
  return kinds[Math.floor(Math.random() * kinds.length)]
}

export function generateRandomExpression(kind = pickKind()): string {
  switch (kind) {
    case 'linear':
      return formatLinear(randomNonZeroInt(-5, 5), randomInt(-8, 8))
    case 'quadratic':
      return formatQuadratic(
        pickQuadraticCoeff(true, true),
        pickQuadraticCoeff(false, true),
        pickQuadraticCoeff(false, true),
      )
    case 'inverse':
      return formatInverse(randomNonZeroInt(-9, 9))
    default:
      return formatLinear(2, 1)
  }
}

export function generateRandomExpressions(count: number): string[] {
  const kinds: RandomFunctionKind[] = ['linear', 'quadratic', 'inverse']
  const pickedKinds = Array.from({ length: count }, (_, index) => kinds[index % kinds.length])

  for (let i = pickedKinds.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pickedKinds[i], pickedKinds[j]] = [pickedKinds[j], pickedKinds[i]]
  }

  return pickedKinds.map((kind) => generateRandomExpression(kind))
}
