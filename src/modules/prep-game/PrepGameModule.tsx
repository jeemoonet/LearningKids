import { useCallback, useEffect, useState } from 'react'
import { fetchPrepLevels, fetchPrepQuestions } from './api'
import { PrepChallengeMode } from './PrepChallengeMode'
import { PrepLevelSelect } from './PrepLevelSelect'
import { PrepSpiritDetailPage } from './PrepSpiritDetailPage'
import type { PrepLevel, PrepQuestion } from './types'

interface PrepGameModuleProps {
  onBack?: () => void
  embedded?: boolean
  onViewChange?: (view: 'levels' | 'detail' | 'challenge') => void
}

type PrepView = 'levels' | 'detail' | 'challenge'

export function PrepGameModule({ onBack, embedded = false, onViewChange }: PrepGameModuleProps) {
  const [levels, setLevels] = useState<PrepLevel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [view, setView] = useState<PrepView>('levels')
  const [activeLevel, setActiveLevel] = useState<PrepLevel | null>(null)
  const [questions, setQuestions] = useState<PrepQuestion[]>([])
  const [startingTest, setStartingTest] = useState(false)

  const loadLevels = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchPrepLevels()
      setLevels(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载关卡失败')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadQuestions = useCallback(async (level: PrepLevel) => {
    const data = await fetchPrepQuestions(level.id, level.questionCount)
    setQuestions(data.questions)
    return data.questions
  }, [])

  useEffect(() => {
    void loadLevels()
  }, [loadLevels])

  useEffect(() => {
    onViewChange?.(view)
  }, [view, onViewChange])

  const openDetail = (level: PrepLevel) => {
    setActiveLevel(level)
    setQuestions([])
    setView('detail')
  }

  const startTest = async () => {
    if (!activeLevel) return
    setStartingTest(true)
    setError('')
    try {
      const next = await loadQuestions(activeLevel)
      if (next.length === 0) {
        setError('暂无题目，请稍后再试')
        return
      }
      setView('challenge')
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成题目失败')
    } finally {
      setStartingTest(false)
    }
  }

  const handleBackToLevels = () => {
    setView('levels')
    setActiveLevel(null)
    setQuestions([])
    void loadLevels()
  }

  const handleBackToDetail = () => {
    setView('detail')
    setQuestions([])
    void loadLevels()
  }

  const handleRegenerateQuestions = useCallback(async () => {
    if (!activeLevel) return []
    const next = await loadQuestions(activeLevel)
    return next
  }, [activeLevel, loadQuestions])

  return (
    <div className={`module module-prep-game is-prep-pc${view === 'challenge' ? ' is-prep-challenge' : ''}`}>
      {view === 'levels' && (
        <>
          {!embedded && onBack && (
            <header className="prep-pc-header">
              <button type="button" className="module-back-button" onClick={onBack}>
                ← 返回训练营
              </button>
              <div className="prep-pc-header-text">
                <h1>精灵起源</h1>
                <p>召唤时间/位置/更多精灵，自动生成中考风格题目，每次练习句子不同</p>
              </div>
            </header>
          )}

          <main className={`app-main app-main-prep-pc${embedded ? ' app-main-prep-embedded' : ''}`}>
            {loading && <p className="prep-status">正在加载关卡…</p>}
            {error && <p className="prep-status prep-status-error">{error}</p>}
            {!loading && !error && (
              <PrepLevelSelect levels={levels} onSelectLevel={openDetail} />
            )}
          </main>
        </>
      )}

      {view === 'detail' && activeLevel && (
        <main className={`app-main app-main-prep-pc${embedded ? ' app-main-prep-embedded' : ''}`}>
          {error && <p className="prep-status prep-status-error">{error}</p>}
          <PrepSpiritDetailPage
            level={activeLevel}
            starting={startingTest}
            onBack={handleBackToLevels}
            onStartTest={() => void startTest()}
          />
        </main>
      )}

      {view === 'challenge' && activeLevel && questions.length > 0 && (
        <main className="app-main app-main-prep-pc">
          <PrepChallengeMode
            level={activeLevel}
            questions={questions}
            onBack={handleBackToDetail}
            onComplete={handleBackToDetail}
            onRegenerateQuestions={handleRegenerateQuestions}
          />
        </main>
      )}
    </div>
  )
}
