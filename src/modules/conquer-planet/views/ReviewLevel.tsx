import { useEffect, useMemo, useState } from 'react'
import { fetchReviewLevel } from '../api'
import { LevelIntroModal } from '../components/LevelIntroModal'
import { buildReviewIntro } from '../data/levelIntro'
import { getLevelLearningProfile } from '../data/levelLearningMethods'
import { useConquer } from '../ConquerContext'
import { GameRunner, getLevelGameSpec, isLevelCleared, settleLevel } from '../games'
import type { PlanetLevel, PlanetWord } from '../types'

interface ReviewLevelProps {
  levelId: string
  onBack: () => void
}

type Phase = 'loading' | 'intro' | 'empty' | 'play' | 'done'

export function ReviewLevel({ levelId, onBack }: ReviewLevelProps) {
  const { setSession } = useConquer()
  const [level, setLevel] = useState<PlanetLevel | null>(null)
  const [queue, setQueue] = useState<PlanetWord[]>([])
  const [pool, setPool] = useState<PlanetWord[]>([])
  const [kept, setKept] = useState<string[]>([])
  const [deserted, setDeserted] = useState<string[]>([])
  const [loadError, setLoadError] = useState('')
  const [phase, setPhase] = useState<Phase>('loading')
  const [playError, setPlayError] = useState('')

  useEffect(() => {
    let cancelled = false

    fetchReviewLevel(levelId)
      .then((payload) => {
        if (cancelled) return
        setLevel(payload.level)
        setQueue(payload.queue)
        setPool(payload.distractorPool)
        if (payload.queue.length === 0) {
          setPhase('empty')
        } else {
          setPhase('intro')
        }
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : '加载失败')
      })

    return () => {
      cancelled = true
    }
  }, [levelId])

  const intro = useMemo(() => {
    if (!level || queue.length === 0) return null
    return buildReviewIntro(level, queue.length)
  }, [level, queue.length])

  const tag = (
    <span className="cp-level-tag">🌫️ {getLevelLearningProfile('review').nodeLabel}</span>
  )

  if (loadError) {
    return (
      <div className="cp-level-page">
        <p className="cp-level-empty">{loadError}</p>
        <button type="button" className="cp-btn" onClick={onBack}>返回地图</button>
      </div>
    )
  }

  if (phase === 'loading') return <p className="cp-level-empty">正在寻找走散的村民…</p>

  if (phase === 'empty') {
    return (
      <div className="cp-level-page">
        <div className="cp-level-topbar">
          <button type="button" className="cp-back" onClick={onBack}>← 返回</button>
          {tag}
        </div>
        <p className="cp-level-empty">
          军团还没有可复习的词汇，请先完成招募关卡再来。
        </p>
        <button type="button" className="cp-btn" onClick={onBack}>返回地图</button>
      </div>
    )
  }

  if (phase === 'done') {
    return (
      <div className="cp-level-page">
        <div className="cp-stage cp-stage--done">
          <p className="cp-done-title">🌫️ 复习结束</p>
          <p className="cp-stage-text">
            留住 {kept.length} 名老兵；
            {deserted.length > 0 ? ` 有 ${deserted.length} 名因长期遗忘而叛逃。` : ' 无人叛逃！'}
          </p>
          {deserted.length > 0 && (
            <div className="cp-candidate-row">
              {deserted.map((word) => (
                <span key={word} className="cp-villager cp-villager--left">{word}</span>
              ))}
            </div>
          )}
          <button type="button" className="cp-btn cp-btn--primary" onClick={onBack}>返回地图</button>
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
            spec={getLevelGameSpec('review')}
            context={{ words: queue, distractors: pool }}
            onExit={onBack}
            fallback={
              <div className="cp-stage">
                <p className="cp-level-empty">本关暂时无法生成复习题（词量不足）。</p>
                <button type="button" className="cp-btn" onClick={onBack}>返回地图</button>
              </div>
            }
            onLevelComplete={async (results) => {
              const spec = getLevelGameSpec('review')
              if (!isLevelCleared(spec, results)) {
                setPlayError('尚未通关：请全部认对后再提交。')
                return
              }
              setPlayError('')
              try {
                const outcome = await settleLevel('review', levelId, results)
                setSession(outcome.session)
                setKept(outcome.reviewed?.kept ?? [])
                setDeserted(outcome.reviewed?.deserted ?? [])
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
