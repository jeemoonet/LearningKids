import { useState } from 'react'
import { ModuleHeader } from '../../components/ModuleHeader'
import {
  SIGN_ADVANCED_TEST_QUESTION_SECONDS,
  SIGN_ADVANCED_TEST_ROUND_COUNT,
  SIGN_TEST_QUESTION_SECONDS,
  SIGN_TEST_ROUND_COUNT,
  SIGN_TRAINING_QUESTION_COUNT,
} from '../../constants'
import { generateAdvancedSignChoiceQuestions } from './advancedSignGenerator'
import { SignCard } from './SignCard'
import { generateSignQuestions } from './signGenerator'
import { generateSignChoiceQuestions } from './signChoiceGenerator'
import { SignTestMode } from './SignTestMode'

interface SignTrainingModuleProps {
  onBack: () => void
}

type SignTrainingTab = 'practice' | 'test' | 'advanced'

export function SignTrainingModule({ onBack }: SignTrainingModuleProps) {
  const [tab, setTab] = useState<SignTrainingTab>('practice')
  const [sessionId, setSessionId] = useState(0)
  const [questions, setQuestions] = useState(() => generateSignQuestions())

  const handleRegenerate = () => {
    setQuestions(generateSignQuestions())
    setSessionId((current) => current + 1)
  }

  return (
    <div className="module module-sign-training">
      <ModuleHeader
        title="正负训练营"
        description="闪卡练习、闯关测试与高级测评，掌握正负号变换"
        onBack={onBack}
      />

      <div className="sign-training-tabs-wrap">
        <div className="mode-tabs sign-training-tabs" role="tablist" aria-label="正负训练营模式">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'practice'}
            className={`mode-tab sign-training-tab${tab === 'practice' ? ' is-active' : ''}`}
            onClick={() => setTab('practice')}
          >
            闪卡练习
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'test'}
            className={`mode-tab sign-training-tab${tab === 'test' ? ' is-active' : ''}`}
            onClick={() => setTab('test')}
          >
            闯关测试
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'advanced'}
            className={`mode-tab sign-training-tab${tab === 'advanced' ? ' is-active' : ''}`}
            onClick={() => setTab('advanced')}
          >
            高级测评
          </button>
        </div>
      </div>

      <main className="app-main app-main-quiz">
        {tab === 'practice' && (
          <section className="quiz-mode">
            <div className="quiz-toolbar">
              <div>
                <h2>正负号变换练习</h2>
                <p>共 {SIGN_TRAINING_QUESTION_COUNT} 道题，点击卡片翻面查看化简步骤与答案</p>
              </div>
              <button type="button" className="quiz-regenerate-button" onClick={handleRegenerate}>
                重新出题
              </button>
            </div>

            <div className="quiz-grid">
              {questions.map((question) => (
                <SignCard key={`${sessionId}-${question.id}`} question={question} />
              ))}
            </div>
          </section>
        )}

        {tab === 'test' && (
          <SignTestMode
            title="闯关测试"
            roundCount={SIGN_TEST_ROUND_COUNT}
            questionSeconds={SIGN_TEST_QUESTION_SECONDS}
            generateQuestions={generateSignChoiceQuestions}
            rules={[
              '每次一题，从 A / B / C 中选择化简结果',
              `共 ${SIGN_TEST_ROUND_COUNT} 题，每题 ${SIGN_TEST_QUESTION_SECONDS} 秒`,
              '三个选项仅在正负号上不同',
            ]}
          />
        )}

        {tab === 'advanced' && (
          <SignTestMode
            title="高级测评"
            roundCount={SIGN_ADVANCED_TEST_ROUND_COUNT}
            questionSeconds={SIGN_ADVANCED_TEST_QUESTION_SECONDS}
            generateQuestions={generateAdvancedSignChoiceQuestions}
            sectionClassName="sign-test-advanced"
            promptClassName="sign-test-prompt-long"
            rules={[
              '两个式子相加或相减，先去括号再合并',
              `共 ${SIGN_ADVANCED_TEST_ROUND_COUNT} 题，每题 ${SIGN_ADVANCED_TEST_QUESTION_SECONDS} 秒`,
              '三个选项仅在正负号上不同',
            ]}
          />
        )}
      </main>
    </div>
  )
}
