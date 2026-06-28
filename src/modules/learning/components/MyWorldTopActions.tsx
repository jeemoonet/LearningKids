import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useConquer } from '../../conquer-planet/ConquerContext'
import { SIX_RACES } from '../../conquer-planet/types'
import { learningApi, type LearningLibrary, type LearningProfile } from '../api'
import { MyWordFlashcardPanel } from './MyWordFlashcardPanel'
import { MyWordbookPanel } from './MyWordbookPanel'
import { WordBankFloatPanel } from './WordBankFloatPanel'

interface MyWorldTopActionsProps {
  profile: LearningProfile | null
  onRefresh: () => Promise<void>
}

export function MyWorldTopActions({ profile, onRefresh }: MyWorldTopActionsProps) {
  const { session, refresh: refreshConquer, setSession } = useConquer()
  const [slot, setSlot] = useState<HTMLElement | null>(null)
  const [legionOpen, setLegionOpen] = useState(false)
  const [wordListOpen, setWordListOpen] = useState(false)
  const [wordbookOpen, setWordbookOpen] = useState(false)
  const [targetOpen, setTargetOpen] = useState(false)
  const [libraries, setLibraries] = useState<LearningLibrary[]>([])
  const [targetBusy, setTargetBusy] = useState(false)
  const [targetMsg, setTargetMsg] = useState('')

  useEffect(() => {
    setSlot(document.getElementById('lw-top-actions-slot'))
  }, [])

  useEffect(() => {
    learningApi
      .listLibraries()
      .then(({ libraries: list }) => setLibraries(list))
      .catch(() => undefined)
  }, [])

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

  const actions = (
    <div className="lw-mw-head__row">
      <button
        type="button"
        className="lw-mw-glass lw-mw-action lw-mw-head__btn"
        onClick={() => setLegionOpen(true)}
      >
        <span className="lw-mw-action__icon" aria-hidden="true">
          🛡️
        </span>
        <span className="lw-mw-action__body">
          <span className="lw-mw-action__title">我的军团</span>
          <span className="lw-mw-action__sub">
            {legionCount} 兵 · {raceCount}/6 族
          </span>
        </span>
      </button>
      <button
        type="button"
        className="lw-mw-glass lw-mw-action lw-mw-head__btn"
        onClick={() => setWordListOpen(true)}
      >
        <span className="lw-mw-action__icon" aria-hidden="true">
          🗂️
        </span>
        <span className="lw-mw-action__body">
          <span className="lw-mw-action__title">我的单词表</span>
          <span className="lw-mw-action__sub">按熟悉度筛选闪卡复习</span>
        </span>
      </button>
      <button
        type="button"
        className="lw-mw-glass lw-mw-action lw-mw-head__btn"
        onClick={() => setWordbookOpen(true)}
      >
        <span className="lw-mw-action__icon" aria-hidden="true">
          📒
        </span>
        <span className="lw-mw-action__body">
          <span className="lw-mw-action__title">我的单词本</span>
          <span className="lw-mw-action__sub">重点单词卡片，可移除</span>
        </span>
      </button>
      <button
        type="button"
        className="lw-mw-glass lw-mw-action lw-mw-head__btn"
        onClick={() => setTargetOpen(true)}
      >
        <span className="lw-mw-action__icon" aria-hidden="true">
          🎯
        </span>
        <span className="lw-mw-action__body">
          <span className="lw-mw-action__title">征服目标</span>
          <span className="lw-mw-action__sub">{profile?.currentLibraryName ?? '未选择'}</span>
        </span>
      </button>
    </div>
  )

  return (
    <>
      {slot ? createPortal(actions, slot) : null}

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

      {legionOpen && (
        <WordBankFloatPanel
          soldiers={session?.soldiers ?? []}
          onClose={() => setLegionOpen(false)}
        />
      )}

      {wordListOpen && (
        <MyWordFlashcardPanel
          soldiers={session?.soldiers ?? []}
          onSessionUpdate={(nextSession) => setSession(nextSession)}
          onClose={() => setWordListOpen(false)}
        />
      )}

      {wordbookOpen && <MyWordbookPanel onClose={() => setWordbookOpen(false)} />}
    </>
  )
}
