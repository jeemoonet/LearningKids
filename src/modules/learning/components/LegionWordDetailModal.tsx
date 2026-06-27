import { useEffect, type CSSProperties } from 'react'
import type { PartOfSpeech } from '../../word-hunter/domain/battle/battleTypes'
import type { PlanetSoldier } from '../../conquer-planet/types'
import { POS_RACE } from '../../conquer-planet/types'
import { RaceIcon } from '../../conquer-planet/components/RaceIcon'
import { speakEnglish, stopSpeaking, EXAMPLE_SPEECH_RATE } from '../../vocab-training/speak'

interface LegionWordDetailModalProps {
  soldier: PlanetSoldier
  race: PartOfSpeech
  power: number
  onClose: () => void
}

export function LegionWordDetailModal({
  soldier,
  race,
  power,
  onClose,
}: LegionWordDetailModalProps) {
  const raceMeta = POS_RACE[race]
  const exampleEn = soldier.exampleEn?.trim() ?? ''
  const exampleZh = soldier.exampleZh?.trim() ?? ''
  const phonetic = soldier.phonetic?.trim() ?? ''
  const posLabel = soldier.posLabel?.trim() ?? ''

  useEffect(() => {
    return () => stopSpeaking()
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="lw-legion-detail-overlay"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="lw-legion-detail"
        role="dialog"
        aria-label={`${soldier.word} 单词详情`}
        onClick={(e) => e.stopPropagation()}
        style={{ '--race-color': raceMeta.color } as CSSProperties}
      >
        <header className="lw-legion-detail__head">
          <div className="lw-legion-detail__race">
            <span className="lw-legion-detail__race-icon" aria-hidden="true">
              <RaceIcon pos={race} size={28} />
            </span>
            <span>{raceMeta.race}</span>
          </div>
          <button
            type="button"
            className="lw-wordbank-close"
            onClick={onClose}
            aria-label="关闭"
          >
            ×
          </button>
        </header>

        <div className="lw-legion-detail__word-row">
          <h3 className="lw-legion-detail__word">{soldier.word}</h3>
          <button
            type="button"
            className="lw-legion-detail__speak"
            onClick={() => speakEnglish(soldier.word)}
            aria-label="播放单词发音"
          >
            🔊 发音
          </button>
        </div>

        {phonetic && <p className="lw-legion-detail__phonetic">{phonetic}</p>}

        <div className="lw-legion-detail__meaning">
          <span className="lw-legion-detail__label">中文释义</span>
          <p>{soldier.meaning}</p>
          {posLabel && <span className="lw-legion-detail__pos-tag">{posLabel}</span>}
        </div>

        <div className="lw-legion-detail__stats">
          <span>战力 ⚔ {power}</span>
          <span>Lv{soldier.syllables}</span>
          <span title="经验值">
            {'★'.repeat(soldier.familiarity)}
            {'☆'.repeat(Math.max(0, 5 - soldier.familiarity))}
          </span>
        </div>

        {(exampleEn || exampleZh) && (
          <section className="lw-legion-detail__example">
            <span className="lw-legion-detail__label">例句</span>
            {exampleEn && (
              <div className="lw-legion-detail__example-row">
                <p className="lw-legion-detail__example-en">{exampleEn}</p>
                <button
                  type="button"
                  className="lw-legion-detail__speak lw-legion-detail__speak--small"
                  onClick={() => speakEnglish(exampleEn, EXAMPLE_SPEECH_RATE)}
                  aria-label="播放例句"
                >
                  🔊
                </button>
              </div>
            )}
            {exampleZh && (
              <p className="lw-legion-detail__example-zh">{exampleZh}</p>
            )}
          </section>
        )}

        {!exampleEn && !exampleZh && (
          <p className="lw-legion-detail__empty">暂无例句</p>
        )}
      </div>
    </div>
  )
}
