import type { TrainingCampSection, TrainingSectionId } from '../trainingCampSections'

interface TrainingCampNavProps {
  sections: TrainingCampSection[]
  active: TrainingSectionId
  onChange: (id: TrainingSectionId) => void
}

export function TrainingCampNav({ sections, active, onChange }: TrainingCampNavProps) {
  return (
    <nav className="lk-float-nav tc-camp-nav" aria-label="训练营主导航">
      {sections.map((section) => (
        <button
          key={section.id}
          type="button"
          className={`lk-float-nav__item${active === section.id ? ' is-active' : ''}`}
          onClick={() => onChange(section.id)}
          title={section.summary}
        >
          <span className="lk-float-nav__icon" aria-hidden="true">
            {section.icon}
          </span>
          <span className="lk-float-nav__label">{section.label}</span>
        </button>
      ))}
    </nav>
  )
}
