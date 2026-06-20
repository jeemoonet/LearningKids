import { useEffect, useState } from 'react'

interface GroupCoverPreviewModalProps {
  open: boolean
  title: string
  imageUrl: string
  onClose: () => void
}

export function GroupCoverPreviewModal({ open, title, imageUrl, onClose }: GroupCoverPreviewModalProps) {
  const [loadFailed, setLoadFailed] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoadFailed(false)
  }, [open, imageUrl])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="group-cover-modal-backdrop"
      role="presentation"
      onClick={onClose}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose()
      }}
    >
      <div
        className="group-cover-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="group-cover-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="group-cover-modal-header">
          <h3 id="group-cover-modal-title">{title}</h3>
          <button type="button" className="group-cover-modal-close" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </header>
        <div className="group-cover-modal-body">
          {loadFailed ? (
            <p className="group-cover-modal-error">配图加载失败，请确认文件已放入 src/public/images/vocab-groups/</p>
          ) : (
            <img
              className="group-cover-modal-image"
              src={imageUrl}
              alt={`${title} 场景配图`}
              onError={() => setLoadFailed(true)}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function CoverImageIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="8.5" cy="10" r="1.6" fill="currentColor" />
      <path d="M5 17l4.5-4 3 2.5L15 12l4 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function GroupCoverBadge() {
  return (
    <span className="group-cover-badge" title="有场景配图，点击查看">
      <CoverImageIcon />
    </span>
  )
}
