import { useEffect, useMemo, useState } from 'react'
import { learningApi, type LearningLibrary, type LearningProfile } from './api'
import { useConquer } from '../conquer-planet/ConquerContext'
import { getKingdomMapImage } from '../conquer-planet/components/ImageKingdomMapScene'
import { WordBankFloatPanel } from './components/WordBankFloatPanel'
import { formatLearningMethodsSummary, levelKindShortLabel } from '../conquer-planet/data/levelLearningMethods'
import { SIX_RACES, type PlanetLevel } from '../conquer-planet/types'

export interface MyWorldDashboardProps {
  profile: LearningProfile | null
  onEnterKingdom: (kingdomId: string) => void
  onOpenCollection: () => void
  onRefresh: () => Promise<void>
  onLogout: () => void
}

type ExpandKey = 'quests' | 'fellows' | 'achievements' | null

const KINGDOM_TOTAL = 7
const RANK_MEDALS = ['🥇', '🥈', '🥉']

function levelKindLabel(kind: PlanetLevel['kind']): string {
  return levelKindShortLabel(kind)
}

function levelMethodLabel(kind: PlanetLevel['kind']): string {
  return formatLearningMethodsSummary(kind)
}

/**
 * 「我的世界」个人成长基地 · 沉浸式羊皮纸 HUD。
 * 右上为英雄铭牌（替代用户名）+ 我的军团 / 征服目标按钮；左上为远征罗盘；
 * 中央展示「正在征服的王国」（左进展 / 右地图，点击进入）。
 */
