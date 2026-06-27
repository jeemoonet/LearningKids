import { useEffect, useMemo, useState } from 'react'
import { fetchRecruitLevel } from '../api'
import { LevelIntroModal } from '../components/LevelIntroModal'
import { buildRecruitIntro } from '../data/levelIntro'
import { getLevelLearningProfile } from '../data/levelLearningMethods'
import { useConquer } from '../ConquerContext'
import { GameRunner, getLevelGameSpec, isLevelCleared, settleLevel } from '../games'
import type { PlanetLevel, PlanetWord } from '../types'

interface RecruitVillageLevelProps {
  levelId: string
  onBack: () => void
}

type Phase = 'loading' | 'intro' | 'play' | 'done' | 'empty'

export function RecruitVillageLevel({ levelId, onBack }: RecruitVillageLevelProps) {
  const { setSession } = useConquer()
  const [level, setLevel] = useState<PlanetLevel | null>(null)
  const [candidates, setCandidates] = useState<PlanetWord[]>([])
  const [pool, setPool] = useState<PlanetWord[]>([])
  const [recruited, setRecruited] = useState<string[]>([])
  const [loadError, setLoadError] = useState('')
  const [playError, setPlayError] = useState('')
  const [phase, setPhase] = useState<Phase>('loading')

  useEffect(() => {
    fetchRecruitLevel(levelId)
      .then((payload) => {
        setLevel(payload.level)
        setCandidates(payload.candidates)
        setPool(payload.distractorPool)
        setPhase(payload.candidates.length === 0 ? 'empty' : 'intro')
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : '加载失败'))
  }, [levelId])

  const intro = useMemo(() => {
    if (!level || candidates.length === 0) return null
    return buildRecruitIntro(level, candidates.length)
  }, [level, candidates.length])

  if (loadError) {
    return (
      <div className="cp-level-page">
        <p className="cp-level-empty">{loadError}</p>
        <button type="button" className="cp-btn" onClick={onBack}>返回地图</button>
      </div>
    )
  }

  if (phase === 'loading') {
    return <p className="cp-level-empty">正在召集村民…</p>
  }

  if (phase === 'empty') {
    return (
      <div className="cp-level-page">
        <p className="cp-level-empty">当前学习库中没有可用的练习词汇，请检查词库配置。</p>
        <button type="button" className="cp-btn" onClick={onBack}>返回地图</button>
      </div>
    )
  }

  if (phase === 'done') {
    return (
      <div className="cp-level-page">
        <div className="cp-stage cp-stage--done">
          <p className="cp-done-title">🎉 招募成功！</p>
          <p className="cp-stage-text">以下 {recruited.length} 名村民已加入你的军团：</p>
          <div className="cp-candidate-row">
            {recruited.map((word) => {
              const w = candidates.find((c) => c.word === word)
              return (
                <span key={word} className="cp-villager cp-villager--joined">
                  {word}
                  {w ? <em> {w.meaning}</em> : null}
                </span>
              )
            })}
          </div>
          <button type="button" className="cp-btn cp-btn--primary" onClick={onBack}>
            返回地图（战斗力 +{recruited.length}）
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
            <button type="button" className="cp-back" onClick={onBack}>← 撤退</button>
            <span className="cp-level-tag">🏘️ {getLevelLearningProfile('recruit').nodeLabel}</span>
          </div>
          {playError && <p className="cp-level-empty">{playError}</p>}
          <GameRunner
            spec={getLevelGameSpec('recruit')}
            context={{ words: candidates, distractors: pool }}
            onExit={onBack}
            fallback={
              <div className="cp-stage">
                <p className="cp-level-empty">本关暂时无法生成练习（词量不足）。</p>
                <button type="button" className="cp-btn" onClick={onBack}>返回地图</button>
              </div>
            }
            onLevelComplete={async (results) => {
              const spec = getLevelGameSpec('recruit')
              if (!isLevelCleared(spec, results)) {
                setPlayError('尚未通关：请完成全部认词与造句练习。')
                return
              }
              setPlayError('')
              try {
                const outcome = await settleLevel('recruit', levelId, results)
                setSession(outcome.session)
                setRecruited(outcome.recruited ?? [])
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
