import { useEffect, useState } from 'react'
import type { LearningNav } from './LearningModule'
import { PrepGameModule } from '../prep-game/PrepGameModule'
import { SentenceGameModule } from '../sentence-game/SentenceGameModule'
import { TrainingCampNav } from './components/TrainingCampNav'
import {
  TRAINING_CAMP_SECTIONS,
  getTrainingSection,
  type TrainingSectionId,
} from './trainingCampSections'

type PrepCampView = 'levels' | 'detail' | 'challenge'

interface TrainingCampPageProps {
  nav: LearningNav
  initialSection?: TrainingSectionId
}

export function TrainingCampPage({ nav, initialSection = 'spirit' }: TrainingCampPageProps) {
  const [section, setSection] = useState<TrainingSectionId>(initialSection)
  const [prepView, setPrepView] = useState<PrepCampView>('levels')

  useEffect(() => {
    setSection(initialSection)
  }, [initialSection])

  useEffect(() => {
    setPrepView('levels')
  }, [section])

  const active = getTrainingSection(section)
  const isPrepSubView = active.module === 'prep' && prepView !== 'levels'

  return (
    <div className="tc-camp">
      <img
        className="tc-camp__bg"
        src="/assets/conquer-planet/world-map-bg.png"
        alt=""
        aria-hidden="true"
      />
      <span className="tc-camp__vignette" aria-hidden="true" />

      <aside className="tc-camp-sidebar">
        <button type="button" className="tc-camp-btn tc-camp-btn--world" onClick={() => nav.go('my-world-hub')}>
          ← 返回我的世界
        </button>
        <TrainingCampNav
          sections={TRAINING_CAMP_SECTIONS}
          active={section}
          onChange={setSection}
        />
      </aside>

      <div className="tc-camp-main">
        {!isPrepSubView && (
          <header className="tc-camp-section-head lw-mw-glass">
            <h1>{active.title}</h1>
            <p>{active.summary}</p>
          </header>
        )}

        <div className="tc-camp-section-body">
          {active.module === 'prep' && (
            <PrepGameModule embedded onViewChange={setPrepView} />
          )}
          {active.module === 'sentence' && (
            <SentenceGameModule
              embedded
              sectionKey={active.id as 'warrior' | 'magic' | 'formation'}
              title={active.title}
              description={active.description}
              tracks={active.tracks ?? []}
              showBoss={active.showBoss ?? false}
            />
          )}
        </div>
      </div>
    </div>
  )
}
