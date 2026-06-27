import type { PrepLevel } from './types'
import { getLevelComparison, getSpiritProfile } from './prepSpiritCatalog'

interface PrepSpiritSeriesLayoutProps {
  level: PrepLevel
  onStart: () => void
  starting?: boolean
}

export function PrepSpiritSeriesLayout({ level, onStart, starting = false }: PrepSpiritSeriesLayoutProps) {
  const spirits = level.prepWords.map((word) => getSpiritProfile(word, level.id))
  const comparison = getLevelComparison(level.id, level.prepWords)

  return (
    <div className="prep-spirit-series">
      <section className="prep-spirit-block prep-spirit-block--cards">
        <header className="prep-spirit-block-head">
          <h3 className="prep-spirit-block-title">精灵介绍</h3>
          <p className="prep-spirit-block-sub">横滑查看本关每位精灵的能力与例句</p>
        </header>
        <div className="prep-spirit-cards-row" role="list">
          {spirits.map((spirit) => (
            <article key={spirit.word} className="prep-spirit-card" role="listitem">
              <div className="prep-spirit-card-head">
                <span className="prep-spirit-card-word">{spirit.word}</span>
                <span
                  className={`prep-spirit-card-tag${
                    spirit.ally ? ` prep-spirit-card-tag--${spirit.ally}` : ''
                  }`}
                >
                  {spirit.ally === 'warrior'
                    ? '🛡️ 武士'
                    : spirit.ally === 'commoner'
                      ? '🧢 平民'
                      : '精灵'}
                </span>
              </div>
              <p className="prep-spirit-card-ability">{spirit.ability}</p>
              <div className="prep-spirit-card-example">
                <p className="prep-spirit-card-example-en">{spirit.exampleEn}</p>
                <p className="prep-spirit-card-example-zh">{spirit.exampleZh}</p>
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
                <th scope="col">精灵</th>
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
          {starting ? '正在出题…' : '开始测试'}
        </button>
        <p className="prep-spirit-actions-hint">每次练习自动随机出题，全对才算通关</p>
      </footer>
    </div>
  )
}
