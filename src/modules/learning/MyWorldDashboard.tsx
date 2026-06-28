import { useEffect, useMemo, useState } from 'react'
import { learningApi, type LearningLibrary, type LearningProfile, type PeerLearner } from './api'
import { migrateGrammarProgressOnce } from './migrateGrammarProgress'
import { useConquer } from '../conquer-planet/ConquerContext'
import { MyWorldKingdomOverview } from './components/MyWorldKingdomOverview'
import { MyWorldRightRail } from './components/MyWorldRightRail'
import {
  needsRecruitOnboarding,
  RecruitArmyOnboardingModal,
} from './components/RecruitArmyOnboardingModal'
import { WorldMapBackground } from './components/WorldMapBackground'

export interface MyWorldDashboardProps {
  profile: LearningProfile | null
  onEnterKingdom: (kingdomId: string) => void
  onOpenCollection: () => void
  onRefresh: () => Promise<void>
}

type ExpandKey = 'quests' | 'fellows' | 'achievements' | null

const KINGDOM_TOTAL = 7
const RANK_MEDALS = ['🥇', '🥈', '🥉']

function fellowRankLabel(rank: number): string {
  return RANK_MEDALS[rank - 1] ?? String(rank)
}

function FellowRow({
  fellow,
  rank,
  isMe = false,
}: {
  fellow: PeerLearner
  rank: number
  isMe?: boolean
}) {
  return (
    <li className={`lw-mw-fellow${isMe ? ' is-me' : ''}`}>
      <span className="lw-mw-fellow__rank" aria-hidden="true">
        {fellowRankLabel(rank)}
      </span>
      <span className="lw-mw-fellow__portrait">
        <span className="lw-mw-fellow__face" aria-hidden="true">{fellow.avatar}</span>
        {fellow.online && <span className="lw-mw-fellow__online" title="在线" />}
        <span className="lw-mw-fellow__lv">{fellow.level}</span>
      </span>
      <span className="lw-mw-fellow__info">
        <span className="lw-mw-fellow__name">
          {fellow.displayName}
          {isMe && <span className="lw-mw-fellow__me-tag">我</span>}
        </span>
        <span className="lw-mw-fellow__meta">
          Lv.{fellow.level} {fellow.levelTitle}
        </span>
        <span className="lw-mw-fellow__meta">
          {fellow.currentKingdomName || '尚未开始'} · ⚔️{fellow.combatPower} ✨{fellow.magicPower} · {fellow.knownCount} 词
        </span>
        <span
          className="lw-mw-fellow__flags"
          aria-label={`已征服 ${fellow.conqueredKingdoms} / ${fellow.kingdomTotal} 国`}
        >
          {Array.from({ length: fellow.kingdomTotal }).map((_, i) => (
            <span
              key={i}
              className={`lw-mw-flag${i < fellow.conqueredKingdoms ? ' is-won' : ''}`}
              aria-hidden="true"
            >
              {i < fellow.conqueredKingdoms ? '🚩' : '·'}
            </span>
          ))}
        </span>
      </span>
      <span className="lw-mw-fellow__count">
        {fellow.conqueredKingdoms}/{fellow.kingdomTotal}
      </span>
    </li>
  )
}

/**
 * 「我的世界」个人成长基地 · 沉浸式羊皮纸 HUD。
 * 右上：统一命令面板（资料 + 军团 / 目标 / 任务 / 小伙伴 / 成就墙）。
 * 中央展示七王国全景（未解锁可见），选中王国可查看详情并进入。
 */