export function MyWorldDashboard({
  profile,
  onEnterKingdom,
  onOpenCollection,
  onRefresh,
  onLogout,
}: MyWorldDashboardProps) {
  const { session, loading, refresh: refreshConquer } = useConquer()
  const [expanded, setExpanded] = useState<ExpandKey>(null)
  const [legionOpen, setLegionOpen] = useState(false)
  const [targetOpen, setTargetOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [libraries, setLibraries] = useState<LearningLibrary[]>([])
  const [targetBusy, setTargetBusy] = useState(false)
  const [targetMsg, setTargetMsg] = useState('')

  useEffect(() => {
    learningApi
      .listLibraries()
      .then(({ libraries: list }) => setLibraries(list))
      .catch(() => undefined)
  }, [])

  // 正在征服的王国（无 current 时回退到第一个王国）
  const currentKingdom = useMemo(() => {
    if (!session) return null
    return session.kingdoms.find((k) => k.status === 'current') ?? session.kingdoms[0] ?? null
  }, [session])

  const kingdomMap = currentKingdom ? getKingdomMapImage(currentKingdom.id) : null
  const kingdomPercent = currentKingdom && currentKingdom.levelsTotal > 0
    ? Math.round((currentKingdom.levelsDone / currentKingdom.levelsTotal) * 100)
    : 0
  const nextLevelIdx = currentKingdom
    ? currentKingdom.levels.findIndex((lv) => !lv.done)
    : -1

  const legionCount = session?.armySize ?? profile?.knownCount ?? 0
  const raceCount = useMemo(() => {
    if (!session) return 0
    const present = new Set<string>()
    for (const soldier of session.soldiers) {
      if (SIX_RACES.includes(soldier.partOfSpeech as (typeof SIX_RACES)[number])) {
        present.add(soldier.partOfSpeech)
      }
    }
    return present.size
  }, [session])

  // ---- 占位数据（后续接入真实接口） ----
  const heroName = profile?.displayName?.trim() || '小小冒险家'
  const heroTitle = '词汇见习骑士'
  const heroLevel = 7
  const xpCurrent = 320
  const xpMax = 500
  const xpPercent = Math.round((xpCurrent / xpMax) * 100)

  const todayQuests = [
    { id: 'q1', icon: '📖', text: '攻读「第 3 小节」12 个新词', reward: '+60', done: false },
    { id: 'q2', icon: '🔁', text: '复习昨日 8 个易错词', reward: '+30', done: false },
    { id: 'q3', icon: '⚔️', text: '在征服星球赢下 1 场战斗', reward: '+50', done: true },
  ]
  const questsLeft = todayQuests.filter((q) => !q.done).length

  const companions = [
    { id: 'c1', name: '雷恩', avatar: '🐯', level: 9, conquered: 5, online: true },
    { id: 'c2', name: '小薇', avatar: '🦉', level: 7, conquered: 4, online: false },
    { id: 'c3', name: '阿凯', avatar: '🐻', level: 6, conquered: 3, online: true },
    { id: 'c4', name: '糖糖', avatar: '🐰', level: 5, conquered: 2, online: true },
  ]
  const rankedCompanions = [...companions].sort((a, b) => b.conquered - a.conquered)

  const achievements = [
    { id: 'a1', icon: '🏅', label: '初识百词', unlocked: true },
    { id: 'a2', icon: '🔥', label: '连续 5 天', unlocked: true },
    { id: 'a3', icon: '🧩', label: '拼写达人', unlocked: true },
    { id: 'a4', icon: '🗡️', label: '首胜王国', unlocked: true },
    { id: 'a5', icon: '🌟', label: '满分测评', unlocked: false },
    { id: 'a6', icon: '🔒', label: '神秘成就', unlocked: false },
  ]
  const unlockedCount = achievements.filter((a) => a.unlocked).length

  const chooseLibrary = async (id: string) => {
    if (!id || id === profile?.currentLibraryId) {
      setTargetOpen(false)
      return
    }
    setTargetBusy(true)
    setTargetMsg('')
    try {
      await learningApi.setCurrentLibrary(id)
      await onRefresh()
      await refreshConquer()
      setTargetOpen(false)
    } catch (err) {
      setTargetMsg(err instanceof Error ? err.message : '切换失败')
    } finally {
      setTargetBusy(false)
    }
  }

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
      return (
        <ul className="lw-mw-fellow-list">
          {rankedCompanions.map((fellow, idx) => (
            <li key={fellow.id} className="lw-mw-fellow">
              <span className="lw-mw-fellow__rank" aria-hidden="true">
                {RANK_MEDALS[idx] ?? idx + 1}
              </span>
              <span className="lw-mw-fellow__portrait">
                <span className="lw-mw-fellow__face" aria-hidden="true">{fellow.avatar}</span>
                {fellow.online && <span className="lw-mw-fellow__online" title="在线" />}
                <span className="lw-mw-fellow__lv">{fellow.level}</span>
              </span>
              <span className="lw-mw-fellow__info">
                <span className="lw-mw-fellow__name">{fellow.name}</span>
                <span
                  className="lw-mw-fellow__flags"
                  aria-label={`已征服 ${fellow.conquered} / ${KINGDOM_TOTAL} 国`}
                >
                  {Array.from({ length: KINGDOM_TOTAL }).map((_, i) => (
                    <span
                      key={i}
                      className={`lw-mw-flag${i < fellow.conquered ? ' is-won' : ''}`}
                      aria-hidden="true"
                    >
                      {i < fellow.conquered ? '🚩' : '·'}
                    </span>
                  ))}
                </span>
              </span>
              <span className="lw-mw-fellow__count">{fellow.conquered}/{KINGDOM_TOTAL}</span>
            </li>
          ))}
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

  return (
    <div className="lw-mw">
      <img
        className="lw-mw__bg"
        src="/assets/conquer-planet/world-map-bg.png"
        alt=""
        aria-hidden="true"
      />
      <span className="lw-mw__vignette" aria-hidden="true" />

      <div className="lw-mw-hud">
        {/* 顶部：游戏品牌（左） + 军团/目标/用户（右） */}
        <div className="lw-mw-top">
          <section className="lw-mw-glass lw-mw-brand" aria-label="词性星球">
            <span className="lw-mw-brand__logo" aria-hidden="true">🪐</span>
            <div className="lw-mw-brand__text">
              <span className="lw-mw-brand__name">词性星球</span>
              <span className="lw-mw-brand__sub">征服星球 · 单词远征</span>
            </div>
          </section>

          <div className="lw-mw-topbar">
            <div className="lw-mw-actions">
              <button
                type="button"
                className="lw-mw-glass lw-mw-action"
                onClick={() => setLegionOpen(true)}
              >
                <span className="lw-mw-action__icon" aria-hidden="true">🛡️</span>
                <span className="lw-mw-action__body">
                  <span className="lw-mw-action__title">我的军团</span>
                  <span className="lw-mw-action__sub">{legionCount} 兵 · {raceCount}/6 族</span>
                </span>
              </button>
              <button
                type="button"
                className="lw-mw-glass lw-mw-action"
                onClick={() => setTargetOpen(true)}
              >
                <span className="lw-mw-action__icon" aria-hidden="true">🎯</span>
                <span className="lw-mw-action__body">
                  <span className="lw-mw-action__title">征服目标</span>
                  <span className="lw-mw-action__sub">
                    {profile?.currentLibraryName ?? '未选择'}
                  </span>
                </span>
              </button>
            </div>

            <section className="lw-mw-glass lw-mw-hero">
              <div className="lw-mw-hero__crest" aria-hidden="true">
                <span className="lw-mw-hero__crest-face">🦊</span>
                <span className="lw-mw-hero__level">Lv.{heroLevel}</span>
              </div>
              <div className="lw-mw-hero__main">
                <span className="lw-mw-hero__name">{heroName}</span>
                <span className="lw-mw-hero__title">✦ {heroTitle} ✦</span>
                <div className="lw-mw-hero__xp" role="img" aria-label={`经验 ${xpCurrent}/${xpMax}`}>
                  <span className="lw-mw-hero__xp-fill" style={{ width: `${xpPercent}%` }} />
                  <span className="lw-mw-hero__xp-text">EXP {xpCurrent}/{xpMax}</span>
                </div>
              </div>
              <div className="lw-mw-hero__menu-wrap">
                <button
                  type="button"
                  className="lw-mw-hero__menu-btn"
                  aria-label="账户菜单"
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen((v) => !v)}
                >
                  ▾
                </button>
                {menuOpen && (
                  <>
                    <button
                      type="button"
                      className="lw-mw-menu__backdrop"
                      aria-label="关闭菜单"
                      onClick={() => setMenuOpen(false)}
                    />
                    <div className="lw-mw-menu">
                      <a className="lw-mw-menu__item" href="/admin">管理后台</a>
                      <button
                        type="button"
                        className="lw-mw-menu__item"
                        onClick={() => {
                          setMenuOpen(false)
                          onLogout()
                        }}
                      >
                        退出登录
                      </button>
                    </div>
                  </>
                )}
              </div>
            </section>
          </div>
        </div>

        {/* 中央：正在征服的王国（左进展 / 右地图，点击进入） */}
        <div className="lw-mw-center">
          {currentKingdom ? (
            <div
              className="lw-mw-glass lw-mw-realm"
              role="button"
              tabIndex={0}
              aria-label={`进入 ${currentKingdom.name}`}
              onClick={enterCurrent}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  enterCurrent()
                }
              }}
            >
              <div className="lw-mw-realm__progress">
                <div className="lw-mw-realm__head">
                  <span className="lw-mw-realm__order">王国 {currentKingdom.order} · 出征中</span>
                  <h2 className="lw-mw-realm__name">{currentKingdom.name}</h2>
                  <p className="lw-mw-realm__sub">{currentKingdom.subtitle}</p>
                </div>
                <p className="lw-mw-realm__boss">
                  👹 镇守 · {currentKingdom.monster.name}
                  <span className="lw-mw-realm__boss-epithet">（{currentKingdom.monster.epithet}）</span>
                </p>
                <div className="lw-mw-realm__bar" aria-hidden="true">
                  <span className="lw-mw-realm__bar-fill" style={{ width: `${kingdomPercent}%` }} />
                  <span className="lw-mw-realm__bar-text">
                    征服进度 {currentKingdom.levelsDone}/{currentKingdom.levelsTotal} 关
                  </span>
                </div>
                <ul className="lw-mw-track">
                  {currentKingdom.levels.map((lv, idx) => (
                    <li
                      key={lv.id}
                      className={`lw-mw-track__item${lv.done ? ' is-done' : idx === nextLevelIdx ? ' is-current' : ''}`}
                    >
                      <span className="lw-mw-track__icon" aria-hidden="true">
                        {lv.done ? '✓' : lv.icon}
                      </span>
                      <span className="lw-mw-track__name">{lv.name}</span>
                      <span className="lw-mw-track__kind" title={levelMethodLabel(lv.kind)}>
                        {levelKindLabel(lv.kind)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="lw-mw-realm__map">
                {kingdomMap ? (
                  <img className="lw-mw-realm__map-img" src={kingdomMap} alt={`${currentKingdom.name}地图`} />
                ) : (
                  <div className="lw-mw-realm__map-fallback">
                    <span className="lw-mw-realm__map-emoji" aria-hidden="true">🗺️</span>
                    <span>地图绘制中</span>
                  </div>
                )}
                <span className="lw-mw-realm__map-scrim" aria-hidden="true" />
                <span className="lw-mw-realm__enter">进入王国 ▸</span>
              </div>
            </div>
          ) : (
            <div className="lw-mw-glass lw-mw-realm--empty">
              <span className="lw-mw-realm__map-emoji" aria-hidden="true">🧭</span>
              <p>{loading ? '正在召集军团…' : '暂无进行中的王国'}</p>
            </div>
          )}
        </div>

        {/* 底部：可展开的半透明信息坞 */}
        <div className="lw-mw-dock">
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
            <span className="lw-mw-chip__cue" aria-hidden="true">展开 ▸</span>
          </button>

          <button
            type="button"
            className="lw-mw-glass lw-mw-chip"
            onClick={() => setExpanded('fellows')}
          >
            <span className="lw-mw-chip__icon" aria-hidden="true">🤝</span>
            <span className="lw-mw-chip__body">
              <span className="lw-mw-chip__title">我的小伙伴</span>
              <span className="lw-mw-chip__summary">
                {companions.length} 位 · 榜首 {rankedCompanions[0]?.conquered}/{KINGDOM_TOTAL} 国
              </span>
            </span>
            <span className="lw-mw-chip__avatars" aria-hidden="true">
              {rankedCompanions.slice(0, 3).map((f) => (
                <span key={f.id} className="lw-mw-chip__mini">{f.avatar}</span>
              ))}
            </span>
            <span className="lw-mw-chip__cue" aria-hidden="true">展开 ▸</span>
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
            <span className="lw-mw-chip__cue" aria-hidden="true">展开 ▸</span>
          </button>
        </div>
      </div>

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

      {/* 征服目标选择浮层 */}
      {targetOpen && (
        <div
          className="lw-mw-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => setTargetOpen(false)}
        >
          <div className="lw-mw-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="lw-mw-sheet__head">
              <h2 className="lw-mw-sheet__title">🎯 选择征服目标</h2>
              <button
                type="button"
                className="lw-mw-sheet__close"
                onClick={() => setTargetOpen(false)}
                aria-label="关闭"
              >
                ✕
              </button>
            </div>
            <div className="lw-mw-sheet__body">
              {targetMsg && <p className="lw-mw-lib-msg">{targetMsg}</p>}
              <ul className="lw-mw-lib-list">
                {libraries.map((lib) => {
                  const active = lib.id === profile?.currentLibraryId
                  return (
                    <li key={lib.id}>
                      <button
                        type="button"
                        className={`lw-mw-lib-item${active ? ' is-active' : ''}`}
                        disabled={targetBusy}
                        onClick={() => void chooseLibrary(lib.id)}
                      >
                        <span className="lw-mw-lib-item__main">
                          <span className="lw-mw-lib-item__name">{lib.name}</span>
                          <span className="lw-mw-lib-item__count">{lib.wordCount} 词</span>
                        </span>
                        {active && <span className="lw-mw-lib-item__badge">当前</span>}
                      </button>
                    </li>
                  )
                })}
                {libraries.length === 0 && <li className="lw-mw-lib-msg">暂无可选学习库</li>}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 我的军团 */}
      {legionOpen && (
        <WordBankFloatPanel
          soldiers={session?.soldiers ?? []}
          onClose={() => setLegionOpen(false)}
        />
      )}
    </div>
  )
}
