import { InlineEditField } from './InlineEditField'
import type { VocabProgress, VocabWord } from './types'
import { familiarityLabel, isFullyMastered } from './scheduler'

function formatLastExamAt(timestamp: number | null | undefined): string {
  if (timestamp == null || timestamp <= 0) return '尚未测验'
  return new Date(timestamp).toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface VocabWordListProps {
  words: VocabWord[]
  progressMap: Map<string, VocabProgress>
  onSelectWord?: (word: VocabWord) => void
  onMarkFullyMastered?: (word: VocabWord) => void
  onUpdateWord?: (word: VocabWord, patch: { word?: string; meaningZh?: string }) => void
}

export function VocabWordList({
  words,
  progressMap,
  onSelectWord,
  onMarkFullyMastered,
  onUpdateWord,
}: VocabWordListProps) {
  const masteredCount = words.filter((word) => isFullyMastered(progressMap.get(word.word))).length

  return (
    <div className="vocab-word-list">
      <p className="vocab-word-list-hint">
        共 {words.length} 个单词，已掌握 {masteredCount} 个（标记「非常熟悉」后不再出现在闪卡与测验中）。
        点击单词或释义可行内修正。
      </p>
      <div className="vocab-word-list-grid">
        {words.map((word, index) => {
          const progress = progressMap.get(word.word)
          const familiarity = progress?.familiarity ?? 1
          const mastered = isFullyMastered(progress)

          return (
            <div
              key={word.id}
              className={`vocab-word-list-item${mastered ? ' is-mastered' : ''}`}
            >
              <div className="vocab-word-list-body">
                <div className="vocab-word-list-item-top">
                  <span className="vocab-word-list-index">{index + 1}</span>
                  <InlineEditField
                    className="vocab-word-list-word"
                    value={word.word}
                    placeholder="点击编辑单词"
                    disabled={!onUpdateWord}
                    onSave={(next) => onUpdateWord?.(word, { word: next })}
                  />
                  <span className="vocab-word-list-pos">{word.posLabel}</span>
                </div>

                <InlineEditField
                  className="vocab-word-list-meaning"
                  value={word.meaningZh}
                  placeholder="点击编辑释义"
                  multiline
                  disabled={!onUpdateWord}
                  onSave={(next) => onUpdateWord?.(word, { meaningZh: next })}
                />

                {word.phonetic && <p className="vocab-word-list-phonetic">{word.phonetic}</p>}

                <div className="vocab-word-list-familiarity">
                  <div className="vocab-familiarity-bar" aria-hidden="true">
                    {Array.from({ length: 5 }, (_, level) => (
                      <span
                        key={level}
                        className={`vocab-familiarity-segment${level < familiarity ? ' is-active' : ''}`}
                      />
                    ))}
                  </div>
                  <span>{familiarityLabel(familiarity)}</span>
                </div>

                <p className="vocab-word-list-exam-stats">
                  测验 {progress?.examCount ?? 0} 次 · 错误 {progress?.examErrorCount ?? 0} 次 ·
                  最近 {formatLastExamAt(progress?.lastExamAt)}
                </p>

                {!mastered && onSelectWord && (
                  <button
                    type="button"
                    className="vocab-word-list-study-button"
                    onClick={() => onSelectWord(word)}
                  >
                    去背诵
                  </button>
                )}
              </div>

              {mastered ? (
                <span className="vocab-word-list-mastered-tag">已掌握</span>
              ) : (
                <button
                  type="button"
                  className="vocab-word-list-master-button"
                  onClick={() => onMarkFullyMastered?.(word)}
                >
                  非常熟悉
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
