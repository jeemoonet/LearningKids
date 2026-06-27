import type { FreeVocabProgress } from './types'
import { PATTERN_LABEL } from './types'

interface ProgressPanelProps {
  progress: FreeVocabProgress
}

export function ProgressPanel({ progress }: ProgressPanelProps) {
  const percent = progress.tierWordCount
    ? Math.round((progress.knownCount / progress.tierWordCount) * 100)
    : 0

  return (
    <section className="fv-progress-panel">
      <div className="fv-progress-score">
        <span className="fv-progress-score-value">{progress.score}</span>
        <span className="fv-progress-score-label">学习分数</span>
      </div>

      <div className="fv-progress-meta">
        <div>
          已掌握 <strong>{progress.knownCount}</strong> / {progress.tierWordCount}
        </div>
        <div>学习中 {progress.learningCount} 个</div>
      </div>

      <div className="fv-progress-bar" aria-hidden="true">
        <div className="fv-progress-bar-fill" style={{ width: `${percent}%` }} />
      </div>

      {progress.activeBatch && (
        <div className="fv-active-batch">
          <strong>当前批次：</strong>
          {PATTERN_LABEL[progress.activeBatch.pattern] ?? progress.activeBatch.pattern}，
          {progress.activeBatch.words.length} 个词，完形连对 {progress.activeBatch.clozeStreak}/3
        </div>
      )}
    </section>
  )
}
