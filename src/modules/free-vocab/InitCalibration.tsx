import { useCallback, useEffect, useMemo, useState } from 'react'
import { drawInitWords, fetchInitStatus, keepInitWords } from './api'
import type { FreeVocabInitStatus, FreeVocabInitWord } from './types'
import { POS_SECTION_LABEL } from './types'

interface InitCalibrationProps {
  tierId?: string
  onComplete: (status: FreeVocabInitStatus) => void
}

const POS_ORDER = ['noun', 'verb', 'adj'] as const

export function InitCalibration({ tierId = 'beginner', onComplete }: InitCalibrationProps) {
  const [status, setStatus] = useState<FreeVocabInitStatus | null>(null)
  const [roundWords, setRoundWords] = useState<FreeVocabInitWord[]>([])
  const [unknownWords, setUnknownWords] = useState<Set<string>>(() => new Set())
  const [loading, setLoading] = useState(true)
  const [drawing, setDrawing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const loadStatus = useCallback(async () => {
    const next = await fetchInitStatus(tierId)
    setStatus(next)
    if (next.initialized) onComplete(next)
    return next
  }, [tierId, onComplete])

  const startRound = useCallback(async () => {
    setDrawing(true)
    setError('')
    try {
      const data = await drawInitWords(tierId)
      setStatus(data.status)
      setRoundWords(data.words)
      setUnknownWords(new Set())
    } catch (err) {
      setError(err instanceof Error ? err.message : '抽词失败')
    } finally {
      setDrawing(false)
    }
  }, [tierId])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const next = await loadStatus()
        if (cancelled || next.initialized) return
        await startRound()
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : '加载失败')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [loadStatus, startRound])

  const groupedWords = useMemo(() => {
    const groups: Record<string, FreeVocabInitWord[]> = {}
    for (const word of roundWords) {
      if (!groups[word.pos]) groups[word.pos] = []
      groups[word.pos].push(word)
    }
    return groups
  }, [roundWords])

  const keptWords = useMemo(
    () => roundWords.filter((item) => !unknownWords.has(item.word)).map((item) => item.word),
    [roundWords, unknownWords],
  )

  const progressPercent = status
    ? Math.round((status.knownCount / status.targetCount) * 100)
    : 0

  const toggleUnknown = (word: string) => {
    setUnknownWords((prev) => {
      const next = new Set(prev)
      if (next.has(word)) next.delete(word)
      else next.add(word)
      return next
    })
  }

  const handleKeep = async () => {
    if (keptWords.length === 0) {
      setError('请至少保留一个认识的单词')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      const result = await keepInitWords(keptWords, tierId)
      setStatus(result.status)
      if (result.status.initialized) {
        onComplete(result.status)
        return
      }
      await startRound()
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <p className="fv-status">正在准备初始化词库…</p>
  }

  if (!status) {
    return <p className="fv-status fv-status-error">{error || '无法加载初始化状态'}</p>
  }

  return (
    <div className="fv-init-layout">
      <aside className="fv-init-sidebar">
        <div className="fv-init-sidebar-card">
          <p className="fv-init-sidebar-kicker">步骤 1 / 2</p>
          <h2 className="fv-init-sidebar-title">建立基础词库</h2>
          <p className="fv-init-sidebar-desc">目标 100 词，含系统自动种入的代词</p>

          <div className="fv-init-progress-block">
            <div className="fv-init-progress-head">
              <span className="fv-init-progress-value">
                {status.knownCount}
                <small> / {status.targetCount}</small>
              </span>
              <span className="fv-init-progress-percent">{progressPercent}%</span>
            </div>
            <div className="fv-progress-bar fv-init-progress-bar">
              <div
                className="fv-progress-bar-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <dl className="fv-init-stat-grid">
            <div>
              <dt>词库总数</dt>
              <dd>{status.tierWordCount}</dd>
            </div>
            <div>
              <dt>当前分数</dt>
              <dd>{status.score}</dd>
            </div>
            <div>
              <dt>已种入代词</dt>
              <dd>{status.pronounCount}</dd>
            </div>
            <div>
              <dt>本轮待确认</dt>
              <dd>{roundWords.length}</dd>
            </div>
          </dl>

          <p className="fv-init-tip fv-init-tip-sidebar">
            每轮随机抽取<strong>名词 / 动词 / 形容词各 10 个</strong>。点击单词标记「不认识」即剔除；其余确认后入库。
          </p>

          <div className="fv-init-round-summary">
            <span>本轮保留 {keptWords.length} 个</span>
            <span>剔除 {unknownWords.size} 个</span>
          </div>

          {error && <p className="fv-status fv-status-error fv-init-sidebar-error">{error}</p>}

          <div className="fv-init-sidebar-actions">
            <button
              type="button"
              className="vocab-init-secondary-button"
              disabled={drawing || submitting}
              onClick={() => void startRound()}
            >
              {drawing ? '换批中…' : '换一批'}
            </button>
            <button
              type="button"
              className="vocab-init-primary-button"
              disabled={submitting || keptWords.length === 0}
              onClick={() => void handleKeep()}
            >
              {submitting ? '保存中…' : '确认保留'}
            </button>
          </div>
        </div>
      </aside>

      <section className="fv-init-main">
        <header className="fv-init-main-header">
          <h3>本轮单词 · 点击切换「保留 / 不认识」</h3>
          <p>三列并排对照词性，宽屏下一屏浏览 30 词</p>
        </header>

        {roundWords.length === 0 ? (
          <p className="fv-status">暂无可用单词，请稍后再试。</p>
        ) : (
          <div className="fv-init-pos-board">
            {POS_ORDER.map((pos) => {
              const items = groupedWords[pos]
              if (!items?.length) return null
              return (
                <div key={pos} className="fv-init-pos-column">
                  <div className="fv-init-pos-column-head">
                    <h4>{POS_SECTION_LABEL[pos] ?? pos}</h4>
                    <span>{items.length} 词</span>
                  </div>
                  <div className="fv-init-word-grid">
                    {items.map((item, index) => {
                      const isUnknown = unknownWords.has(item.word)
                      return (
                        <button
                          key={item.id}
                          type="button"
                          className={`fv-init-word-tile${isUnknown ? ' is-unknown' : ' is-kept'}`}
                          onClick={() => toggleUnknown(item.word)}
                        >
                          <span className="fv-init-word-tile-index">{index + 1}</span>
                          <span className={`fv-init-word-tile-badge${isUnknown ? ' is-unknown' : ''}`}>
                            {isUnknown ? '不认识' : '保留'}
                          </span>
                          <div className="fv-init-word-tile-body">
                            <div className="fv-init-word-tile-word">{item.word}</div>
                            {item.phonetic && (
                              <div className="fv-init-phonetic">{item.phonetic}</div>
                            )}
                            <div className="fv-init-word-tile-meaning">{item.meaningZh}</div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
