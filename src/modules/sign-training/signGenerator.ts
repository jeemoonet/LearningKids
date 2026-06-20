import { SIGN_TRAINING_QUESTION_COUNT } from '../../constants'

export type SignRule = 'negate-paren' | 'coeff-times-paren' | 'double-neg' | 'combine-expr'

export interface SignQuestion {
  id: string
  number: number
  prompt: string
  answer: string
  answerA: number
  answerB: number
  steps: string[]
  rule: SignRule
}

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

function formatCoeffMagnitude(abs: number, omitUnit = false): string {
  if (omitUnit && abs === 1) {
    return ''
  }
  return String(abs)
}

function formatSignedTerm(
  coeff: number,
  variable: string,
  isFirst = false,
): string {
  const sign = coeff < 0 ? '-' : isFirst ? '' : '+'
  const gap = isFirst ? '' : ' '
  const magnitude = formatCoeffMagnitude(Math.abs(coeff), variable !== '')

  if (!magnitude) {
    return `${sign}${gap}${variable}`
  }

  if (!variable) {
    return `${sign}${gap}${magnitude}`
  }

  return `${sign}${gap}${magnitude}${variable}`
}

export function formatLinearExpression(a: number, b: number): string {
  const xTerm = formatSignedTerm(a, 'x', true)
  const constant = b === 0 ? '' : formatSignedTerm(b, '', false)
  return `${xTerm}${constant}`
}

function flipSign(coeff: number): number {
  return -coeff
}

function ruleLabel(rule: SignRule): string {
  switch (rule) {
    case 'negate-paren':
      return '括号前添负号，括号内各项变号'
    case 'coeff-times-paren':
      return '负系数分配进括号，注意符号'
    case 'double-neg':
      return '双重负号：括号前负号使内部变号'
    default:
      return ''
  }
}

function buildNegateParenQuestion(): SignQuestion | null {
  const a = randomNonZeroInt(-4, 4)
  const b = randomInt(-5, 5)
  const inner = formatLinearExpression(a, b)
  const resultA = flipSign(a)
  const resultB = flipSign(b)
  const answer = formatLinearExpression(resultA, resultB)

  return {
    id: '',
    number: 0,
    prompt: `-(${inner})`,
    answer,
    answerA: resultA,
    answerB: resultB,
    rule: 'negate-paren',
    steps: [
      ruleLabel('negate-paren'),
      `${formatSignedTerm(a, 'x', true)} → ${formatSignedTerm(resultA, 'x', true)}`,
      b === 0 ? '' : `${formatSignedTerm(b, '', false)} → ${formatSignedTerm(resultB, '', false)}`,
      `结果：${answer}`,
    ].filter(Boolean),
  }
}

function buildCoeffTimesParenQuestion(): SignQuestion | null {
  const k = randomNonZeroInt(-4, -1)
  const a = randomNonZeroInt(-3, 3)
  const b = randomInt(-5, 5)
  const inner = formatLinearExpression(a, b)
  const resultA = k * a
  const resultB = k * b
  const answer = formatLinearExpression(resultA, resultB)
  const kText = k === -1 ? '-' : String(k)

  return {
    id: '',
    number: 0,
    prompt: `${kText}(${inner})`,
    answer,
    answerA: resultA,
    answerB: resultB,
    rule: 'coeff-times-paren',
    steps: [
      ruleLabel('coeff-times-paren'),
      `${kText} × ${formatSignedTerm(a, 'x', true)} = ${formatSignedTerm(resultA, 'x', true)}`,
      b === 0 ? '' : `${kText} × ${formatSignedTerm(b, '', true)} = ${formatSignedTerm(resultB, '', true)}`,
      `结果：${answer}`,
    ].filter(Boolean),
  }
}

function buildDoubleNegQuestion(): SignQuestion | null {
  const a = -randomInt(1, 4)
  const b = randomInt(-5, 5)
  const inner = formatLinearExpression(a, b)
  const resultA = flipSign(a)
  const resultB = flipSign(b)
  const answer = formatLinearExpression(resultA, resultB)

  return {
    id: '',
    number: 0,
    prompt: `-(${inner})`,
    answer,
    answerA: resultA,
    answerB: resultB,
    rule: 'double-neg',
    steps: [
      ruleLabel('double-neg'),
      `括号内：${formatSignedTerm(a, 'x', true)}${b === 0 ? '' : formatSignedTerm(b, '', false)}`,
      `变号后：${formatSignedTerm(resultA, 'x', true)}${resultB === 0 ? '' : formatSignedTerm(resultB, '', false)}`,
      `结果：${answer}`,
    ],
  }
}

const BUILDERS = [
  buildNegateParenQuestion,
  buildCoeffTimesParenQuestion,
  buildDoubleNegQuestion,
]

export function generateSignQuestions(count = SIGN_TRAINING_QUESTION_COUNT): SignQuestion[] {
  const seen = new Set<string>()
  const questions: SignQuestion[] = []
  let attempts = 0

  while (questions.length < count && attempts < count * 40) {
    attempts += 1

    const builder = BUILDERS[randomInt(0, BUILDERS.length - 1)]
    const draft = builder()
    if (!draft) continue

    const key = `${draft.rule}:${draft.prompt}`
    if (seen.has(key)) continue

    seen.add(key)
    questions.push({
      ...draft,
      id: `sign-${questions.length + 1}`,
      number: questions.length + 1,
    })
  }

  return questions
}

export function generateSignQuestion(): SignQuestion {
  const questions = generateSignQuestions(1)
  return questions[0] ?? buildNegateParenQuestion()!
}
