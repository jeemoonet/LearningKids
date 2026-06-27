import { useEffect } from 'react'
import { ContinentalMapScene } from './ContinentalMapScene'
import { getKingdomMapPosition } from '../planetMapConfig'
import { useConquer } from '../ConquerContext'
import type { PlanetKingdomSummary } from '../types'

interface ContinentalOverviewDrawerProps {
  open: boolean
  onClose: () => void
  currentKingdomId?: string
}

function statusLabel(status: PlanetKingdomSummary['status']): string {
  if (status === 'locked') return '未解锁'
  if (status === 'cleared') return '已征服'
  return '出征中'
}

/** 右侧滑出的大陆概览（只读，不进入详细地图） */
export function ContinentalOverviewDrawer({
  open,
  onClose,
  currentKingdomId,
}: ContinentalOverviewDrawerProps) {
  const { session } = useConquer()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!session) return null

  const clearedCount = session.kingdoms.filter((k) => k.status === 'cleared').length

  return (
    <div
      className={`cp-continent-drawer${open ? ' is-open' : ''}`}
      aria-hidden={!open}
    >
      <button
        type="button"
        className="cp-continent-drawer__backdrop"
        onClick={onClose}
        aria-label="关闭大陆概览"
        tabIndex={open ? 0 : -1}
      />

      <aside className="cp-continent-drawer__panel" role="dialog" aria-modal="true" aria-label="大陆全景概览">
        <header className="cp-continent-drawer__head">
          <div>
            <h3 className="cp-continent-drawer__title">大陆全景</h3>
            <p className="cp-continent-drawer__sub">已征服 {clearedCount} / 7 国</p>
          </div>
          <button type="button" className="cp-continent-drawer__close" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </header>

        <div className="cp-continent-drawer__map-wrap">
          <div className="cp-continent-drawer__map">
            <ContinentalMapScene />
            <div className="cp-continent-drawer__pins" aria-hidden="true">
              {session.kingdoms.map((kingdom) => {
                const pos = getKingdomMapPosition(kingdom.id)
                if (!pos) return null
                const isHere = kingdom.id === currentKingdomId
                return (
                  <span
                    key={kingdom.id}
                    className={[
                      'cp-continent-drawer__pin',
                      `cp-continent-drawer__pin--${kingdom.status}`,
                      isHere ? 'cp-continent-drawer__pin--here' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                    title={kingdom.name}
                  >
                    {kingdom.order}
                  </span>
                )
              })}
            </div>
          </div>
        </div>

        <ul className="cp-continent-drawer__list">
          {session.kingdoms.map((kingdom) => {
            const pos = getKingdomMapPosition(kingdom.id)
            const isHere = kingdom.id === currentKingdomId
            return (
              <li
                key={kingdom.id}
                className={[
                  'cp-continent-drawer__item',
                  `cp-continent-drawer__item--${kingdom.status}`,
                  isHere ? 'cp-continent-drawer__item--here' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <span className="cp-continent-drawer__item-order">{kingdom.order}</span>
                <div className="cp-continent-drawer__item-body">
                  <span className="cp-continent-drawer__item-name">{kingdom.name}</span>
                  <span className="cp-continent-drawer__item-meta">
                    {pos?.region ?? ''} · {statusLabel(kingdom.status)}
                    {isHere && ' · 当前'}
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      </aside>
    </div>
  )
}
