import type { ReactNode } from 'react'

interface MapHudProps {
  title: string
  subtitle?: string
  leading?: ReactNode
  trailing?: ReactNode
}

/** 浮在地图上的标题 HUD（军团指标已移至右上角用户栏） */
export function MapHud({ title, subtitle, leading, trailing }: MapHudProps) {
  return (
    <div className="cp-map-hud" aria-label="地图信息">
      <div className="cp-map-hud__left">
        {leading}
        <div className="cp-map-hud__title-card">
          <h2 className="cp-map-hud__title">{title}</h2>
          {subtitle && <p className="cp-map-hud__sub">{subtitle}</p>}
        </div>
        {trailing}
      </div>
    </div>
  )
}
