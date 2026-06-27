import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { learningApi, type LearningProfile, type LearningSet } from './api'
import { WorldMapPage } from './WorldMapPage'
import { InitPage } from './InitPage'
import { LibraryPickPage } from './LibraryPickPage'
import { PlanPage } from './PlanPage'
import { SectionPage } from './SectionPage'
import { AssessmentPage } from './AssessmentPage'
import { StandardLibraryPage } from './StandardLibraryPage'
import { TrainingCampPage } from './TrainingCampPage'
import { ConquerPlanetModule } from '../conquer-planet/ConquerPlanetModule'
import { ConquerProvider } from '../conquer-planet/ConquerContext'
import { FloatingNav, hubFromPage, hubLandingPage, type AppHub } from './components/FloatingNav'
import { AppUserBar } from './components/AppUserBar'
import { SixRacesPage } from './SixRacesPage'
import {
  pathForAppHub,
  pathForHubPage,
  resolveHubPage,
  type HubPageName,
} from '../../lib/appRoutes'
import type { TrainingSectionId } from './trainingCampSections'
import './learning.css'
import './training-camp-mc.css'

export type LearningPageName =
  | 'my-world-hub'
  | 'conquer-planet'
  | 'training-hub'
  | 'init'
  | 'library'
  | 'plan'
  | 'section'
  | 'assessment'
  | 'standard'
  | 'prep-game'
  | 'sentence-game'
  | 'six-races'

export interface LearningNav {
  go: (page: LearningPageName, sectionId?: string) => void
}

const IMMERSIVE_PAGES: LearningPageName[] = [
  'my-world-hub',
  'conquer-planet',
  'prep-game',
  'sentence-game',
]

const TRAINING_CAMP_PAGES: LearningPageName[] = ['training-hub', 'prep-game', 'sentence-game']

function trainingSectionFromPage(page: LearningPageName): TrainingSectionId | undefined {
  if (page === 'prep-game') return 'spirit'
  if (page === 'sentence-game') return 'formation'
  return undefined
}

const HUB_PAGES: HubPageName[] = ['my-world-hub', 'conquer-planet', 'training-hub']

function readInitialPage(): LearningPageName {
  return resolveHubPage(window.location.pathname)
}

function syncUrlForPage(next: LearningPageName, replace = false) {
  if (!HUB_PAGES.includes(next as HubPageName)) return
  const path = pathForHubPage(next as HubPageName)
  if (window.location.pathname === path) return
  const state = { page: next }
  if (replace) {
    window.history.replaceState(state, '', path)
  } else {
    window.history.pushState(state, '', path)
  }
}

export function LearningModule() {
  const { user, logout } = useAuth()
  const [page, setPage] = useState<LearningPageName>(readInitialPage)
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null)
  const [profile, setProfile] = useState<LearningProfile | null>(null)
  const [activeSet, setActiveSet] = useState<LearningSet | null>(null)
  const [loading, setLoading] = useState(true)
  const [conquerInitialKingdomId, setConquerInitialKingdomId] = useState<string | null>(null)

  const activeHub = hubFromPage(page)

  const refresh = useCallback(async () => {
    const [{ profile: p }, { set }] = await Promise.all([
      learningApi.getProfile(),
      learningApi.activeSet(),
    ])
    setProfile(p)
    setActiveSet(set)
  }, [])

  useEffect(() => {
    refresh().finally(() => setLoading(false))
  }, [refresh])

  useEffect(() => {
    if (window.location.pathname === '/') {
      syncUrlForPage('my-world-hub', true)
    }
  }, [])

  useEffect(() => {
    const onPopState = () => {
      setPage(resolveHubPage(window.location.pathname))
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const go = useCallback((next: LearningPageName, sectionId?: string) => {
    if (sectionId) setActiveSectionId(sectionId)
    setPage(next)
    if (next === 'prep-game' || next === 'sentence-game' || next === 'training-hub') {
      syncUrlForPage('training-hub')
    } else {
      syncUrlForPage(next)
    }
  }, [])

  const switchHub = useCallback((hub: AppHub) => {
    if (hub === 'adventure') {
      setConquerInitialKingdomId(null)
    }
    const next = hubLandingPage(hub) as LearningPageName
    setPage(next)
    const path = pathForAppHub(hub)
    if (window.location.pathname !== path) {
      window.history.pushState({ page: next }, '', path)
    }
  }, [])

  const nav: LearningNav = { go }

  const isImmersive = IMMERSIVE_PAGES.includes(page)
  const isTrainingCamp = TRAINING_CAMP_PAGES.includes(page)

  return (
    <div
      className={`learning-app${isImmersive && page === 'conquer-planet' ? ' is-conquer-page' : ''}${page === 'my-world-hub' ? ' is-world-map-page' : ''}${page === 'six-races' ? ' is-six-races-page' : ''}${isTrainingCamp ? ' is-training-camp' : ''}${isImmersive ? ' is-immersive-page' : ''}`}
    >
      {!isTrainingCamp && (
        <FloatingNav
          active={activeHub}
          onChange={switchHub}
          onOpenGuide={() => go('six-races')}
          guideActive={page === 'six-races'}
        />
      )}
      <div className="lk-top-right-cluster">
        <div id="lw-top-actions-slot" className="lw-top-actions-slot" />
        {page !== 'my-world-hub' && (
          <AppUserBar
            userDisplayName={user?.displayName}
            profile={profile}
            onLogout={() => void logout()}
          />
        )}
      </div>

      <main className="learning-main">
        {loading ? (
          <p className="learning-status">加载中…</p>
        ) : (
          <>
            {page === 'my-world-hub' && (
              <ConquerProvider>
                <div className="lw-world-map-shell">
                  <WorldMapPage
                    profile={profile}
                    onRefresh={refresh}
                    onEnterKingdom={(kingdomId) => {
                      setConquerInitialKingdomId(kingdomId)
                      go('conquer-planet')
                    }}
                    onOpenCollection={() => go('init')}
                    onLogout={() => void logout()}
                  />
                </div>
              </ConquerProvider>
            )}
            {page === 'six-races' && <SixRacesPage nav={nav} />}
            {(page === 'training-hub' || page === 'prep-game' || page === 'sentence-game') && (
              <TrainingCampPage
                nav={nav}
                initialSection={trainingSectionFromPage(page) ?? 'spirit'}
              />
            )}
            {page === 'library' && <LibraryPickPage profile={profile} onChange={refresh} nav={nav} />}
            {page === 'plan' && (
              <PlanPage profile={profile} activeSet={activeSet} onChange={refresh} nav={nav} />
            )}
            {page === 'section' && activeSectionId && (
              <SectionPage sectionId={activeSectionId} nav={nav} />
            )}
            {page === 'assessment' && activeSectionId && (
              <AssessmentPage sectionId={activeSectionId} nav={nav} onPassed={refresh} />
            )}
            {page === 'standard' && <StandardLibraryPage />}
            {page === 'init' && <InitPage onDone={refresh} nav={nav} />}
            {page === 'conquer-planet' && (
              <div className="learning-embedded-game">
                <ConquerPlanetModule
                  embedded
                  shellMode
                  onBack={() => go('my-world-hub')}
                  initialKingdomId={conquerInitialKingdomId}
                  onInitialKingdomConsumed={() => setConquerInitialKingdomId(null)}
                />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
