import { PLANET_NAME, PLANET_TAGLINE } from '../planetBrand'

interface PlanetBrandLogoProps {
  /** 固定于视口左上角（各主页面统一挂载） */
  fixed?: boolean
  /** 点击 Logo 返回（如训练营 → 我的世界） */
  onClick?: () => void
}

function PlanetBrandLogoContent() {
  return (
    <>
      <span className="lk-planet-brand__mark" aria-hidden="true">
        <span className="lk-planet-brand__glow" />
        <span className="lk-planet-brand__planet">🪐</span>
      </span>
      <div className="lk-planet-brand__text">
        <span className="lk-planet-brand__name">{PLANET_NAME}</span>
        <span className="lk-planet-brand__sub">{PLANET_TAGLINE}</span>
      </div>
    </>
  )
}

export function PlanetBrandLogo({ fixed = false, onClick }: PlanetBrandLogoProps) {
  const className = `lk-planet-brand${fixed ? ' lk-planet-brand--fixed' : ''}${onClick ? ' lk-planet-brand--clickable' : ''}`

  if (onClick) {
    return (
      <button
        type="button"
        className={className}
        onClick={onClick}
        aria-label={`返回${PLANET_NAME}`}
      >
        <PlanetBrandLogoContent />
      </button>
    )
  }

  return (
    <section className={className} aria-label={PLANET_NAME}>
      <PlanetBrandLogoContent />
    </section>
  )
}
