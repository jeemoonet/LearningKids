import type { SignChoiceQuestion } from './signChoiceTypes'
import { toChoiceQuestion } from './signChoiceGenerator'
import {
  formatLinearExpression,
  type SignQuestion,
} from './signGenerator'

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

interface SubExpression {
  outer: number
  innerA: number
  innerB: number
}

function randomSubExpression(): SubExpression {
  const innerA = randomNonZeroInt(-3, 3)
  const innerB = randomInt(-4, 4)
  const kind = randomInt(0, 2)

  if (kind === 0) {
    return { outer: -1, innerA, innerB }
  }

  if (kind === 1) {
    return { outer: randomNonZeroInt(-3, -1), innerA, innerB }
  }

  return { outer: 1, innerA, innerB }
}

function formatSubExpression(sub: SubExpression): string {
  const inner = formatLinearExpression(sub.innerA, sub.innerB)

  if (sub.outer === 1) {
    return `(${inner})`
  }

  if (sub.outer === -1) {
    return `-(${inner})`
  }

  return `${sub.outer}(${inner})`
}

function expandSubExpression(sub: SubExpression): { a: number; b: number } {
  return {
    a: sub.outer * sub.innerA,
    b: sub.outer * sub.innerB,
  }
}

function buildCombineQuestion(): SignQuestion | null {
  const sub1 = randomSubExpression()
  const sub2 = randomSubExpression()
  const op = Math.random() < 0.5 ? '+' : '-'
  const expanded1 = expandSubExpression(sub1)
  const expanded2 = expandSubExpression(sub2)
  const answerA = op === '+' ? expanded1.a + expanded2.a : expanded1.a - expanded2.a
  const answerB = op === '+' ? expanded1.b + expanded2.b : expanded1.b - expanded2.b

  if (answerB === 0) {
    return null
  }

  const answer = formatLinearExpression(answerA, answerB)
  const prompt = `${formatSubExpression(sub1)} ${op} ${formatSubExpression(sub2)}`
  const expanded1Text = formatLinearExpression(expanded1.a, expanded1.b)
  const expanded2Text = formatLinearExpression(expanded2.a, expanded2.b)

  return {
    id: '',
    number: 0,
    prompt,
    answer,
    answerA,
    answerB,
    rule: 'combine-expr',
    steps: [
      '分别去括号化简两个式子',
      `第一项：${expanded1Text}`,
      `第二项：${expanded2Text}`,
      `合并：${answer}`,
    ],
  }
}

export function generateAdvancedSignQuestion(): SignQuestion {
  let attempts = 0

  while (attempts < 40) {
    attempts += 1
    const question = buildCombineQuestion()
    if (question) return question
  }

  return {
    id: 'sign-advanced-fallback',
    number: 0,
    prompt: '-(2x - 3) + (x + 1)',
    answer: '-x + 4',
    answerA: -1,
    answerB: 4,
    rule: 'combine-expr',
    steps: ['分别去括号', '合并同类项', '结果：-x + 4'],
  }
}

export function generateAdvancedSignChoiceQuestion(): SignChoiceQuestion {
  let attempts = 0

  while (attempts < 40) {
    attempts += 1
    const question = generateAdvancedSignQuestion()
    const choice = toChoiceQuestion(question)
    if (choice) return choice
  }

  const fallback = generateAdvancedSignQuestion()
  const choice = toChoiceQuestion(fallback)
  if (choice) return choice

  throw new Error('Failed to generate advanced sign choice question')
}

export function generateAdvancedSignChoiceQuestions(count: number): SignChoiceQuestion[] {
  const seen = new Set<string>()
  const questions: SignChoiceQuestion[] = []
  let attempts = 0

  while (questions.length < count && attempts < count * 40) {
    attempts += 1
    const question = generateAdvancedSignChoiceQuestion()
    const key = question.prompt
    if (seen.has(key)) continue

    seen.add(key)
    questions.push({
      ...question,
      id: `sign-advanced-${questions.length + 1}`,
      number: questions.length + 1,
    })
  }

  return questions
}
