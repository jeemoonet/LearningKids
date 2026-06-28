import { HUB_NAV_ITEMS, type AppHub } from '../../../lib/appRoutes'

export type { AppHub }

interface FloatingNavProps {
  active: AppHub
  onChange: (hub: AppHub) => void
  onOpenGuide?: () => void
  guideActive?: boolean
}

export function FloatingNav({ active, onChange, onOpenGuide, guideActive }: FloatingNavProps) {
  return (
    <nav className="lk-float-nav lk-float-nav--main" aria-label="主导航">
      {HUB_NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`lk-float-nav__item${active === item.id ? ' is-active' : ''}`}
          onClick={() => onChange(item.id)}
          title={item.label}
        >
          <span className="lk-float-nav__icon" aria-hidden="true">{item.icon}</span>
          <span className="lk-float-nav__label">{item.label}</span>
        </button>
      ))}
      {onOpenGuide && (
        <button
          type="button"
          className={`lk-float-nav__item${guideActive ? ' is-active' : ''}`}
          onClick={onOpenGuide}
          title="游戏说明"
        >
          <span className="lk-float-nav__icon" aria-hidden="true">🧬</span>
          <span className="lk-float-nav__label">游戏说明</span>
        </button>
      )}
    </nav>
  )
}

export { hubFromPage, hubLandingPage } from '../../../lib/appRoutes'
