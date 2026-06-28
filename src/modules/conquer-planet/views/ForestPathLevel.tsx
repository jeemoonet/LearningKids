import { useEffect, useMemo, useState } from 'react'
import { fetchForestLevel } from '../api'
import { LevelIntroModal } from '../components/LevelIntroModal'
import { buildForestIntro } from '../data/levelIntro'
import { getLevelLearningProfile } from '../data/levelLearningMethods'
import { useConquer } from '../ConquerContext'
import type { AdvVerbPair } from '../games/adv-verb-pair'
import { GameRunner, getLevelGameSpec, isLevelCleared, settleLevel, collectCorrectWords } from '../games'
import type { PlanetLevel } from '../types'

interface ForestPathLevelProps {
  levelId: string
  onBack: () => void
}

type Phase = 'loading' | 'intro' | 'empty' | 'play' | 'done'

export function ForestPathLevel({ levelId, onBack }: ForestPathLevelProps) {
  const { session, setSession } = useConquer()
  const [level, setLevel] = useState<PlanetLevel | null>(null)
  const [pairs, setPairs] = useState<AdvVerbPair[]>([])
  const [clearedVerbs, setClearedVerbs] = useState<string[]>([])
  const [loadError, setLoadError] = useState('')
  const [playError, setPlayError] = useState('')
  const [phase, setPhase] = useState<Phase>('loading')

  useEffect(() => {
    fetchForestLevel(levelId)
      .then((payload) => {
        setLevel(payload.level)
        setPairs(payload.pairs)
        setPhase(payload.pairs.length === 0 ? 'empty' : 'intro')
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : '加载失败'))
  }, [levelId])

  const intro = useMemo(() => {
    if (!level || pairs.length === 0) return null
    return buildForestIntro(level, pairs.length)
  }, [level, pairs.length])

  const gameContext = useMemo(
    () => ({
      words: [],
      distractors: session?.distractorPool?.filter((w) => w.partOfSpeech === 'adverb') ?? [],
      meta: { pairs },
    }),
    [pairs, session?.distractorPool],
  )

  const tag = (
    <span className="cp-level-tag">🌲 {getLevelLearningProfile('forest').nodeLabel}</span>
  )

  if (loadError) {
    return (
      <div className="cp-level-page">
        <p className="cp-level-empty">{loadError}</p>
        <button type="button" className="cp-btn" onClick={onBack}>返回地图</button>
      </div>
    )
  }

  if (phase === 'loading') return <p className="cp-level-empty">迷雾深处，动词猎手正在试探…</p>

  if (phase === 'empty') {
    return (
      <div className="cp-level-page">
        <div className="cp-level-topbar">
          <button type="button" className="cp-back" onClick={onBack}>← 返回</button>
          {tag}
        </div>
        <p className="cp-level-empty">暂无可用搭配题，请先完成招募关卡再来。</p>
        <button type="button" className="cp-btn" onClick={onBack}>返回地图</button>
      </div>
    )
  }

  if (phase === 'done') {
    return (
      <div className="cp-level-page">
        <div className="cp-stage cp-stage--done">
          <p className="cp-done-title">🌲 迷雾退散！</p>
          <p className="cp-stage-text">动词猎手让出了道路，成功配对 {clearedVerbs.length} 组动词：</p>
          <div className="cp-candidate-row">
            {clearedVerbs.map((verb) => (
              <span key={verb} className="cp-villager cp-villager--joined">{verb}</span>
            ))}
          </div>
          <button type="button" className="cp-btn" onClick={onBack}>返回地图</button>
        </div>
      </div>
    )
  }

  return (
    <>
      <LevelIntroModal
        open={phase === 'intro'}
        intro={intro!}
        eyebrow="迷林试炼"
        onConfirm={() => setPhase('play')}
      />

      {phase === 'play' && level && (
        <div className="cp-level-page">
          <div className="cp-level-topbar">
            <button type="button" className="cp-back" onClick={onBack}>← 返回</button>
            {tag}
          </div>
          {playError && <p className="cp-level-empty">{playError}</p>}
          <GameRunner
            spec={getLevelGameSpec('forest')}
            context={gameContext}
            onExit={onBack}
            onLevelComplete={async (results) => {
              if (!isLevelCleared(getLevelGameSpec('forest'), results)) {
                setPlayError('搭配未全部正确，请再试一次。')
                return
              }
              try {
                const outcome = await settleLevel('forest', levelId, results, { previousSession: session })
                setClearedVerbs(collectCorrectWords(results))
                setSession(outcome.session)
                setPhase('done')
              } catch (err) {
                setPlayError(err instanceof Error ? err.message : '保存失败')
              }
            }}
          />
        </div>
      )}
    </>
  )
}
