function gcd(a: number, b: number): number {
  let x = Math.abs(a)
  let y = Math.abs(b)

  while (y !== 0) {
    const temp = y
    y = x % y
    x = temp
  }

  return x || 1
}

export function formatFraction(value: number, maxDenominator = 1000): string {
  if (!Number.isFinite(value)) {
    return String(value)
  }

  const rounded = Math.round(value)
  if (Math.abs(value - rounded) < 1e-9) {
    return String(rounded)
  }

  let bestNumerator = rounded
  let bestDenominator = 1
  let bestError = Math.abs(value - rounded)

  for (let denominator = 1; denominator <= maxDenominator; denominator += 1) {
    const numerator = Math.round(value * denominator)
    const error = Math.abs(value - numerator / denominator)

    if (error < bestError) {
      bestError = error
      bestNumerator = numerator
      bestDenominator = denominator
    }
  }

  const divisor = gcd(bestNumerator, bestDenominator)
  const numerator = bestNumerator / divisor
  const denominator = bestDenominator / divisor

  if (denominator === 1) {
    return String(numerator)
  }

  if (numerator < 0) {
    return `-${Math.abs(numerator)}/${denominator}`
  }

  return `${numerator}/${denominator}`
}

export function formatTick(value: number): string {
  return formatFraction(value)
}

export function formatCoordinate(x: number, y: number): string {
  return `(${formatFraction(x)}, ${formatFraction(y)})`
}
