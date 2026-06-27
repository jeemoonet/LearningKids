import { useCallback, useEffect, useState } from 'react'
import { completeWordHunter, fetchWordHunterSession } from './api'
import { useSessionStore } from './sessionStore'
import { BattleView } from './views/BattleView'
import { PreloadView } from './views/PreloadView'
import { ResultView } from './views/ResultView'
import './styles/battle.css'
import './styles/word-hunter.css'

type WhView = 'loading' | 'preload' | 'battle' | 'result'
type WhResult = 'win' | 'lose'

interface WordHunterModuleProps {
  sectionId: string
  onBack: () => void
}

export function WordHunterModule({ sectionId, onBack }: WordHunterModuleProps) {
  const [view, setView] = useState<WhView>('loading')
  const [result, setResult] = useState<WhResult>('win')
  const [error, setError] = useState('')
  const loadSession = useSessionStore((s) => s.loadSession)
  const startBattle = useSessionStore((s) => s.startBattle)
  const clear = useSessionStore((s) => s.clear)

  const init = useCallback(async () => {
    setError('')
    setView('loading')
    try {
      const { session } = await fetchWordHunterSession(sectionId)
      loadSession(session)
      setView('preload')
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败')
    }
  }, [sectionId, loadSession])

  useEffect(() => {
    void init()
    return () => clear()
  }, [init, clear])

  const handleStart = () => {
    startBattle()
    setView('battle')
  }

  const handleVictory = useCallback(async () => {
    setResult('win')
    setView('result')
    try {
      await completeWordHunter(sectionId)
    } catch {
      /* 进度同步失败不阻断结果页 */
    }
  }, [sectionId])

  const handleDefeat = useCallback(() => {
    setResult('lose')
    setView('result')
  }, [])

  const handleRetry = () => {
    useSessionStore.getState().resetBattle()
    useSessionStore.getState().prepareBattle()
    setView('preload')
  }

  return (
    <div className="module module-word-hunter">
      <header className="wh-header">
        <button type="button" className="wh-back" onClick={onBack}>
          ← 返回
        </button>
        <span className="wh-header-title">Word Hunter · 本节单词战斗</span>
      </header>

      {error && (
        <div className="wh-page">
          <p className="wh-error">{error}</p>
          <button type="button" className="wh-btn-secondary" onClick={() => void init()}>
            重试
          </button>
        </div>
      )}

      {!error && view === 'loading' && <p className="wh-page wh-status">准备战斗数据…</p>}
      {!error && view === 'preload' && <PreloadView onStart={handleStart} />}
      {!error && view === 'battle' && (
        <BattleView onVictory={handleVictory} onDefeat={handleDefeat} />
      )}
      {!error && view === 'result' && (
        <ResultView win={result === 'win'} onBack={onBack} onRetry={handleRetry} />
      )}
    </div>
  )
}
