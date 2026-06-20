import { useEffect, useMemo, useState } from 'react'
import { ModuleHeader } from '../../components/ModuleHeader'
import { fetchWordsByTier } from './db'
import { upsertProgress } from './progressApi'
import {
  applySelfMark,
  buildStudyChunks,
  FLASHCARD_MARK_OPTIONS,
  FULLY_MASTERED_LEVEL,
  isFullyMastered,
  isInitMarked,
  markFullyMastered,
  ensureProgress,
} from './scheduler'
import type { VocabProgress, VocabTier, VocabWord } from './types'
import { getWordDisplay } from './wordFrequency'
import { WordFrequencyTag } from './WordFrequencyTag'

type InitStep = 'mark' | 'groups'

interface VocabTierInitPageProps {
  tier: VocabTier
  progressMap: Map<string, VocabProgress>
  onBack: () => void
  onProgressChange: (progress: VocabProgress) => void
  onStudyChunk: (words: VocabWord[], title: string) => void
  onFinishInit: (chunks: VocabWord[][]) => Promise<void>
}

export function VocabTierInitPage({
  tier,
  progressMap,
  onBack,
  onProgressChange,
  onStudyChunk,
  onFinishInit,
}: VocabTierInitPageProps) {
  const [words, setWords] = useState<VocabWord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [step, setStep] = useState<InitStep>('mark')
  const [hideMastered, setHideMastered] = useState(true)
  const [hideMeaning, setHideMeaning] = useState(true)
  const [showUnmarkedOnly, setShowUnmarkedOnly] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchWordsByTier(tier.id)
      .then(setWords)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [tier.id])

  const stats = useMemo(() => {
    let marked = 0
    let mastered = 0
    let unfamiliar = 0
    for (const word of words) {
      const progress = progressMap.get(word.word)
      if (isInitMarked(progress)) marked += 1
      if (isFullyMastered(progress)) mastered += 1
      if ((progress?.familiarity ?? 1) === 1 && !isFullyMastered(progress)) unfamiliar += 1
    }
    return { total: words.length, marked, mastered, unfamiliar, pending: words.length - marked }
  }, [words, progressMap])

  const visibleWords = useMemo(() => {
    return words.filter((word) => {
      const progress = progressMap.get(word.word)
      if (hideMastered && isFullyMastered(progress)) return false
      if (showUnmarkedOnly && isInitMarked(progress)) return false
      return true
    })
  }, [words, progressMap, hideMastered, showUnmarkedOnly])

  const studyChunks = useMemo(
    () => buildStudyChunks(words, progressMap),
    [words, progressMap],
  )

  const handleMark = (word: VocabWord, level: number) => {
    const progress = ensureProgress(new Map(progressMap), word.word)
    const updated =
      level >= FULLY_MASTERED_LEVEL
        ? markFullyMastered(progress, 0)
        : applySelfMark(progress, level, 0)
    onProgressChange(updated)
    void upsertProgress(updated).catch((err: Error) => {
      setError(err.message || '保存标记失败，请检查登录状态')
    })
  }

  const handleFinishInit = async () => {
    setSaving(true)
    setError('')
    try {
      await onFinishInit(studyChunks)
      onBack()
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存分组失败')
    } finally {
      setSaving(false)
    }
  }

  const allMarked = stats.pending === 0

  if (loading) {
    return (
      <div className="module module-vocab-training">
        <ModuleHeader title={`${tier.label} · 快速初始化`} description="加载单词..." onBack={onBack} />
        <main className="app-main app-main-vocab-init">
          <p className="vocab-status">正在加载 {tier.label} 单词...</p>
        </main>
      </div>
    )
  }

  if (step === 'groups') {
    return (
      <div className="module module-vocab-training">
        <ModuleHeader
          title={`${tier.label} · 待学分组`}
          description={`已过滤 ${stats.mastered} 个非常熟悉单词，待学 ${words.length - stats.mastered} 个；每组 20 词（名词 8 · 动词 6 · 其他 6）`}
          onBack={() => setStep('mark')}
        />

        <main className="app-main app-main-vocab-init">
          {error && <p className="vocab-inline-error">{error}</p>}

          {studyChunks.length === 0 ? (
            <p className="vocab-status">所有单词均已标记为非常熟悉，无需分组背诵。</p>
          ) : (
            <div className="vocab-group-grid">
              {studyChunks.map((chunk, index) => {
                const unfamiliarCount = chunk.filter(
                  (word) => (progressMap.get(word.word)?.familiarity ?? 1) === 1,
                ).length
                const nounCount = chunk.filter((word) => word.pos === 'noun').length
                const verbCount = chunk.filter((word) => word.pos === 'verb').length
                const otherCount = chunk.length - nounCount - verbCount
                return (
                  <button
                    key={index}
                    type="button"
                    className="vocab-group-card"
                    onClick={() => onStudyChunk(chunk, `${tier.label} · 待学第 ${index + 1} 组`)}
                  >
                    <span className="vocab-group-index">待学第 {index + 1} 组</span>
                    <strong>{chunk.length} 个单词</strong>
                    <span>
                      名词 {nounCount} · 动词 {verbCount} · 其他 {otherCount}
                    </span>
                    <span>
                      不熟悉 {unfamiliarCount} · 一般/熟悉 {chunk.length - unfamiliarCount}
                    </span>
                    <span className="vocab-init-chunk-preview">
                      {chunk
                        .slice(0, 4)
                        .map((w) => w.word)
                        .join('、')}
                      {chunk.length > 4 ? '…' : ''}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          <div className="vocab-init-footer">
            <button
              type="button"
              className="vocab-init-primary-button"
              disabled={saving}
              onClick={() => void handleFinishInit()}
            >
              {saving ? '正在保存分组…' : '完成初始化并保存分组'}
            </button>
            <button type="button" className="vocab-init-secondary-button" onClick={() => setStep('mark')}>
              返回继续标记
            </button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="module module-vocab-training">
      <ModuleHeader
        title={`${tier.label} · 快速初始化`}
        description="标记每个单词的熟悉度，非常熟悉的将自动过滤"
        onBack={onBack}
      />

      <main className="app-main app-main-vocab-init">
        <div className="vocab-init-stats">
          <span>共 {stats.total} 词</span>
          <span>已标记 {stats.marked}</span>
          <span>非常熟悉 {stats.mastered}</span>
          <span>不熟悉 {stats.unfamiliar}</span>
          <span>待标记 {stats.pending}</span>
        </div>

        <div className="vocab-init-toolbar">
          <label className="vocab-init-filter">
            <input type="checkbox" checked={hideMastered} onChange={(e) => setHideMastered(e.target.checked)} />
            隐藏非常熟悉
          </label>
          <label className="vocab-init-filter">
            <input type="checkbox" checked={hideMeaning} onChange={(e) => setHideMeaning(e.target.checked)} />
            隐藏中文含义
          </label>
          <label className="vocab-init-filter">
            <input
              type="checkbox"
              checked={showUnmarkedOnly}
              onChange={(e) => setShowUnmarkedOnly(e.target.checked)}
            />
            仅看待标记
          </label>
          <button
            type="button"
            className="vocab-init-primary-button"
            disabled={!allMarked && stats.marked === 0}
            onClick={() => setStep('groups')}
          >
            {allMarked ? '查看待学分组' : '预览待学分组'}
          </button>
        </div>

        {error && <p className="vocab-inline-error">{error}</p>}

        <div className="vocab-init-list">
          {visibleWords.map((word, index) => {
            const progress = progressMap.get(word.word)
            const familiarity = progress?.familiarity ?? 1
            const mastered = isFullyMastered(progress)
            const marked = isInitMarked(progress)
            const display = getWordDisplay(word.word, word)

            return (
              <div
                key={word.id}
                className={`vocab-init-item${mastered ? ' is-mastered' : ''}${marked ? ' is-marked' : ''}`}
              >
                <div className="vocab-init-item-main">
                  <span className="vocab-init-item-index">{index + 1}</span>
                  <div className="vocab-init-item-text">
                    <div className="vocab-init-item-word-row">
                      <strong className="vocab-init-item-word">{display.baseWord}</strong>
                      {display.frequency && <WordFrequencyTag frequency={display.frequency} />}
                    </div>
                    {!hideMeaning && (
                      <span className="vocab-init-item-meaning">{word.meaningZh}</span>
                    )}
                  </div>
                  {marked && !mastered && (
                    <span className="vocab-init-item-badge">
                      {FLASHCARD_MARK_OPTIONS.find((o) => o.level === familiarity)?.label ??
                        `熟悉度 ${familiarity}`}
                    </span>
                  )}
                  {mastered && <span className="vocab-init-item-badge is-mastered">非常熟悉</span>}
                </div>

                <div className="vocab-init-mark-actions" role="group" aria-label={`标记 ${word.word}`}>
                  {FLASHCARD_MARK_OPTIONS.map((option) => (
                    <button
                      key={option.level}
                      type="button"
                      className={`vocab-init-mark-button level-${option.level}${progress?.selfMarked === option.level ? ' is-selected' : ''}`}
                      onClick={() => handleMark(word, option.level)}
                    >
                      {option.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    className={`vocab-init-mark-button level-5${mastered ? ' is-selected' : ''}`}
                    onClick={() => handleMark(word, FULLY_MASTERED_LEVEL)}
                  >
                    非常熟悉
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {visibleWords.length === 0 && (
          <p className="vocab-status">
            {stats.pending > 0 ? '当前筛选下没有单词，请调整筛选条件。' : '全部单词已标记完成。'}
          </p>
        )}

        <div className="vocab-init-footer">
          <button
            type="button"
            className="vocab-init-primary-button"
            onClick={() => setStep('groups')}
          >
            {allMarked ? '完成标记，查看分组' : `继续标记（还剩 ${stats.pending} 个）`}
          </button>
        </div>
      </main>
    </div>
  )
}
