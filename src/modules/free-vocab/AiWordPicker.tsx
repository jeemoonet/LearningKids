import { useCallback, useEffect, useMemo, useState } from 'react'
import { confirmBatch, selectWordsForPattern } from './api'
import type { SelectedWordCandidate, SentencePattern } from './types'
import { PATTERN_LABEL } from './types'

interface AiWordPickerProps {
  pattern: SentencePattern
  onBack: () => void
  onConfirmed: () => void
}

export function AiWordPicker({ pattern, onBack, onConfirmed }: AiWordPickerProps) {
  const [candidates, setCandidates] = useState<SelectedWordCandidate[]>([])
  const [source, setSource] = useState<'ai' | 'fallback'>('fallback')
  const [poolSize, setPoolSize] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')

  const loadCandidates = useCallback(
    async (excludeWords: string[] = []) => {
      setError('')
      const data = await selectWordsForPattern(pattern, {
        excludeWords,
        count: 10,
      })
      if (excludeWords.length > 0) {
        setCandidates((prev) => {
          const seen = new Set(prev.map((item) => item.word))
          const merged = [...prev]
          for (const item of data.candidates) {
            if (seen.has(item.word) || merged.length >= 10) continue
            merged.push(item)
            seen.add(item.word)
          }
          return merged
        })
      } else {
        setCandidates(data.candidates)
      }
      setSource(data.source)
      setPoolSize(data.learningPoolSize)
    },
    [pattern],
  )

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        await loadCandidates()
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : '选词失败')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [loadCandidates])

  const removeWord = (word: string) => {
    setCandidates((prev) => prev.filter((item) => item.word !== word))
  }

  const handleAddMore = async () => {
    if (candidates.length >= 10) return
    setAdding(true)
    setError('')
    try {
      await loadCandidates(candidates.map((item) => item.word))
    } catch (err) {
      setError(err instanceof Error ? err.message : '补充选词失败')
    } finally {
      setAdding(false)
    }
  }

  const handleConfirm = async () => {
    if (candidates.length < 5) {
      setError('每批至少需要 5 个单词')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      await confirmBatch(
        pattern,
        candidates.map((item) => ({ word: item.word, role: item.role })),
      )
      onConfirmed()
    } catch (err) {
      setError(err instanceof Error ? err.message : '确认失败')
    } finally {
      setSubmitting(false)
    }
  }

  const roleSummary = useMemo(() => {
    const counts = new Map<string, number>()
    for (const item of candidates) {
      counts.set(item.roleLabel, (counts.get(item.roleLabel) ?? 0) + 1)
    }
    return [...counts.entries()].map(([label, count]) => `${label}×${count}`).join('，')
  }, [candidates])

  if (loading) {
    return <p className="fv-status">AI 正在按句型选词…</p>
  }

  return (
    <section className="fv-word-picker">
      <div className="fv-word-picker-header">
        <button type="button" className="vocab-init-secondary-button" onClick={onBack}>
          换句型
        </button>
        <div>
          <h2>{PATTERN_LABEL[pattern]}</h2>
          <p className="fv-word-picker-meta">
            来源：{source === 'ai' ? 'AI 推荐' : '规则选词'} · 学习词库剩余 {poolSize} 个
          </p>
        </div>
      </div>

      {error && <p className="fv-status fv-status-error">{error}</p>}

      <p className="fv-init-tip">
        不满意可点击单词移除，或「再选几个」补充；确认后将开始本批学习（M4：闪卡/造句/完形）。
      </p>

      <div className="vocab-init-stats">
        <span>
          已选 <strong>{candidates.length}</strong> / 5-10
        </span>
        <span>{roleSummary || '暂无成分覆盖'}</span>
      </div>

      <div className="vocab-init-list">
        {candidates.map((item, index) => (
          <div key={item.word} className="vocab-init-item fv-init-word-card">
            <div className="vocab-init-item-main">
              <span className="vocab-init-item-index">{index + 1}</span>
              <div className="vocab-init-item-text">
                <div className="vocab-init-item-word-row">
                  <strong className="vocab-init-item-word">{item.word}</strong>
                  {item.phonetic && <span className="fv-init-phonetic">{item.phonetic}</span>}
                  <span className="vocab-init-item-badge">{item.roleLabel}</span>
                  <span className="vocab-init-item-badge">{item.posLabel}</span>
                </div>
                <span className="vocab-init-item-meaning">{item.meaningZh}</span>
                <span className="fv-word-reason">{item.reason}</span>
              </div>
              <button
                type="button"
                className="vocab-init-secondary-button fv-remove-button"
                onClick={() => removeWord(item.word)}
              >
                移除
              </button>
            </div>
          </div>
        ))}
      </div>

      {candidates.length === 0 && <p className="fv-status">暂无候选词，请换句型或稍后再试。</p>}

      <div className="vocab-init-footer">
        <button
          type="button"
          className="vocab-init-secondary-button"
          disabled={adding || candidates.length >= 10}
          onClick={() => void handleAddMore()}
        >
          {adding ? '补充中…' : '再选几个'}
        </button>
        <button
          type="button"
          className="vocab-init-primary-button"
          disabled={submitting || candidates.length < 5}
          onClick={() => void handleConfirm()}
        >
          {submitting ? '确认中…' : '确认本批单词'}
        </button>
      </div>
    </section>
  )
}
