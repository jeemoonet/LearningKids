import { useEffect, useMemo, useState } from 'react'
import { fetchReadingLevel } from '../api'
import { LevelIntroModal } from '../components/LevelIntroModal'
import { buildReadingIntro } from '../data/levelIntro'
import { getLevelLearningProfile } from '../data/levelLearningMethods'
import { useConquer } from '../ConquerContext'
import { GameRunner, getLevelGameSpec, isLevelCleared, settleLevel } from '../games'
import type { PlanetLevel, PlanetWord } from '../types'

interface ReadingLevelProps {
  levelId: string
  onBack: () => void
}

type Phase = 'loading' | 'intro' | 'empty' | 'play' | 'done'

export function ReadingLevel({ levelId, onBack }: ReadingLevelProps) {
  const { session, setSession } = useConquer()
  const [level, setLevel] = useState<PlanetLevel | null>(null)
  const [wordPool, setWordPool] = useState<PlanetWord[]>([])
  const [pool, setPool] = useState<PlanetWord[]>([])
  const [practicedWords, setPracticedWords] = useState<string[]>([])
  const [loadError, setLoadError] = useState('')
  const [playError, setPlayError] = useState('')
  const [phase, setPhase] = useState<Phase>('loading')

  useEffect(() => {
    fetchReadingLevel(levelId)
      .then((payload) => {
        setLevel(payload.level)
        setWordPool(payload.wordPool)
        setPool(payload.distractorPool)
        setPhase(payload.wordPool.length < 5 ? 'empty' : 'intro')
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : '加载失败'))
  }, [levelId])

  const intro = useMemo(() => {
    if (!level || wordPool.length < 5) return null
    return buildReadingIntro(level, wordPool.length)
  }, [level, wordPool.length])

  const tag = (
    <span className="cp-level-tag">📖 {getLevelLearningProfile('reading').nodeLabel}</span>
  )

  if (loadError) {
    return (
      <div className="cp-level-page">
        <p className="cp-level-empty">{loadError}</p>
        <button type="button" className="cp-btn" onClick={onBack}>返回地图</button>
      </div>
    )
  }

  if (phase === 'loading') return <p className="cp-level-empty">正在准备阅读材料…</p>

  if (phase === 'empty') {
    return (
      <div className="cp-level-page">
        <div className="cp-level-topbar">
          <button type="button" className="cp-back" onClick={onBack}>← 返回</button>
          {tag}
        </div>
        <p className="cp-level-empty">
          当前学习单词不足 5 个，无法生成阅读短文。请先完成招募关卡或导入单词本。
        </p>
        <button type="button" className="cp-btn" onClick={onBack}>返回地图</button>
      </div>
    )
  }

  if (phase === 'done') {
    return (
      <div className="cp-level-page">
        <div className="cp-stage cp-stage--done">
          <p className="cp-done-title">📖 阅读通过！</p>
          <p className="cp-stage-text">
            你完成了阅读挑战，巩固了 {practicedWords.length} 个学习单词的语境理解。
          </p>
          <button type="button" className="cp-btn cp-btn--primary" onClick={onBack}>
            返回地图
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="cp-level-page">
      {intro && (
        <LevelIntroModal
          open={phase === 'intro'}
          intro={intro}
          onConfirm={() => setPhase('play')}
        />
      )}

      {phase === 'play' && (
        <>
          <div className="cp-level-topbar">
            <button type="button" className="cp-back" onClick={onBack}>← 返回</button>
            {tag}
          </div>
          {playError && <p className="cp-level-empty">{playError}</p>}
          <GameRunner
            spec={getLevelGameSpec('reading')}
            context={{ words: wordPool, distractors: pool }}
            onExit={onBack}
            fallback={
              <div className="cp-stage">
                <p className="cp-level-empty">本关暂时无法生成阅读材料（词量不足）。</p>
                <button type="button" className="cp-btn" onClick={onBack}>返回地图</button>
              </div>
            }
            onLevelComplete={async (results) => {
              const spec = getLevelGameSpec('reading')
              if (!isLevelCleared(spec, results)) {
                setPlayError('尚未通关：请答对至少 2 道选择题。')
                return
              }
              setPlayError('')
              try {
                const outcome = await settleLevel('reading', levelId, results, {
                  previousSession: session,
                })
                setSession(outcome.session)
                setPracticedWords(outcome.practicedWords ?? [])
                setPhase('done')
              } catch (err) {
                setLoadError(err instanceof Error ? err.message : '提交失败')
              }
            }}
          />
        </>
      )}
    </div>
  )
}
