function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

interface VocabQuizResultProps {
  total: number
  sessionErrors: number
  sessionElapsedSec: number
  mastered: number
  groupCompleted: boolean
  nextGroupTitle: string | null
  onRetry: () => void
  onContinueFlashcard: () => void
  onOpenNextGroup: () => void
  onBackToGroups: () => void
}

export function VocabQuizResult({
  total,
  sessionErrors,
  sessionElapsedSec,
  mastered,
  groupCompleted,
  nextGroupTitle,
  onRetry,
  onContinueFlashcard,
  onOpenNextGroup,
  onBackToGroups,
}: VocabQuizResultProps) {
  const correctCount = total - sessionErrors
  const masteryTarget = Math.ceil(total * 0.8)
  const remaining = Math.max(0, masteryTarget - mastered)

  return (
    <div className="vocab-quiz-result">
      <p className="vocab-quiz-result-label">
        {groupCompleted ? '本组已通关' : '测试完成'}
      </p>
      <p className="vocab-quiz-result-score" aria-live="polite">
        <span className="vocab-quiz-result-score-value">{correctCount}</span>
        <span className="vocab-quiz-result-score-total">/ {total}</span>
      </p>
      <p className="vocab-quiz-result-meta">
        本次错误 {sessionErrors} 次 · 用时 {formatElapsed(sessionElapsedSec)}
      </p>
      <p className="vocab-quiz-result-meta">
        熟记 {mastered}/{total}（目标 {masteryTarget} 个，熟悉度 ≥ 4）
      </p>

      {groupCompleted ? (
        <p className="vocab-quiz-result-hint vocab-quiz-result-hint--success">
          已达到 80% 熟记目标，可以进入下一组学习。
        </p>
      ) : (
        <p className="vocab-quiz-result-hint">
          本轮测试全对不等于本组通关。还需 {remaining} 个单词达到熟悉度 4 以上，才能解锁下一组。
          建议继续闪卡复习或再测几轮。
        </p>
      )}

      <div className="vocab-quiz-result-actions">
        {groupCompleted && nextGroupTitle ? (
          <button type="button" className="vocab-quiz-result-primary" onClick={onOpenNextGroup}>
            进入下一组：{nextGroupTitle}
          </button>
        ) : groupCompleted ? (
          <button type="button" className="vocab-quiz-result-primary" onClick={onBackToGroups}>
            返回小组列表
          </button>
        ) : (
          <button type="button" className="vocab-quiz-result-primary" onClick={onContinueFlashcard}>
            继续闪卡复习
          </button>
        )}
        {!groupCompleted && (
          <button type="button" className="vocab-quiz-result-secondary" onClick={onRetry}>
            再测一轮
          </button>
        )}
        {!groupCompleted && (
          <button type="button" className="vocab-quiz-result-secondary" onClick={onBackToGroups}>
            返回小组列表
          </button>
        )}
      </div>
    </div>
  )
}
