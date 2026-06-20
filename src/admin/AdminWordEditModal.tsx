import { useEffect, useState, type FormEvent } from 'react'
import type { VocabPos, VocabWord } from '../modules/vocab-training/types'
import { VOCAB_POS_OPTIONS } from '../modules/vocab-training/types'
import { getWordDisplay } from '../modules/vocab-training/wordFrequency'

interface AdminWordEditModalProps {
  open: boolean
  word: VocabWord | null
  saving?: boolean
  error?: string
  onClose: () => void
  onSave: (patch: {
    meaningZh: string
    exampleEn: string
    exampleZh: string
    pos: VocabPos
  }) => void
}

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 20h4l10.5-10.5a1.5 1.5 0 0 0 0-2.12L16.62 5.5a1.5 1.5 0 0 0-2.12 0L4 16v4z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M13.5 6.5l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export function RegenerateIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20 12a8 8 0 1 1-2.34-5.66"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M20 4v5h-5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function AdminWordActionButtons({
  onEdit,
  onRegenerate,
  regenerating = false,
}: {
  onEdit: () => void
  onRegenerate: () => void
  regenerating?: boolean
}) {
  return (
    <div className="admin-word-action-btns">
      <button
        type="button"
        className="admin-word-action-btn"
        onClick={(event) => {
          event.stopPropagation()
          onEdit()
        }}
        title="编辑词性、释义与例句"
        aria-label="编辑词性、释义与例句"
        disabled={regenerating}
      >
        <EditIcon />
      </button>
      <button
        type="button"
        className="admin-word-action-btn admin-word-action-btn-regen"
        onClick={(event) => {
          event.stopPropagation()
          onRegenerate()
        }}
        title="按规则重新生成释义与例句"
        aria-label="按规则重新生成释义与例句"
        disabled={regenerating}
      >
        {regenerating ? <span className="admin-word-action-spinner" aria-hidden="true" /> : <RegenerateIcon />}
      </button>
    </div>
  )
}

export function AdminWordEditButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="admin-word-edit-btn"
      onClick={(event) => {
        event.stopPropagation()
        onClick()
      }}
      title="编辑词性、释义与例句"
      aria-label="编辑词性、释义与例句"
    >
      <EditIcon />
    </button>
  )
}

export function AdminWordEditModal({
  open,
  word,
  saving = false,
  error = '',
  onClose,
  onSave,
}: AdminWordEditModalProps) {
  const [meaningZh, setMeaningZh] = useState('')
  const [exampleEn, setExampleEn] = useState('')
  const [exampleZh, setExampleZh] = useState('')
  const [pos, setPos] = useState<VocabPos>('other')

  useEffect(() => {
    if (!open || !word) return
    setMeaningZh(word.meaningZh)
    setExampleEn(word.exampleEn)
    setExampleZh(word.exampleZh)
    setPos(word.pos)
  }, [open, word])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !saving) onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, saving, onClose])

  if (!open || !word) return null

  const { baseWord } = getWordDisplay(word.word, word)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!meaningZh.trim()) return
    onSave({
      meaningZh: meaningZh.trim(),
      exampleEn: exampleEn.trim(),
      exampleZh: exampleZh.trim(),
      pos,
    })
  }

  return (
    <div
      className="admin-word-edit-backdrop"
      role="presentation"
      onClick={() => {
        if (!saving) onClose()
      }}
    >
      <div
        className="admin-word-edit-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-word-edit-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="admin-word-edit-header">
          <div>
            <h3 id="admin-word-edit-title">编辑单词</h3>
            <p>{baseWord}</p>
          </div>
          <button
            type="button"
            className="admin-word-edit-close"
            onClick={onClose}
            disabled={saving}
            aria-label="关闭"
          >
            ×
          </button>
        </header>

        <form className="admin-word-edit-form" onSubmit={handleSubmit}>
          <label className="admin-word-edit-field">
            <span>词性</span>
            <select
              value={pos}
              onChange={(event) => setPos(event.target.value as VocabPos)}
              disabled={saving}
            >
              {VOCAB_POS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="admin-word-edit-field">
            <span>释义</span>
            <textarea
              value={meaningZh}
              onChange={(event) => setMeaningZh(event.target.value)}
              rows={2}
              required
              disabled={saving}
              placeholder="中文释义"
            />
          </label>

          <label className="admin-word-edit-field">
            <span>例句（英文）</span>
            <textarea
              value={exampleEn}
              onChange={(event) => setExampleEn(event.target.value)}
              rows={2}
              disabled={saving}
              placeholder="英文例句"
            />
          </label>

          <label className="admin-word-edit-field">
            <span>例句（中文）</span>
            <textarea
              value={exampleZh}
              onChange={(event) => setExampleZh(event.target.value)}
              rows={2}
              disabled={saving}
              placeholder="例句中文对照"
            />
          </label>

          {error && <p className="admin-word-edit-error">{error}</p>}

          <footer className="admin-word-edit-footer">
            <button type="button" className="admin-btn admin-btn-outline" onClick={onClose} disabled={saving}>
              取消
            </button>
            <button type="submit" className="admin-btn admin-btn-primary" disabled={saving || !meaningZh.trim()}>
              {saving ? '保存中...' : '保存'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  )
}
