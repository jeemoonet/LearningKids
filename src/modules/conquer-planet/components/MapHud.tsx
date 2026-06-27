import type { ReactNode } from 'react'
import { ArmyPanel } from './ArmyPanel'

interface MapHudProps {
  title: string
  subtitle?: string
  leading?: ReactNode
  trailing?: ReactNode
  showArmy?: boolean
}

/** 浮在地图上的标题与军团参数 HUD */
export function MapHud({ title, subtitle, leading, trailing, showArmy = true }: MapHudProps) {
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
      {showArmy && (
        <div className="cp-map-hud__right">
          <ArmyPanel variant="float" />
        </div>
      )}
    </div>
  )
}
