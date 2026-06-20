import { QUIZ_QUESTION_COUNT } from '../constants'
import { formatQuadratic, pickQuadraticCoeff } from './randomExpression'

export interface QuizQuestion {
  id: string
  number: number
  expression: string
}

export function generateQuizQuestions(count = QUIZ_QUESTION_COUNT): QuizQuestion[] {
  const seen = new Set<string>()
  const questions: QuizQuestion[] = []
  let attempts = 0

  while (questions.length < count && attempts < count * 30) {
    attempts += 1

    const expression = formatQuadratic(
      pickQuadraticCoeff(true, true),
      pickQuadraticCoeff(false, true),
      pickQuadraticCoeff(false, true),
    )

    if (seen.has(expression)) continue

    seen.add(expression)
    questions.push({
      id: `quiz-${questions.length + 1}`,
      number: questions.length + 1,
      expression,
    })
  }

  return questions
}
