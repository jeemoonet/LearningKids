interface ForwardMovePanelProps {
  canAdvance: boolean
  moving: boolean
  blockedByLevel?: boolean
  blockedByStep?: boolean
  atEnd?: boolean
  onAdvance: () => void
  onEnterLevel?: () => void
  onEnterStep?: () => void
}

export function ForwardMovePanel({
  canAdvance,
  moving,
  blockedByLevel,
  blockedByStep,
  atEnd,
  onAdvance,
  onEnterLevel,
  onEnterStep,
}: ForwardMovePanelProps) {
  const showEnterLevel = Boolean(blockedByLevel && onEnterLevel)
  const showEnterStep = Boolean(blockedByStep && !blockedByLevel && onEnterStep)

  let hint = '点击箭头，沿路径前进一格'
  if (moving) hint = '队伍行进中…'
  else if (showEnterLevel) hint = '通关当前关卡后可继续前进'
  else if (showEnterStep) hint = '完成路途试炼后可继续前进'
  else if (atEnd) hint = '已抵达王宫脚下'

  const interactive = canAdvance

  return (
    <div className="cp-forward-panel">
      {showEnterLevel && (
        <button
          type="button"
          className="cp-forward-panel__enter"
          onClick={onEnterLevel}
          aria-label="进入当前关卡"
        >
          <span className="cp-forward-panel__enter-icon" aria-hidden="true">
            ⚔
          </span>
          <span className="cp-forward-panel__enter-label">进入当前关卡</span>
        </button>
      )}
      {showEnterStep && (
        <button
          type="button"
          className="cp-forward-panel__enter"
          onClick={onEnterStep}
          aria-label="开始路途试炼"
        >
          <span className="cp-forward-panel__enter-icon" aria-hidden="true">
            🧭
          </span>
          <span className="cp-forward-panel__enter-label">开始路途试炼</span>
        </button>
      )}
      <div className="cp-forward-panel__hint">{hint}</div>
      <button
        type="button"
        className={[
          'cp-forward-btn',
          moving ? 'cp-forward-btn--moving' : '',
          interactive ? '' : 'cp-forward-btn--disabled',
        ]
          .filter(Boolean)
          .join(' ')}
        disabled={!interactive}
        onClick={onAdvance}
        aria-label={interactive ? '沿路径前进一格' : '暂不可前进'}
      >
        <span className="cp-forward-btn__ring" aria-hidden="true">
          <svg className="cp-forward-btn__arrow" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 19V7M12 7l-5 5M12 7l5 5"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>
    </div>
  )
}
