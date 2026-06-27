import { useCallback, useEffect, useState } from 'react'
import { KINGDOM_GUIDES } from '../data/kingdomGuideData'
import { ParchmentMapScene } from '../../conquer-planet/components/ParchmentMapScene'
import { getKingdomMapImage } from '../../conquer-planet/components/ImageKingdomMapScene'

export function KingdomGuidePanel() {
  const [index, setIndex] = useState(0)
  const total = KINGDOM_GUIDES.length
  const kingdom = KINGDOM_GUIDES[index]
  const mapImage = getKingdomMapImage(kingdom.id)

  const goPrev = useCallback(() => setIndex((i) => (i - 1 + total) % total), [total])
  const goNext = useCallback(() => setIndex((i) => (i + 1) % total), [total])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev()
      else if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goPrev, goNext])

  return (
    <section className="lw-kingdom-stage" aria-roledescription="carousel" aria-label="七大王国介绍">
      <div className="lw-kingdom-stage__map" aria-hidden="true">
        {mapImage ? (
          <img src={mapImage} alt="" className="lw-kingdom-stage__img" />
        ) : (
          <ParchmentMapScene
            pathD=""
            kingdomName={kingdom.name}
            monsterName={kingdom.monster}
            immersive
          />
        )}
      </div>
      <div className="lw-kingdom-stage__scrim" aria-hidden="true" />

      <button
        type="button"
        className="lw-kingdom-stage__nav lw-kingdom-stage__nav--prev"
        onClick={goPrev}
        aria-label="上一个王国"
      >
        ‹
      </button>
      <button
        type="button"
        className="lw-kingdom-stage__nav lw-kingdom-stage__nav--next"
        onClick={goNext}
        aria-label="下一个王国"
      >
        ›
      </button>

      <div className="lw-kingdom-stage__info" aria-live="polite">
        <div className="lw-kingdom-stage__badges">
          <span className="lw-kingdom-stage__count">王国 {kingdom.order} / {total}</span>
          <span className="lw-kingdom-stage__region">{kingdom.region}</span>
          <span className="lw-kingdom-stage__diff">{kingdom.difficulty}</span>
        </div>

        <h2 className="lw-kingdom-stage__name">
          <span className="lw-kingdom-stage__emoji" aria-hidden="true">{kingdom.icon}</span>
          {kingdom.name}
        </h2>
        <p className="lw-kingdom-stage__subtitle">{kingdom.subtitle}</p>

        <dl className="lw-kingdom-stage__facts">
          <div>
            <dt>玩法</dt>
            <dd>{kingdom.focus}</dd>
          </div>
          <div>
            <dt>守关</dt>
            <dd>{kingdom.monster}</dd>
          </div>
          <div>
            <dt>攻略</dt>
            <dd>{kingdom.tip}</dd>
          </div>
        </dl>
      </div>

      <div className="lw-kingdom-stage__dots" role="tablist" aria-label="选择王国">
        {KINGDOM_GUIDES.map((k, i) => (
          <button
            key={k.id}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`第 ${i + 1} 个王国：${k.name}`}
            className={`lw-kingdom-stage__dot${i === index ? ' is-active' : ''}`}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>
    </section>
  )
}
