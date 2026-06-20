import { useMemo, useState } from 'react'
import { FUNCTION_COLORS, QUIZ_GRAPH_SIZE } from '../constants'
import { parseExpression } from '../lib/expression'
import { buildCurves } from '../lib/graph'
import { buildQuizAnnotationLines } from '../lib/quizAnnotations'
import type { QuizQuestion } from '../lib/quizGenerator'
import { GraphCanvas } from './GraphCanvas'
import { MathText } from './MathText'

interface QuizCardProps {
  question: QuizQuestion
}

export function QuizCard({ question }: QuizCardProps) {
  const [flipped, setFlipped] = useState(false)
  const [hasRevealed, setHasRevealed] = useState(false)

  const answer = useMemo(() => {
    const parsed = parseExpression(question.expression)
    if (!parsed.ok) return null

    return buildCurves([
      {
        id: question.id,
        label: question.expression,
        color: FUNCTION_COLORS[0],
        parsed,
      },
    ])
  }, [question])

  const curve = answer?.curves[0]
  const annotationLines = useMemo(
    () => (curve ? buildQuizAnnotationLines(curve) : []),
    [curve],
  )

  const handleReveal = () => {
    setFlipped(true)
    setHasRevealed(true)
  }

  const handleBack = () => {
    setFlipped(false)
  }

  return (
    <div className={`quiz-card${flipped ? ' is-flipped' : ''}`}>
      <div className="quiz-card-inner">
        <button
          type="button"
          className="quiz-card-face quiz-card-front"
          onClick={handleReveal}
          aria-label={`第 ${question.number} 题，点击查看答案`}
        >
          <span className="quiz-card-badge">第 {question.number} 题</span>
          <p className="quiz-card-expression">
            <MathText text={`y = ${question.expression}`} />
          </p>
          <span className="quiz-card-hint">点击翻卡查看答案</span>
        </button>

        <div className="quiz-card-face quiz-card-back">
          <div className="quiz-card-back-header">
            <span className="quiz-card-badge">第 {question.number} 题答案</span>
            <button type="button" className="quiz-card-back-button" onClick={handleBack}>
              返回题目
            </button>
          </div>

          {hasRevealed && answer && (
            <div className="quiz-card-back-body">
              {annotationLines.length > 0 && (
                <ul className="quiz-card-annotations">
                  {annotationLines.map((line) => (
                    <li key={line}>
                      <MathText text={line} />
                    </li>
                  ))}
                </ul>
              )}

              <div className="quiz-card-graph">
                <GraphCanvas
                  curves={answer.curves}
                  viewport={answer.viewport}
                  maxSize={QUIZ_GRAPH_SIZE}
                  compact
                  showAxisLabels={false}
                  showSymmetryAxisLabel={false}
                  showKeyPointLabels={false}
                  showLegend={false}
                />
              </div>
            </div>
          )}

          {!answer && <p className="quiz-card-error">题目解析失败</p>}
        </div>
      </div>
    </div>
  )
}
