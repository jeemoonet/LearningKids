import { useCallback, useEffect, useState } from 'react'
import { BattleView } from '../../../word-hunter/views/BattleView'
import { useSessionStore } from '../../../word-hunter/sessionStore'
import { POS_SYNERGY } from '../../../word-hunter/domain/element/DamageResolver'
import { MonsterSprite } from '../../components/monsters/MonsterIllustrations'
import { buildBossBattleSession } from '../../domain/bossBattle'
import { POS_RACE, type BossLevelPayload } from '../../types'
import { useConquer } from '../../ConquerContext'
import type { GameProps } from '../types'
import '../../../word-hunter/styles/battle.css'
import '../../../word-hunter/styles/word-hunter.css'

/**
 * enemy-duel 的运行时上下文（重型对决，需由关卡准备好战斗数据）。
 * 关卡在调用 GameRunner 前 fetchBossLevel(levelId)，把结果放进 GameContext.meta。
 */
export interface EnemyDuelMeta {
  bossPayload: BossLevelPayload
  monsterId: string
  levelId: string
}

type Phase = 'intro' | 'battle' | 'lose'

/** 敌人对决：包装 Word Hunter 回合制战斗（拼写发射 + 认词闪避 + 词性克制） */
export function EnemyDuelGame({ context, onComplete, onExit }: GameProps) {
  const meta = context.meta as Partial<EnemyDuelMeta> | undefined
  const { setSession } = useConquer()
  const loadBossBattle = useSessionStore((s) => s.loadBossBattle)
  const prepareBattle = useSessionStore((s) => s.prepareBattle)
  const startBattle = useSessionStore((s) => s.startBattle)
  const resetBattle = useSessionStore((s) => s.resetBattle)
  const clear = useSessionStore((s) => s.clear)
  const [phase, setPhase] = useState<Phase>('intro')

  const monsterId = meta?.monsterId ?? context.monster?.id ?? 'mist-golem'

  useEffect(() => {
    if (!meta?.bossPayload || !meta.levelId) return
    const session = buildBossBattleSession(meta.bossPayload, monsterId)
    loadBossBattle({
      levelId: meta.levelId,
      level: session.level,
      words: session.words,
      ownedWordIds: session.ownedWordIds,
      wordMastery: session.wordMastery,
    })
  }, [meta?.bossPayload, meta?.levelId, monsterId, loadBossBattle])

  useEffect(() => () => clear(), [clear])

  useEffect(() => {
    useSessionStore.setState({ onPlanetSessionUpdate: setSession })
    return () => useSessionStore.setState({ onPlanetSessionUpdate: null })
  }, [setSession])

  useEffect(() => {
    if (phase === 'battle') {
      document.body.classList.add('cp-battle-immersive')
      return () => document.body.classList.remove('cp-battle-immersive')
    }
    document.body.classList.remove('cp-battle-immersive')
  }, [phase])

  /** 对决模式跳过战前完形填空，直接列队并开战 */
  const enterBattle = useCallback(() => {
    prepareBattle()
    startBattle()
    setPhase('battle')
  }, [prepareBattle, startBattle])

  const handleVictory = useCallback(() => {
    onComplete({
      cleared: true,
      correctWords: meta?.bossPayload?.rewardPreview.map((w) => w.word) ?? [],
      wrongWords: [],
    })
  }, [onComplete, meta])

  const handleDefeat = useCallback(() => setPhase('lose'), [])

  if (!meta?.bossPayload) {
    return <p className="cp-level-empty">对决数据未就绪（关卡需提供 bossPayload）。</p>
  }

  const level = meta.bossPayload.level
  const monsterPos = level.monsterPos ?? context.monster?.partOfSpeech ?? 'noun'
  const race = POS_RACE[monsterPos]
  const counterPos = POS_SYNERGY[monsterPos] ?? 'adjective'
  const counterRace = POS_RACE[counterPos]
  const monsterName = level.monsterName ?? '迷雾怪兽'

  if (phase === 'intro') {
    return (
      <div className="cp-level-page cp-boss-page">
        <div className="cp-stage cp-stage--intro">
          <div className="cp-boss-intro-art">
            <MonsterSprite id={monsterId} size={160} title={monsterName} />
          </div>
          <p className="cp-stage-text">
            一只 <strong>{monsterName}</strong> 盘踞城堡，它是
            <strong style={{ color: race.color }}> {race.race}</strong> 属性的怪兽。
          </p>
          <p className="cp-stage-hint">
            💡 闪避认词 → 缴获入匣 → 拼写发射击破封印。已入团的词答对还能提升熟悉度！
            <strong style={{ color: race.color }}>{race.race}</strong> 怪兽怕
            <strong>{counterRace.race}</strong>，相生 +20%，同性 -20%。
          </p>
          <div className="cp-spell-actions">
            <button type="button" className="cp-btn" onClick={onExit}>
              撤退
            </button>
            <button
              type="button"
              className="cp-btn cp-btn--primary"
              onClick={enterBattle}
            >
              开战
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'battle') {
    return (
      <div className="cp-boss-battle-wrap">
        <div className="cp-boss-battle-topbar-float">
          <button type="button" className="cp-back cp-back--overlay" onClick={onExit}>
            ← 撤退
          </button>
        </div>
        <BattleView embedded onVictory={handleVictory} onDefeat={handleDefeat} />
      </div>
    )
  }

  return (
    <div className="cp-level-page cp-boss-page">
      <div className="cp-stage cp-stage--done">
        <p className="cp-done-title cp-done-title--lose">💀 战败</p>
        <p className="cp-stage-text">别灰心，复习后再来挑战！</p>
        <div className="cp-spell-actions">
          <button
            type="button"
            className="cp-btn"
            onClick={() => onComplete({ cleared: false, correctWords: [], wrongWords: [] })}
          >
            放弃
          </button>
          <button
            type="button"
            className="cp-btn cp-btn--primary"
            onClick={() => {
              resetBattle()
              enterBattle()
            }}
          >
            再次挑战
          </button>
        </div>
      </div>
    </div>
  )
}
