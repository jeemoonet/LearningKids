import { useEffect } from 'react'
import { useSessionStore } from '../sessionStore'

interface ResultViewProps {
  win: boolean
  onBack: () => void
  onRetry: () => void
}

export function ResultView({ win, onBack, onRetry }: ResultViewProps) {
  const level = useSessionStore((s) => s.getLevel())
  const getWord = useSessionStore((s) => s.getWord)
  const resetBattle = useSessionStore((s) => s.resetBattle)

  useEffect(() => {
    return () => resetBattle()
  }, [resetBattle])

  if (!level) return null

  return (
    <div className="wh-page">
      <h1 className="wh-title">{win ? '胜利！' : '战斗失败'}</h1>
      <p className="wh-subtitle">
        {win
          ? `${level.monsterName} 已被击败，本节单词熟悉度 +1`
          : '别灰心，复习闪卡后再来挑战'}
      </p>

      {win && (
        <div className="wh-panel wh-prefill-list">
          <h3>本节战斗单词</h3>
          {level.themeWordIds.map((id) => {
            const w = getWord(id)
            return w ? (
              <div key={id} className="wh-prefill-item">
                <span>
                  {w.word} — {w.meaning}
                </span>
              </div>
            ) : null
          })}
        </div>
      )}

      <div className="wh-result-actions">
        <button type="button" className="wh-btn-primary" onClick={onBack}>
          返回小节
        </button>
        {!win && (
          <button type="button" className="wh-btn-secondary" onClick={onRetry}>
            再战
          </button>
        )}
      </div>
    </div>
  )
}
