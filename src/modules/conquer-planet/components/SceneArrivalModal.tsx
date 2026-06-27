import { createPortal } from 'react-dom'

export interface SceneBranchChoice {
  id: string
  label: string
  hint: string
}

interface SceneArrivalModalProps {
  open: boolean
  icon: string
  title: string
  location: string
  body: string
  primaryLabel: string
  onConfirm: () => void
  note?: string
  eyebrow?: string
  branchChoices?: SceneBranchChoice[]
  onBranchChoice?: (branchId: string) => void
}

/** 四角纹章装饰（SVG） */
function FrameCorner({ className }: { className: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M 4 44 L 4 14 Q 4 4 14 4 L 44 4"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M 4 32 Q 4 4 32 4"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeLinecap="round"
        opacity="0.55"
      />
      <circle cx="4" cy="4" r="2.8" fill="currentColor" opacity="0.85" />
      <path
        d="M 10 4 L 10 10 M 4 10 L 10 10"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.65"
      />
      <path
        d="M 18 4 Q 12 4 12 10 M 4 18 Q 4 12 10 12"
        stroke="currentColor"
        strokeWidth="0.7"
        opacity="0.4"
      />
    </svg>
  )
}

export function SceneArrivalModal({
  open,
  icon,
  title,
  location,
  body,
  primaryLabel,
  onConfirm,
  note,
  eyebrow = '抵达新场景',
  branchChoices,
  onBranchChoice,
}: SceneArrivalModalProps) {
  if (!open) return null

  const modal = (
    <div className="cp-scene-overlay" role="presentation">
      <div className="cp-scene-modal" role="dialog" aria-modal="true" aria-labelledby="cp-scene-title">
        <div className="cp-scene-modal__frame" aria-hidden="true">
          <div className="cp-scene-modal__frame-outer">
            <div className="cp-scene-modal__frame-bevel" />
            <div className="cp-scene-modal__frame-inner">
              <FrameCorner className="cp-scene-modal__corner cp-scene-modal__corner--tl" />
              <FrameCorner className="cp-scene-modal__corner cp-scene-modal__corner--tr" />
              <FrameCorner className="cp-scene-modal__corner cp-scene-modal__corner--bl" />
              <FrameCorner className="cp-scene-modal__corner cp-scene-modal__corner--br" />
              <span className="cp-scene-modal__edge cp-scene-modal__edge--top" />
              <span className="cp-scene-modal__edge cp-scene-modal__edge--bottom" />
              <span className="cp-scene-modal__edge cp-scene-modal__edge--left" />
              <span className="cp-scene-modal__edge cp-scene-modal__edge--right" />
            </div>
          </div>
        </div>

        <div className="cp-scene-modal__content">
          <div className="cp-scene-modal__crest">{icon}</div>
          <p className="cp-scene-modal__eyebrow">{eyebrow}</p>
          <h2 id="cp-scene-title" className="cp-scene-modal__title">
            {title}
          </h2>
          <p className="cp-scene-modal__location">{location}</p>
          {note && <p className="cp-scene-modal__roll">{note}</p>}
          <p className="cp-scene-modal__body">{body}</p>
          {branchChoices && branchChoices.length > 0 ? (
            <div className="cp-scene-modal__branches">
              {branchChoices.map((branch) => (
                <button
                  key={branch.id}
                  type="button"
                  className="cp-scene-modal__branch"
                  onClick={() => onBranchChoice?.(branch.id)}
                >
                  <span className="cp-scene-modal__branch-label">{branch.label}</span>
                  <span className="cp-scene-modal__branch-hint">{branch.hint}</span>
                </button>
              ))}
            </div>
          ) : (
            <button type="button" className="cp-scene-modal__confirm" onClick={onConfirm}>
              {primaryLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  )

  if (typeof document === 'undefined') return modal
  return createPortal(modal, document.body)
}
