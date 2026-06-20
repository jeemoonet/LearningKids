import { useState } from 'react'
import { QUIZ_QUESTION_COUNT } from '../constants'
import { generateQuizQuestions } from '../lib/quizGenerator'
import { QuizCard } from './QuizCard'

export function QuizMode() {
  const [quizSetId, setQuizSetId] = useState(0)
  const [questions, setQuestions] = useState(() => generateQuizQuestions())

  const handleRegenerate = () => {
    setQuestions(generateQuizQuestions())
    setQuizSetId((current) => current + 1)
  }

  return (
    <section className="quiz-mode">
      <div className="quiz-toolbar">
        <div>
          <h2>抛物线专项练习</h2>
          <p>共 {QUIZ_QUESTION_COUNT} 道题，点击卡片翻面查看图像、对称轴与关键点坐标</p>
        </div>
        <button type="button" className="quiz-regenerate-button" onClick={handleRegenerate}>
          重新出题
        </button>
      </div>

      <div className="quiz-grid">
        {questions.map((question) => (
          <QuizCard key={`${quizSetId}-${question.id}`} question={question} />
        ))}
      </div>
    </section>
  )
}
