import { Fragment, useMemo } from 'react'

type MathToken =
  | { type: 'text'; value: string }
  | { type: 'fraction'; num: string; den: string; negative: boolean }
  | { type: 'power'; base: string; exp: string }

function tokenizeMathText(input: string): MathToken[] {
  const tokens: MathToken[] = []
  let index = 0

  while (index < input.length) {
    const rest = input.slice(index)
    const powerMatch = rest.match(/^x\^(\d+)/)
    if (powerMatch) {
      tokens.push({ type: 'power', base: 'x', exp: powerMatch[1] })
      index += powerMatch[0].length
      continue
    }

    const fractionMatch = rest.match(/^(-?\d+)\/(\d+)/)
    if (fractionMatch) {
      const raw = fractionMatch[1]
      tokens.push({
        type: 'fraction',
        num: raw.replace('-', ''),
        den: fractionMatch[2],
        negative: raw.startsWith('-'),
      })
      index += fractionMatch[0].length
      continue
    }

    let next = index + 1
    while (next < input.length) {
      const upcoming = input.slice(next)
      if (upcoming.match(/^x\^(\d+)/) || upcoming.match(/^(-?\d+)\/(\d+)/)) {
        break
      }
      next += 1
    }

    tokens.push({ type: 'text', value: input.slice(index, next) })
    index = next
  }

  return tokens
}

interface MathTextProps {
  text: string
  className?: string
}

export function MathText({ text, className }: MathTextProps) {
  const tokens = useMemo(() => tokenizeMathText(text), [text])

  return (
    <span className={className ? `math-text ${className}` : 'math-text'}>
      {tokens.map((token, tokenIndex) => {
        if (token.type === 'text') {
          return <Fragment key={tokenIndex}>{token.value}</Fragment>
        }

        if (token.type === 'power') {
          return (
            <span key={tokenIndex} className="math-power">
              {token.base}
              <sup>{token.exp}</sup>
            </span>
          )
        }

        return (
          <span key={tokenIndex} className="math-frac-wrap">
            {token.negative && <span className="math-sign">-</span>}
            <span className="math-frac" aria-label={`${token.negative ? '-' : ''}${token.num}/${token.den}`}>
              <span className="math-frac-num">{token.num}</span>
              <span className="math-frac-line" aria-hidden="true" />
              <span className="math-frac-den">{token.den}</span>
            </span>
          </span>
        )
      })}
    </span>
  )
}
