import { GAMEPLAY_HOOK, GAMEPLAY_STEPS, GAMEPLAY_TIPS } from '../data/gameplayGuideData'

export function GameplayGuidePanel() {
  return (
    <section className="lw-gameplay-guide" aria-label="游戏玩法介绍">
      <p className="lw-gameplay-guide__hook">{GAMEPLAY_HOOK}</p>

      <ol className="lw-gameplay-guide__steps">
        {GAMEPLAY_STEPS.map((step, index) => (
          <li key={step.title} className="lw-gameplay-guide__step">
            <span className="lw-gameplay-guide__step-num" aria-hidden="true">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className="lw-gameplay-guide__step-icon" aria-hidden="true">
              {step.icon}
            </span>
            <div className="lw-gameplay-guide__step-body">
              <h2 className="lw-gameplay-guide__step-title">{step.title}</h2>
              <p className="lw-gameplay-guide__step-summary">{step.summary}</p>
              <p className="lw-gameplay-guide__step-detail">{step.detail}</p>
            </div>
          </li>
        ))}
      </ol>

      <footer className="lw-gameplay-guide__foot">
        <p className="lw-gameplay-guide__foot-title">远征小贴士</p>
        <ul className="lw-gameplay-guide__tips">
          {GAMEPLAY_TIPS.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </footer>
    </section>
  )
}