export function MyWorldDashboard({
  profile,
  onEnterKingdom,
  onOpenCollection,
  onRefresh,
}: MyWorldDashboardProps) {
  const { session, loading, refresh: refreshConquer } = useConquer()
  const [expanded, setExpanded] = useState<ExpandKey>(null)
  const [libraries, setLibraries] = useState<LearningLibrary[]>([])
  const [peerBoard, setPeerBoard] = useState<{ self: PeerLearner; selfRank: number; peers: PeerLearner[] } | null>(null)
  const [peersLoading, setPeersLoading] = useState(true)
  const [onboardOpen, setOnboardOpen] = useState(false)
  const [onboardDismissed, setOnboardDismissed] = useState(false)

  useEffect(() => {
    learningApi
      .listLibraries()
      .then(({ libraries: list }) => setLibraries(list))
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    setPeersLoading(true)
    learningApi
      .listPeers()
      .then((board) => setPeerBoard(board))
      .catch(() => setPeerBoard(null))
      .finally(() => setPeersLoading(false))
  }, [])

  useEffect(() => {
    void migrateGrammarProgressOnce().catch(() => undefined)
  }, [])

  useEffect(() => {
    if (!profile || onboardDismissed) return
    if (needsRecruitOnboarding(profile)) {
      setOnboardOpen(true)
    }
  }, [profile, onboardDismissed])

  // 正在征服的王国（用于引导弹窗等）
  const currentKingdom = useMemo(() => {
    if (!session) return null
    return session.kingdoms.find((k) => k.status === 'current') ?? session.kingdoms[0] ?? null
  }, [session])

  const todayQuests = [
    { id: 'q1', icon: '📖', text: '攻读「第 3 小节」12 个新词', reward: '+60', done: false },
    { id: 'q2', icon: '🔁', text: '复习昨日 8 个易错词', reward: '+30', done: false },
    { id: 'q3', icon: '⚔️', text: '在征服星球赢下 1 场战斗', reward: '+50', done: true },
  ]
  const questsLeft = todayQuests.filter((q) => !q.done).length

  const peers = peerBoard?.peers ?? []
  const selfPeer = peerBoard?.self ?? null
  const selfRank = peerBoard?.selfRank ?? 0
  const kingdomTotal = selfPeer?.kingdomTotal ?? peers[0]?.kingdomTotal ?? session?.kingdoms.length ?? KINGDOM_TOTAL

  const achievements = [
    { id: 'a1', icon: '🏅', label: '初识百词', unlocked: true },
    { id: 'a2', icon: '🔥', label: '连续 5 天', unlocked: true },
    { id: 'a3', icon: '🧩', label: '拼写达人', unlocked: true },
    { id: 'a4', icon: '🗡️', label: '首胜王国', unlocked: true },
    { id: 'a5', icon: '🌟', label: '满分测评', unlocked: false },
    { id: 'a6', icon: '🔒', label: '神秘成就', unlocked: false },
  ]
  const unlockedCount = achievements.filter((a) => a.unlocked).length

  const renderExpanded = () => {
    if (expanded === 'quests') {
      return (
        <ul className="lw-mw-quests">
          {todayQuests.map((q) => (
            <li key={q.id} className={`lw-mw-quest${q.done ? ' is-done' : ''}`}>
              <span className="lw-mw-quest__check" aria-hidden="true">
                {q.done ? '✓' : q.icon}
              </span>
              <span className="lw-mw-quest__text">{q.text}</span>
              <span className="lw-mw-quest__reward">{q.reward}</span>
            </li>
          ))}
        </ul>
      )
    }
    if (expanded === 'fellows') {
      if (peersLoading) {
        return <p className="lw-mw-lib-msg">正在加载小伙伴数据…</p>
      }
      if (!selfPeer) {
        return <p className="lw-mw-lib-msg">加载失败，请稍后重试</p>
      }
      return (
        <ul className="lw-mw-fellow-list">
          <FellowRow fellow={selfPeer} rank={selfRank} isMe />
          {peers.length > 0 ? (
            <>
              <li className="lw-mw-fellow-divider" aria-hidden="true">
                <span>小伙伴排行</span>
              </li>
              {peers.map((fellow, idx) => (
                <FellowRow key={fellow.userId} fellow={fellow} rank={idx + 1} />
              ))}
            </>
          ) : (
            <li className="lw-mw-fellow-empty">暂无其他学员，邀请同学一起征服星球吧！</li>
          )}
        </ul>
      )
    }
    if (expanded === 'achievements') {
      return (
        <ul className="lw-mw-medals">
          {achievements.map((badge) => (
            <li key={badge.id} className={`lw-mw-medal${badge.unlocked ? '' : ' is-locked'}`}>
              <span className="lw-mw-medal__icon" aria-hidden="true">{badge.icon}</span>
              <span className="lw-mw-medal__label">{badge.label}</span>
            </li>
          ))}
        </ul>
      )
    }
    return null
  }

  const sheetTitle =
    expanded === 'quests'
      ? '📜 今日任务'
      : expanded === 'fellows'
        ? '🤝 我的小伙伴'
        : '🏆 成就墙'

  const enterCurrent = () => {
    if (currentKingdom) onEnterKingdom(currentKingdom.id)
  }

  const fellowsSummary = peersLoading
    ? '加载中…'
    : !selfPeer
      ? '加载失败'
      : peers.length === 0
        ? `我 · ${selfPeer.conqueredKingdoms}/${kingdomTotal} 国`
        : `${peers.length + 1} 位 · 我第 ${selfRank}`

  const sideRail = (
    <>
      <button
        type="button"
        className="lw-mw-glass lw-mw-chip"
        onClick={() => setExpanded('quests')}
      >
        <span className="lw-mw-chip__icon" aria-hidden="true">📜</span>
        <span className="lw-mw-chip__body">
          <span className="lw-mw-chip__title">今日任务</span>
          <span className="lw-mw-chip__summary">{questsLeft} 个待完成</span>
        </span>
      </button>

      <button
        type="button"
        className="lw-mw-glass lw-mw-chip"
        onClick={() => setExpanded('fellows')}
      >
        <span className="lw-mw-chip__icon" aria-hidden="true">🤝</span>
        <span className="lw-mw-chip__body">
          <span className="lw-mw-chip__title">我的小伙伴</span>
          <span className="lw-mw-chip__summary">{fellowsSummary}</span>
        </span>
        <span className="lw-mw-chip__avatars" aria-hidden="true">
          {(selfPeer ? [selfPeer, ...peers] : peers).slice(0, 3).map((f) => (
            <span key={f.userId} className="lw-mw-chip__mini">{f.avatar}</span>
          ))}
        </span>
      </button>

      <button
        type="button"
        className="lw-mw-glass lw-mw-chip"
        onClick={() => setExpanded('achievements')}
      >
        <span className="lw-mw-chip__icon" aria-hidden="true">🏆</span>
        <span className="lw-mw-chip__body">
          <span className="lw-mw-chip__title">成就墙</span>
          <span className="lw-mw-chip__summary">已点亮 {unlockedCount}/{achievements.length}</span>
        </span>
      </button>
    </>
  )

  return (
    <div className="lw-mw">
      <WorldMapBackground />

      <div className="lw-mw-hud lw-mw-hud--map-focus">
        <header className="lw-mw-head">
          <div id="lw-top-actions-slot" className="lw-mw-head__slot" />
        </header>
        <div className="lw-mw-center">
          <MyWorldKingdomOverview
            kingdoms={session?.kingdoms ?? []}
            loading={loading}
            onEnterKingdom={onEnterKingdom}
          />
        </div>
      </div>

      <MyWorldRightRail>{sideRail}</MyWorldRightRail>

      {/* 展开浮层 */}
      {expanded && (
        <div
          className="lw-mw-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => setExpanded(null)}
        >
          <div className="lw-mw-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="lw-mw-sheet__head">
              <h2 className="lw-mw-sheet__title">{sheetTitle}</h2>
              <div className="lw-mw-sheet__tools">
                {expanded === 'achievements' && (
                  <button
                    type="button"
                    className="lw-mw-link-btn"
                    onClick={() => {
                      setExpanded(null)
                      onOpenCollection()
                    }}
                  >
                    词汇收藏册 →
                  </button>
                )}
                <button
                  type="button"
                  className="lw-mw-sheet__close"
                  onClick={() => setExpanded(null)}
                  aria-label="关闭"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="lw-mw-sheet__body">{renderExpanded()}</div>
          </div>
        </div>
      )}

      {/* 新用户：招募军队引导 */}
      {onboardOpen && (
        <RecruitArmyOnboardingModal
          open={onboardOpen}
          profile={profile}
          libraries={libraries}
          kingdomName={currentKingdom?.name}
          onRefresh={async () => {
            await onRefresh()
            await refreshConquer()
          }}
          onEnterAdventure={() => {
            setOnboardOpen(false)
            setOnboardDismissed(true)
            enterCurrent()
          }}
          onClose={() => {
            setOnboardOpen(false)
            setOnboardDismissed(true)
          }}
        />
      )}
    </div>
  )
}
