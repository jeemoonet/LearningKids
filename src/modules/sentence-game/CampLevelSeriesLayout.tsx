import type { SentenceLevel } from './types'
import type { WarriorTenseComparison, WarriorTenseProfile } from './warriorTenseCatalog'

interface CampLevelSeriesLayoutProps {
  level: SentenceLevel
  profiles: WarriorTenseProfile[]
  comparison: WarriorTenseComparison
  cardsTitle: string
  cardsSub: string
  cardTag: string
  cardTagClassName?: string
  compareCol1: string
  startLabel?: string
  hint?: string
  onStart: () => void
  starting?: boolean
}

export function CampLevelSeriesLayout({
  level,
  profiles,
  comparison,
  cardsTitle,
  cardsSub,
  cardTag,
  cardTagClassName = '',
  compareCol1,
  startLabel = '开始测试',
  hint = '每次练习自动随机出题，全对才算通关',
  onStart,
  starting = false,
}: CampLevelSeriesLayoutProps) {
  return (
    <div className="prep-spirit-series">
      <section className="prep-spirit-block prep-spirit-block--cards">
        <header className="prep-spirit-block-head">
          <h3 className="prep-spirit-block-title">{cardsTitle}</h3>
          <p className="prep-spirit-block-sub">{cardsSub}</p>
        </header>
        <div className="prep-spirit-cards-row" role="list">
          {profiles.map((profile) => (
            <article key={profile.word} className="prep-spirit-card" role="listitem">
              <div className="prep-spirit-card-head">
                <span className="prep-spirit-card-word">{profile.word}</span>
                <span className={`prep-spirit-card-tag${cardTagClassName ? ` ${cardTagClassName}` : ''}`}>
                  {cardTag}
                </span>
              </div>
              <p className="prep-spirit-card-ability">{profile.ability}</p>
              <div className="prep-spirit-card-example">
                <p className="prep-spirit-card-example-en">{profile.exampleEn}</p>
                <p className="prep-spirit-card-example-zh">{profile.exampleZh}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="prep-spirit-block prep-spirit-block--compare">
        <header className="prep-spirit-block-head">
          <h3 className="prep-spirit-block-title">差异对比</h3>
          <p className="prep-spirit-block-sub">{comparison.title}</p>
        </header>
        <div className="prep-spirit-compare-table-wrap">
          <table className="prep-spirit-compare-table">
            <thead>
              <tr>
                <th scope="col">{compareCol1}</th>
                <th scope="col">核心差异</th>
                <th scope="col">典型用法</th>
              </tr>
            </thead>
            <tbody>
              {comparison.rows.map((row) => (
                <tr key={row.spirits.join('-')}>
                  <td>
                    <span className="prep-spirit-compare-words">{row.spirits.join(' · ')}</span>
                  </td>
                  <td>{row.focus}</td>
                  <td>
                    <code>{row.example}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="prep-spirit-compare-tip">{comparison.tip}</p>
      </section>

      <footer className="prep-spirit-actions">
        <button
          type="button"
          className="prep-spirit-start-button"
          onClick={onStart}
          disabled={starting || level.questionCount === 0}
        >
          {starting ? '正在出题…' : startLabel}
        </button>
        <p className="prep-spirit-actions-hint">{hint}</p>
      </footer>
    </div>
  )
}
