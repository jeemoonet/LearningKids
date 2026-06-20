import { useState } from 'react'
import { MathText } from '../../components/MathText'
import type { SignQuestion } from './signGenerator'

interface SignCardProps {
  question: SignQuestion
}

export function SignCard({ question }: SignCardProps) {
  const [flipped, setFlipped] = useState(false)
  const [hasRevealed, setHasRevealed] = useState(false)

  const handleReveal = () => {
    setFlipped(true)
    setHasRevealed(true)
  }

  const handleBack = () => {
    setFlipped(false)
  }

  return (
    <div className={`quiz-card sign-card${flipped ? ' is-flipped' : ''}`}>
      <div className="quiz-card-inner">
        <button
          type="button"
          className="quiz-card-face quiz-card-front"
          onClick={handleReveal}
          aria-label={`第 ${question.number} 题，点击查看答案`}
        >
          <span className="quiz-card-badge">第 {question.number} 题</span>
          <p className="quiz-card-expression">
            <MathText text={question.prompt} />
          </p>
          <span className="quiz-card-hint">化简各式 · 点击翻卡查看答案</span>
        </button>

        <div className="quiz-card-face quiz-card-back">
          <div className="quiz-card-back-header">
            <span className="quiz-card-badge">第 {question.number} 题答案</span>
            <button type="button" className="quiz-card-back-button" onClick={handleBack}>
              返回题目
            </button>
          </div>

          {hasRevealed && (
            <div className="sign-card-back-body">
              <div className="sign-card-answer">
                <span className="sign-card-answer-label">化简结果</span>
                <p className="sign-card-answer-expression">
                  <MathText text={question.answer} />
                </p>
              </div>

              <ol className="sign-card-steps">
                {question.steps.map((step) => (
                  <li key={step}>
                    <MathText text={step} />
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
