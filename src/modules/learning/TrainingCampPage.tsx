import { useEffect, useState } from 'react'
import { PrepGameModule } from '../prep-game/PrepGameModule'
import { SentenceGameModule } from '../sentence-game/SentenceGameModule'
import { PlanetBrandLogo } from './components/PlanetBrandLogo'
import { TrainingCampNav } from './components/TrainingCampNav'
import {
  TRAINING_CAMP_SECTIONS,
  getTrainingSection,
  type TrainingSectionId,
} from './trainingCampSections'
import { WorldMapBackground } from './components/WorldMapBackground'

type PrepCampView = 'levels' | 'detail' | 'challenge'
type SentenceCampView = 'levels' | 'detail' | 'match-detail' | 'challenge' | 'warrior-match'

interface TrainingCampPageProps {
  initialSection?: TrainingSectionId
  onBackToWorld?: () => void
}

export function TrainingCampPage({ initialSection = 'spirit', onBackToWorld }: TrainingCampPageProps) {
  const [section, setSection] = useState<TrainingSectionId>(initialSection)
  const [prepView, setPrepView] = useState<PrepCampView>('levels')
  const [sentenceView, setSentenceView] = useState<SentenceCampView>('levels')

  useEffect(() => {
    setSection(initialSection)
  }, [initialSection])

  useEffect(() => {
    setPrepView('levels')
    setSentenceView('levels')
  }, [section])

  const active = getTrainingSection(section)
  const isPrepSubView = active.module === 'prep' && prepView !== 'levels'
  const isSentenceSubView = active.module === 'sentence' && sentenceView !== 'levels'
  const hideSectionHead = isPrepSubView || isSentenceSubView

  return (
    <div className="tc-camp">
      <WorldMapBackground />

      <div className="tc-camp-brand">
        <PlanetBrandLogo onClick={onBackToWorld} />
      </div>

      {!hideSectionHead && (
        <header className="tc-camp-section-head">
          <h1>{active.title}</h1>
          <p>{active.summary}</p>
        </header>
      )}

      <aside className="tc-camp-sidebar">
        <TrainingCampNav
          sections={TRAINING_CAMP_SECTIONS}
          active={section}
          onChange={setSection}
        />
      </aside>

      <div className={`tc-camp-main${hideSectionHead ? ' tc-camp-main--immersive' : ''}`}>
        <div className="tc-camp-section-body">
          {active.module === 'prep' && (
            <PrepGameModule key={active.id} embedded onViewChange={setPrepView} />
          )}
          {active.module === 'sentence' && (
            <SentenceGameModule
              key={active.id}
              embedded
              sectionKey={active.id as 'warrior' | 'magic' | 'formation'}
              title={active.title}
              description={active.description}
              tracks={active.tracks ?? []}
              showBoss={active.showBoss ?? false}
              onViewChange={setSentenceView}
            />
          )}
        </div>
      </div>
    </div>
  )
}
