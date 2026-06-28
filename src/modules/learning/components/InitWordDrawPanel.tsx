import { useCallback, useEffect, useState } from 'react'
import { learningApi, type InitStatus, type InitWord } from '../api'

const TIER_OPTIONS = [
  { id: 'beginner', label: '初级' },
  { id: 'intermediate', label: '中级' },
  { id: 'advanced', label: '高级' },
]

export interface InitWordDrawPanelProps {
  active: boolean
  tier?: string
  tierLocked?: boolean
  variant?: 'modal' | 'embedded'
  title?: string
  subtitle?: string
  onClose?: () => void
  onImported: () => Promise<void>
  onInitialized?: () => void
  onGoLibrary?: () => void
  onBack?: () => void
}

export function InitWordDrawPanel({
  active,
  tier: tierProp = 'beginner',
  tierLocked = false,
  variant = 'modal',
  title = '抽取单词并导入',
  subtitle = '从标准库随机抽词，点 × 去掉不认识的，其余导入我的单词库',
  onClose,
  onImported,
  onInitialized,
  onGoLibrary,
  onBack,
}: InitWordDrawPanelProps) {
  const [tier, setTier] = useState(tierProp)
  const [status, setStatus] = useState<InitStatus | null>(null)
  const [batch, setBatch] = useState<InitWord[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const visibleBatch = batch.filter((w) => !dismissed.has(w.word))
  const wordsToImport = visibleBatch.map((w) => w.word)

  useEffect(() => {
    if (!tierLocked) setTier(tierProp)
  }, [tierProp, tierLocked])

  const loadStatus = useCallback(async (t: string) => {
    const s = await learningApi.initStatus(t)
    setStatus(s)
    return s
  }, [])

  const drawBatch = useCallback(async () => {
    setLoading(true)
    setMessage('')
    try {
      const { words, status: s } = await learningApi.initDraw(tier)
      setBatch(words)
      setDismissed(new Set())
      setStatus(s)
      if (words.length === 0) {
        setMessage(s.initialized ? '已达到初始化目标（100 词）' : '该档暂无更多可抽单词')
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '抽词失败')
    } finally {
      setLoading(false)
    }
  }, [tier])

  useEffect(() => {
    if (!active) return
    setBatch([])
    setDismissed(new Set())
    setMessage('')
    void loadStatus(tier).then((s) => {
      if (!s.initialized) void drawBatch()
    })
  }, [active, tier, loadStatus, drawBatch])

  useEffect(() => {
    if (!active || variant !== 'modal' || !onClose) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [active, variant, onClose])

  const dismissWord = (word: string) => {
    setDismissed((prev) => new Set(prev).add(word))
  }

  const importKeptWords = async () => {
    if (wordsToImport.length === 0) return

    setLoading(true)
    setMessage('')
    try {
      const { status: s } = await learningApi.initKeep(tier, wordsToImport)
      setStatus(s)
      await onImported()
      if (s.initialized) {
        setMessage('初始化完成！已建立 100 词基础库。')
        setBatch([])
        onInitialized?.()
        return
      }
      setMessage(`已导入 ${wordsToImport.length} 个词，继续抽取下一批…`)
      await drawBatch()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '保存失败')
    } finally {
      setLoading(false)
    }
  }

  if (!active) return null

  const progress = status ? Math.min(100, Math.round((status.knownCount / status.targetCount) * 100)) : 0
  const isEmbedded = variant === 'embedded'

  const actionBtnClass = (kind: 'primary' | 'secondary') =>
    isEmbedded
      ? kind === 'primary'
        ? 'lw-mw-onboard__primary'
        : 'lw-mw-onboard__secondary'
      : kind === 'primary'
        ? 'learning-primary'
        : 'learning-secondary'

  const wordGridBlock =
    batch.length === 0 ? null : visibleBatch.length === 0 ? (
      <p className="learning-hint">本轮已全部移除，请换一批或关闭后重试。</p>
    ) : (
      <div
        className={[
          'learning-init-grid learning-init-grid-modal',
          isEmbedded ? 'learning-init-grid-onboard' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {visibleBatch.map((w) => (
          <div
            key={w.id}
            className={[
              'learning-init-word is-kept',
              isEmbedded ? 'learning-init-word--word-only' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <button
              type="button"
              className="learning-init-word-close"
              aria-label={`移除 ${w.word}`}
              onClick={() => dismissWord(w.word)}
            >
              ×
            </button>
            <div className="learning-init-word-body">
              <span className="learning-init-word-en">{w.word}</span>
              {!isEmbedded && (
                <>
                  <span className="learning-init-word-pos">{w.posLabel}</span>
                  <span className="learning-init-word-zh">{w.meaningZh}</span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    )

  const wordFooter = batch.length === 0 ? null : (
    <>
      <div className="learning-init-summary">
        <span>待导入 {visibleBatch.length} 个</span>
        {dismissed.size > 0 && <span>已移除 {dismissed.size} 个</span>}
      </div>
      <div className={`learning-form-actions${isEmbedded ? ' lw-mw-onboard__init-actions' : ''}`}>
        {onBack && (
          <button type="button" className={actionBtnClass('secondary')} onClick={onBack} disabled={loading}>
            上一步
          </button>
        )}
        <button type="button" className={actionBtnClass('secondary')} onClick={drawBatch} disabled={loading}>
          换一批
        </button>
        <button
          type="button"
          className={actionBtnClass('primary')}
          onClick={importKeptWords}
          disabled={loading || visibleBatch.length === 0}
        >
          {loading ? '导入中…' : `导入 ${visibleBatch.length} 个词`}
        </button>
      </div>
    </>
  )

  const wordBatchContent =
    batch.length === 0 ? null : (
      <>
        <p className="learning-init-hint">
          不认识的词点右上角 × 移除；保留的 {visibleBatch.length} 个词将一并导入。
        </p>
        {wordGridBlock}
        {!isEmbedded && wordFooter}
      </>
    )

  const body = (
    <>
      <div className={isEmbedded ? 'lw-mw-onboard__init' : 'learning-modal-body'}>
        {!isEmbedded && (
          <div className="learning-form-row">
            <label>抽词来源</label>
            <select value={tier} onChange={(e) => setTier(e.target.value)} disabled={loading || tierLocked}>
              {TIER_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="learning-progress">
          <div className="learning-progress-bar" style={{ width: `${progress}%` }} />
          <span className="learning-progress-text">
            已掌握 {status?.knownCount ?? 0} / {status?.targetCount ?? 100}
          </span>
        </div>

        {status?.initialized ? (
          <div className="learning-modal-done">
            <p>基础词库已建立（100 词），勇士已加入军团。</p>
            {variant === 'modal' && (
              <div className="learning-form-actions">
                {onGoLibrary && (
                  <button type="button" className="learning-secondary" onClick={onGoLibrary}>
                    选择学习库
                  </button>
                )}
                {onClose && (
                  <button type="button" className="learning-primary" onClick={onClose}>
                    关闭
                  </button>
                )}
              </div>
            )}
          </div>
        ) : batch.length === 0 ? (
          <div className="learning-modal-empty">
            <p>{message || '正在抽取单词…'}</p>
            <button type="button" className={actionBtnClass('primary')} onClick={drawBatch} disabled={loading}>
              {loading ? '抽词中…' : '重新抽词'}
            </button>
          </div>
        ) : isEmbedded ? (
          <>
            <div className="lw-mw-onboard__init-scroll">{wordBatchContent}</div>
            <div className="lw-mw-onboard__init-footer">{wordFooter}</div>
          </>
        ) : (
          wordBatchContent
        )}

        {message && !status?.initialized && batch.length > 0 && (
          <p className="learning-hint">{message}</p>
        )}
      </div>
    </>
  )

  if (variant === 'embedded') return body

  return (
    <div className="learning-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="learning-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="learning-init-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="learning-modal-header">
          <div>
            <h2 id="learning-init-modal-title">{title}</h2>
            <p className="learning-modal-subtitle">{subtitle}</p>
          </div>
          {onClose && (
            <button type="button" className="learning-modal-close" onClick={onClose} aria-label="关闭">
              ×
            </button>
          )}
        </header>
        {body}
      </div>
    </div>
  )
}
