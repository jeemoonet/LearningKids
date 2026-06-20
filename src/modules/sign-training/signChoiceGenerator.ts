import { SIGN_TEST_ROUND_COUNT } from '../../constants'
import type { SignChoiceQuestion } from './signChoiceTypes'
import type { SignQuestion } from './signGenerator'
import { formatLinearExpression, generateSignQuestion } from './signGenerator'

export type { SignChoiceQuestion } from './signChoiceTypes'

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function shuffle<T>(items: T[]): T[] {
  const next = [...items]
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = randomInt(0, i)
    ;[next[i], next[j]] = [next[j], next[i]]
  }
  return next
}

/** 在同一系数绝对值下，枚举 x 项与常数项的正负号组合 */
export function buildSignVariants(answerA: number, answerB: number): string[] {
  const absA = Math.abs(answerA)
  const absB = Math.abs(answerB)
  const variants = new Set<string>()

  const coeffPairs =
    answerB === 0
      ? [
          [absA, 0],
          [-absA, 0],
        ]
      : [
          [absA, absB],
          [absA, -absB],
          [-absA, absB],
          [-absA, -absB],
        ]

  for (const [a, b] of coeffPairs) {
    variants.add(formatLinearExpression(a, b))
  }

  return [...variants]
}

function pickWrongVariants(variants: string[], correctAnswer: string): string[] {
  const wrong = variants.filter((variant) => variant !== correctAnswer)
  const shuffled = shuffle(wrong)
  return shuffled.slice(0, 2)
}

export function toChoiceQuestion(question: SignQuestion): SignChoiceQuestion | null {
  const variants = buildSignVariants(question.answerA, question.answerB)
  const wrongOptions = pickWrongVariants(variants, question.answer)

  if (wrongOptions.length < 2) {
    return null
  }

  const options = shuffle([question.answer, wrongOptions[0], wrongOptions[1]]) as [
    string,
    string,
    string,
  ]
  const correctIndex = options.indexOf(question.answer) as 0 | 1 | 2

  return {
    ...question,
    options,
    correctIndex,
  }
}

export function generateSignChoiceQuestion(): SignChoiceQuestion {
  let attempts = 0

  while (attempts < 40) {
    attempts += 1
    const question = generateSignQuestion()

    if (question.answerB === 0) continue

    const choice = toChoiceQuestion(question)
    if (choice) return choice
  }

  const fallbackQuestion: SignQuestion = {
    id: 'sign-fallback',
    number: 0,
    prompt: '-(2x - 3)',
    answer: '-2x + 3',
    answerA: -2,
    answerB: 3,
    rule: 'negate-paren',
    steps: ['括号前添负号，括号内各项变号', '结果：-2x + 3'],
  }

  const choice = toChoiceQuestion(fallbackQuestion)
  if (choice) return choice

  const options: [string, string, string] = ['-2x + 3', '-2x - 3', '2x + 3']
  const shuffled = shuffle(options) as [string, string, string]
  return {
    ...fallbackQuestion,
    options: shuffled,
    correctIndex: shuffled.indexOf('-2x + 3') as 0 | 1 | 2,
  }
}

export function generateSignChoiceQuestions(
  count = SIGN_TEST_ROUND_COUNT,
): SignChoiceQuestion[] {
  const seen = new Set<string>()
  const questions: SignChoiceQuestion[] = []
  let attempts = 0

  while (questions.length < count && attempts < count * 40) {
    attempts += 1
    const question = generateSignChoiceQuestion()
    const key = question.prompt
    if (seen.has(key)) continue

    seen.add(key)
    questions.push({
      ...question,
      id: `sign-test-${questions.length + 1}`,
      number: questions.length + 1,
    })
  }

  return questions
}
