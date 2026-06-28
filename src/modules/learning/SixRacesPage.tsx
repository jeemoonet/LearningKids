import { useState } from 'react'
import type { LearningNav } from './LearningModule'
import { ContinentalMapScene } from '../conquer-planet/components/ContinentalMapScene'
import { RaceGuidePanel } from './components/RaceGuidePanel'
import { KingdomGuidePanel } from './components/KingdomGuidePanel'
import { GameplayGuidePanel } from './components/GameplayGuidePanel'
import '../conquer-planet/styles/conquer.css'
import { PLANET_NAME } from './planetBrand'

interface SixRacesPageProps {
  nav: LearningNav
}

type GuideTab = 'gameplay' | 'kingdoms' | 'races'

const TAB_META: Record<GuideTab, { label: string; desc: string }> = {
  gameplay: {
    label: '游戏玩法',
    desc: '从登舰到征服，六步搞懂这场单词远征怎么打。',
  },
  kingdoms: {
    label: '七大王国',
    desc: `${PLANET_NAME}分为七大王国，由易到难逐一征服，壮大你的军团。`,
  },
  races: {
    label: '六大种族',
    desc: `${PLANET_NAME}的居民按语法功能分为六族，相生相克决定远征战术。`,
  },
}

export function SixRacesPage({ nav }: SixRacesPageProps) {
  const [tab, setTab] = useState<GuideTab>('gameplay')

  return (
    <div className="lw-six-races-page">
      <div className="lw-six-races-page__backdrop" aria-hidden="true">
        <ContinentalMapScene />
      </div>
      <header className="lw-six-races-page__head">
        <div className="lw-six-races-page__head-inner">
          <div>
            <h1>游戏说明</h1>
            <p>{TAB_META[tab].desc}</p>
            {tab === 'races' && (
              <p className="lw-six-races-page__rule">相生 +20% · 同族 -20% · 其他 ×1.0</p>
            )}
          </div>
          <button
            type="button"
            className="lw-six-races-page__close"
            onClick={() => nav.go('my-world-hub')}
            aria-label="关闭"
          >
            ×
          </button>
        </div>

        <div className="lw-guide-tabs" role="tablist" aria-label="游戏说明分类">
          {(Object.keys(TAB_META) as GuideTab[]).map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              className={`lw-guide-tab${tab === key ? ' is-active' : ''}`}
              onClick={() => setTab(key)}
            >
              {TAB_META[key].label}
            </button>
          ))}
        </div>
      </header>

      {tab === 'gameplay' && <GameplayGuidePanel />}
      {tab === 'kingdoms' && <KingdomGuidePanel />}
      {tab === 'races' && <RaceGuidePanel layout="page" defaultExpandedAll />}
    </div>
  )
}
