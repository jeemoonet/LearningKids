import { useEffect, useMemo, useState } from 'react'
import { setPlanetWordFamiliarity } from '../../conquer-planet/api'
import type { PlanetSession, PlanetSoldier } from '../../conquer-planet/types'
import { addToWordbook, fetchWordbookIds } from '../../vocab-training/wordbookApi'

type FamiliarityFilter = 'all' | 1 | 2 | 3 | 4 | 5

interface MyWordFlashcardPanelProps {
  soldiers: PlanetSoldier[]
  onSessionUpdate: (session: PlanetSession) => void
  onClose: () => void
}

const FILTERS: Array<{ id: FamiliarityFilter; label: string }> = [
  { id: 'all', label: '全部' },
  { id: 1, label: '1 分' },
  { id: 2, label: '2 分' },
  { id: 3, label: '3 分' },
  { id: 4, label: '4 分' },
  { id: 5, label: '5 分' },
]

function parseWordbookWordId(wordId: string): number | null {
  const matched = /^w_(\d+)$/.exec(wordId)
  if (!matched) return null
  const id = Number(matched[1])
  return Number.isFinite(id) && id > 0 ? id : null
}

export function MyWordFlashcardPanel({
  soldiers,
  onSessionUpdate,
  onClose,
}: MyWordFlashcardPanelProps) {
  const [filter, setFilter] = useState<FamiliarityFilter>('all')
  const [index, setIndex] = useState(0)
  const [wordbookIds, setWordbookIds] = useState<Set<number>>(() => new Set())
  const [loadingWordbook, setLoadingWordbook] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    setLoadingWordbook(true)
    fetchWordbookIds()
      .then((ids) => setWordbookIds(ids))
      .catch(() => setWordbookIds(new Set()))
      .finally(() => setLoadingWordbook(false))
  }, [])

  const sortedSoldiers = useMemo(() => {
    return [...soldiers].sort(
      (a, b) =>
        a.familiarity - b.familiarity ||
        a.meaning.localeCompare(b.meaning, 'zh-Hans-CN') ||
        a.word.localeCompare(b.word),
    )
  }, [soldiers])

  const filteredSoldiers = useMemo(() => {
    if (filter === 'all') return sortedSoldiers
    return sortedSoldiers.filter((soldier) => soldier.familiarity === filter)
  }, [filter, sortedSoldiers])

  const counts = useMemo(() => {
    return {
      all: sortedSoldiers.length,
      1: sortedSoldiers.filter((item) => item.familiarity === 1).length,
      2: sortedSoldiers.filter((item) => item.familiarity === 2).length,
      3: sortedSoldiers.filter((item) => item.familiarity === 3).length,
      4: sortedSoldiers.filter((item) => item.familiarity === 4).length,
      5: sortedSoldiers.filter((item) => item.familiarity === 5).length,
    } satisfies Record<FamiliarityFilter, number>
  }, [sortedSoldiers])

  useEffect(() => {
    if (index < filteredSoldiers.length) return
    setIndex(Math.max(0, filteredSoldiers.length - 1))
  }, [index, filteredSoldiers.length])

  const current = filteredSoldiers[index] ?? null

  const markMastered = async () => {
    if (!current || busy) return
    setBusy(true)
    setMessage('')
    try {
      const { session } = await setPlanetWordFamiliarity(current.word, 5)
      onSessionUpdate(session)
      setMessage('已设置为 5 分熟悉度')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '设置失败，请稍后重试')
    } finally {
      setBusy(false)
    }
  }

  const addCurrentToWordbook = async () => {
    if (!current || busy) return
    const wordId = parseWordbookWordId(current.wordId)
    if (!wordId) {
      setMessage('该单词暂不支持加入单词本')
      return
    }
    if (wordbookIds.has(wordId)) {
      setMessage('该单词已在重点单词本中')
      return
    }
    setBusy(true)
    setMessage('')
    try {
      await addToWordbook(wordId)
      setWordbookIds((prev) => new Set(prev).add(wordId))
      setMessage('已加入重点单词本')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '加入失败，请稍后重试')
    } finally {
      setBusy(false)
    }
  }

  const canPrev = index > 0
  const canNext = index < filteredSoldiers.length - 1
  const currentWordbookId = current ? parseWordbookWordId(current.wordId) : null
  const inWordbook = currentWordbookId ? wordbookIds.has(currentWordbookId) : false

  return (
    <div className="lw-mw-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="lw-mw-sheet lw-mw-wordcards" onClick={(e) => e.stopPropagation()}>
        <div className="lw-mw-sheet__head">
          <h2 className="lw-mw-sheet__title">🗂️ 我的单词表</h2>
          <button type="button" className="lw-mw-sheet__close" onClick={onClose} aria-label="关闭">
            ✕
          </button>
        </div>

        <div className="lw-mw-wordcards__filters" role="tablist" aria-label="按熟悉度筛选">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={filter === item.id}
              className={`lw-mw-wordcards__filter${filter === item.id ? ' is-active' : ''}`}
              onClick={() => {
                setFilter(item.id)
                setIndex(0)
              }}
            >
              {item.label}
              <span className="lw-mw-wordcards__filter-count">{counts[item.id]}</span>
            </button>
          ))}
        </div>

        <div className="lw-mw-sheet__body lw-mw-wordcards__body">
          {!current ? (
            <p className="lw-mw-lib-msg">当前筛选下暂无单词</p>
          ) : (
            <>
              <div className="lw-mw-wordcards__counter">
                {index + 1} / {filteredSoldiers.length}
              </div>
              <article className="lw-mw-wordcards__card">
                <p className="lw-mw-wordcards__label">中文释义</p>
                <p className="lw-mw-wordcards__meaning">{current.meaning}</p>
                {current.exampleZh ? <p className="lw-mw-wordcards__example">{current.exampleZh}</p> : null}
                <p className="lw-mw-wordcards__hint">请先在脑中回忆英文单词，再进行自评</p>
                <p className="lw-mw-wordcards__fam">
                  熟悉度：{current.familiarity} / 5
                  <span aria-hidden="true">
                    {' '}
                    {'★'.repeat(current.familiarity)}
                    {'☆'.repeat(Math.max(0, 5 - current.familiarity))}
                  </span>
                </p>
              </article>

              <div className="lw-mw-wordcards__nav">
                <button
                  type="button"
                  className="lw-mw-link-btn"
                  disabled={!canPrev || busy}
                  onClick={() => setIndex((v) => Math.max(0, v - 1))}
                >
                  ← 上一张
                </button>
                <button
                  type="button"
                  className="lw-mw-link-btn"
                  disabled={!canNext || busy}
                  onClick={() => setIndex((v) => Math.min(filteredSoldiers.length - 1, v + 1))}
                >
                  下一张 →
                </button>
              </div>

              <div className="lw-mw-wordcards__actions">
                <button
                  type="button"
                  className="lw-mw-wordcards__primary"
                  disabled={busy}
                  onClick={() => void markMastered()}
                >
                  我答出来了（设为 5 分）
                </button>
                <button
                  type="button"
                  className={`lw-mw-wordcards__secondary${inWordbook ? ' is-added' : ''}`}
                  disabled={busy || loadingWordbook || inWordbook}
                  onClick={() => void addCurrentToWordbook()}
                >
                  {inWordbook ? '已加入重点单词本' : '加入重点单词本'}
                </button>
              </div>
            </>
          )}
        </div>

        {message ? <p className="lw-mw-wordcards__msg">{message}</p> : null}
      </div>
    </div>
  )
}
