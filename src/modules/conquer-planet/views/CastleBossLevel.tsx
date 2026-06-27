import { useEffect, useMemo, useState } from 'react'
import { fetchBossLevel } from '../api'
import { LevelIntroModal } from '../components/LevelIntroModal'
import { buildBossIntro } from '../data/levelIntro'
import { getLevelLearningProfile } from '../data/levelLearningMethods'
import { useConquer } from '../ConquerContext'
import { GameRunner, getLevelGameSpec, settleLevel } from '../games'
import type { BossLevelPayload, PlanetWord } from '../types'
import '../../word-hunter/styles/battle.css'
import '../../word-hunter/styles/word-hunter.css'

interface CastleBossLevelProps {
  levelId: string
  monsterId?: string
  monsterName?: string
  onBack: () => void
}

type Phase = 'loading' | 'intro' | 'play' | 'win'

export function CastleBossLevel({
  levelId,
  monsterId = 'mist-golem',
  monsterName = '迷雾石像',
  onBack,
}: CastleBossLevelProps) {
  const { setSession } = useConquer()
  const [payload, setPayload] = useState<BossLevelPayload | null>(null)
  const [rewards, setRewards] = useState<PlanetWord[]>([])
  const [loadError, setLoadError] = useState('')
  const [phase, setPhase] = useState<Phase>('loading')

  useEffect(() => {
    setPhase('loading')
    setLoadError('')
    fetchBossLevel(levelId)
      .then((data) => {
        setPayload(data)
        setRewards(data.rewardPreview)
        setPhase('intro')
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : '加载失败'))
  }, [levelId])

  const intro = useMemo(() => {
    if (!payload) return null
    return buildBossIntro(payload.level, monsterName, payload.army.length)
  }, [payload, monsterName])

  if (loadError) {
    return (
      <div className="cp-level-page">
        <p className="cp-level-empty">{loadError}</p>
        <button type="button" className="cp-btn" onClick={onBack}>返回地图</button>
      </div>
    )
  }

  if (phase === 'loading' || !payload) {
    return <p className="cp-level-empty">正在进入城堡…</p>
  }

  if (phase === 'win') {
    return (
      <div className="cp-level-page cp-boss-page">
        <div className="cp-stage cp-stage--done">
          <p className="cp-done-title">⚔️ 城堡攻陷！</p>
          <p className="cp-stage-text">收编守军 {rewards.length} 名：</p>
          <div className="cp-candidate-row">
            {rewards.map((w) => (
              <span key={w.id} className="cp-villager cp-villager--joined">
                {w.word} <em>{w.meaning}</em>
              </span>
            ))}
          </div>
          <button type="button" className="cp-btn cp-btn--primary" onClick={onBack}>返回地图</button>
        </div>
      </div>
    )
  }

  return (
    <div className="cp-level-page cp-boss-page">
      {intro && (
        <LevelIntroModal
          open={phase === 'intro'}
          intro={intro}
          onConfirm={() => setPhase('play')}
        />
      )}

      {phase === 'play' && (
        <GameRunner
          spec={getLevelGameSpec('boss')}
          context={{
            words: payload.rewardPreview,
            distractors: payload.distractorPool,
            monster: { id: monsterId, partOfSpeech: payload.level.monsterPos ?? 'noun' },
            meta: { bossPayload: payload, monsterId, levelId },
          }}
          onExit={onBack}
          fallback={
            <div className="cp-level-page">
              <div className="cp-level-topbar">
                <button type="button" className="cp-back" onClick={onBack}>← 撤退</button>
                <span className="cp-level-tag">🏰 {getLevelLearningProfile('boss').nodeLabel}</span>
              </div>
              <p className="cp-level-empty">对决数据未就绪，请稍后重试。</p>
            </div>
          }
          onLevelComplete={async (results) => {
            if (results.some((r) => r.cleared)) {
              try {
                const outcome = await settleLevel('boss', levelId, results)
                setSession(outcome.session)
                setPhase('win')
              } catch (err) {
                setLoadError(err instanceof Error ? err.message : '结算失败')
              }
            } else {
              onBack()
            }
          }}
        />
      )}
    </div>
  )
}
