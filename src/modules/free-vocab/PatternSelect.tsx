import type { PatternInfo, SentencePattern } from './types'

interface PatternSelectProps {
  patterns: PatternInfo[]
  loading?: boolean
  onSelect: (pattern: SentencePattern) => void
}

export function PatternSelect({ patterns, loading, onSelect }: PatternSelectProps) {
  if (loading) {
    return <p className="fv-status">加载句型列表…</p>
  }

  return (
    <section className="fv-pattern-select">
      <h2>选择句型</h2>
      <p className="fv-init-tip">
        根据主谓宾定状补选择目标句型，AI 会从<strong>学习词库</strong>中挑选 5-10
        个生词，尽量覆盖该句型需要的句子成分。
      </p>

      <div className="fv-pattern-grid">
        {patterns.map((pattern) => (
          <button
            key={pattern.id}
            type="button"
            className="fv-pattern-card"
            onClick={() => onSelect(pattern.id)}
          >
            <span className="fv-pattern-order">{pattern.unlockOrder}</span>
            <strong>{pattern.title}</strong>
            <span>{pattern.summary}</span>
            <span className="fv-pattern-slots">
              {pattern.slots.map((slot) => slot.roleLabel).join(' · ')}
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}
