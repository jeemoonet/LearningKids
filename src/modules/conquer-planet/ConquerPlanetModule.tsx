import { useEffect, useRef, useState } from 'react'

import type { LearningProfile } from '../learning/api'
import { ConquerProvider, useConquer } from './ConquerContext'

import type { PlanetKingdomSummary, PlanetLevel } from './types'

import { ContinentalOverviewDrawer } from './components/ContinentalOverviewDrawer'
import { ConquerUserBarSync } from './components/ConquerUserBarSync'
import { ArmyPanel } from './components/ArmyPanel'
import { ArmyInspectModal } from './components/ArmyInspectModal'
import { ContinentalMapView } from './views/ContinentalMapView'

import { KingdomBattleMapView } from './views/KingdomBattleMapView'

import { CastleBossLevel } from './views/CastleBossLevel'

import { RecruitVillageLevel } from './views/RecruitVillageLevel'

import { ReviewLevel } from './views/ReviewLevel'

import { installGames } from './games'

import { WorldMapBackground } from '../learning/components/WorldMapBackground'

import './styles/conquer.css'

installGames()



type View =

  | { name: 'continent' }

  | { name: 'kingdom'; kingdom: PlanetKingdomSummary }

  | { name: 'level'; kingdom: PlanetKingdomSummary; level: PlanetLevel }



interface ConquerPlanetModuleProps {
  onBack?: () => void
  embedded?: boolean
  shellMode?: boolean
  initialKingdomId?: string | null
  onInitialKingdomConsumed?: () => void
  profile?: LearningProfile | null
  userDisplayName?: string
  onLogout?: () => void
}



function ConquerPlanetInner({
  onBack,
  embedded,
  shellMode,
  initialKingdomId,
  onInitialKingdomConsumed,
}: ConquerPlanetModuleProps) {
  const { loading, error, refresh, session } = useConquer()
  const [view, setView] = useState<View>({ name: 'continent' })
  const [continentDrawerOpen, setContinentDrawerOpen] = useState(false)
  const [inspectOpen, setInspectOpen] = useState(false)
  /** shellMode 下仅首次进入时跳到当前王国，避免答题更新 session 时把关卡页顶掉 */
  const shellKingdomNavDone = useRef(false)

  const openContinentOverview = () => setContinentDrawerOpen(true)
  const closeContinentOverview = () => setContinentDrawerOpen(false)

  useEffect(() => {
    if (!session) return

    if (initialKingdomId) {
      const kingdom = session.kingdoms.find((k) => k.id === initialKingdomId)
      if (kingdom && kingdom.status !== 'locked') {
        setView({ name: 'kingdom', kingdom })
        onInitialKingdomConsumed?.()
      }
      return
    }

    if (shellMode && !shellKingdomNavDone.current) {
      shellKingdomNavDone.current = true
      const targetId = session.activeKingdomId
      if (!targetId) return
      const kingdom = session.kingdoms.find((k) => k.id === targetId)
      if (kingdom && kingdom.status !== 'locked') {
        setView({ name: 'kingdom', kingdom })
      }
    }
  }, [initialKingdomId, session, shellMode, onInitialKingdomConsumed])



  const backToContinent = () => {

    setView({ name: 'continent' })

    void refresh()

  }



  const backToKingdom = () => {

    if (view.name === 'level') {

      setView({ name: 'kingdom', kingdom: view.kingdom })

    } else {

      backToContinent()

    }

    void refresh()

  }



  const enterKingdom = (kingdom: PlanetKingdomSummary) => {
    closeContinentOverview()
    setView({ name: 'kingdom', kingdom })
  }



  return (

    <div className={`cp-root${embedded ? ' cp-root--embedded' : ''}${view.name === 'continent' || view.name === 'kingdom' ? ' cp-root--map-mode' : ''}${view.name === 'level' ? ' cp-root--level-mode' : ''}`}>

      <WorldMapBackground />

      {!shellMode && (
        <header className="cp-topbar">
          <div className="cp-brand">
            {onBack && (
              <button type="button" className="cp-back" onClick={onBack}>
                ← 返回
              </button>
            )}
            <span className="cp-brand-icon">🪐</span>
            <span className="cp-brand-title">征服星球</span>
            <span className="cp-brand-sub">词性军团养成 · 七王国远征</span>
          </div>
          <div className="cp-topbar__aside">
            {session && (
              <ArmyPanel variant="compact" onInspectArmy={() => setInspectOpen(true)} />
            )}
            {view.name !== 'continent' && (
              <button type="button" className="cp-reset" onClick={openContinentOverview}>
                大陆全景
              </button>
            )}
          </div>
        </header>
      )}

      {shellMode && onBack && view.name !== 'continent' && (
        <header className="cp-topbar cp-topbar--shell">
          <button type="button" className="cp-back" onClick={onBack}>
            ← 我的世界
          </button>
          {view.name !== 'kingdom' && (
            <button type="button" className="cp-reset" onClick={openContinentOverview}>
              大陆全景
            </button>
          )}
        </header>
      )}



      <main className={`cp-stage-wrap${view.name === 'continent' || view.name === 'kingdom' ? ' cp-stage-wrap--map' : ''}${view.name === 'level' ? ' cp-stage-wrap--level' : ''}`}>

        {loading && <p className="cp-level-empty">正在加载军团数据…</p>}

        {!loading && error && (

          <div className="cp-level-page">

            <p className="cp-level-empty">{error}</p>

            <button type="button" className="cp-btn" onClick={() => void refresh()}>重试</button>

          </div>

        )}

        {!loading && !error && view.name === 'continent' && session && (

          <ContinentalMapView onEnterKingdom={enterKingdom} />

        )}

        {!loading && !error && view.name === 'kingdom' && (

          <KingdomBattleMapView

            kingdom={view.kingdom}

            onOpenContinentOverview={openContinentOverview}

            onEnter={(level) => setView({ name: 'level', kingdom: view.kingdom, level })}

          />

        )}

        {!loading && !error && view.name === 'level' && view.level.kind === 'recruit' && (

          <RecruitVillageLevel levelId={view.level.id} onBack={backToKingdom} />

        )}

        {!loading && !error && view.name === 'level' && view.level.kind === 'boss' && (

          <CastleBossLevel

            levelId={view.level.id}

            monsterId={view.kingdom.monster.id}

            onBack={backToKingdom}

          />

        )}

        {!loading && !error && view.name === 'level' && view.level.kind === 'review' && (

          <ReviewLevel levelId={view.level.id} onBack={backToKingdom} />

        )}

        {!loading && !error && session && (
          <ContinentalOverviewDrawer
            open={continentDrawerOpen}
            onClose={closeContinentOverview}
            currentKingdomId={
              view.name === 'kingdom'
                ? view.kingdom.id
                : view.name === 'level'
                  ? view.kingdom.id
                  : undefined
            }
          />
        )}

        {!shellMode && inspectOpen && session && (
          <ArmyInspectModal open session={session} onClose={() => setInspectOpen(false)} />
        )}

      </main>

    </div>

  )

}



export function ConquerPlanetModule(props: ConquerPlanetModuleProps) {

  return (

    <ConquerProvider>

      <ConquerUserBarSync />
      <ConquerPlanetInner {...props} />

    </ConquerProvider>

  )

}



/** 独立入口 /conquer 使用（需外层 AuthProvider） */

export function ConquerPlanetStandalone() {

  return <ConquerPlanetModule embedded={false} />

}


