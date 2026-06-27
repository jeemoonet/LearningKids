import type { SentenceQuestion } from './types'

export function getFilledSentence(question: SentenceQuestion): string {
  return question.sentence.replace('______', question.answer)
}

/** 答错时的错误原因文案 */
export function getWrongAnswerReason(question: SentenceQuestion, chosenLabel: string): string {
  return `你选择了「${chosenLabel}」，但此处应填${question.roleLabel}「${question.answer}」。`
}
