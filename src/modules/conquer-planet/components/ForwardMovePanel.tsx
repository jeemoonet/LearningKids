interface ForwardMovePanelProps {
  canAdvance: boolean
  moving: boolean
  blockedByLevel?: boolean
  blockedByStep?: boolean
  atEnd?: boolean
  onAdvance: () => void
  onEnterLevel?: () => void
  onEnterStep?: () => void
  onReset?: () => void
  resetting?: boolean
  onOpenRoadbook?: () => void
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
  onReset,
  resetting,
  onOpenRoadbook,
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
    <>
      {onOpenRoadbook && (
        <button
          type="button"
          className="cp-roadbook-side"
          onClick={onOpenRoadbook}
          aria-label="打开路书"
          title="查看已征服关卡与单词"
        >
          <span className="cp-roadbook-side__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M6 4h10a2 2 0 0 1 2 2v14l-4-2.5L10 20V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h0"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M8 4v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
          <span className="cp-roadbook-side__label">路书</span>
        </button>
      )}

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
        <div className="cp-forward-panel__actions">
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
          {onReset && (
            <button
              type="button"
              className="cp-reset-link"
              onClick={onReset}
              disabled={resetting || moving}
              title="清零本王国关卡进度与地图位置"
            >
              <svg className="cp-reset-link__icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M12 5v14M5 12l7-7 7 7"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              回到起点
            </button>
          )}
        </div>
      </div>
    </>
  )
}
