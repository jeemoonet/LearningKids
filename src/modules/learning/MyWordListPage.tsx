import { useMemo, useState } from 'react'
import { useConquer } from '../conquer-planet/ConquerContext'
import { importTargetWords, setPlanetWordFamiliarity } from '../conquer-planet/api'
import { addToWordbook, fetchWordbookIds, removeFromWordbook } from '../vocab-training/wordbookApi'
import { useEffect } from 'react'
import type { PartOfSpeech } from '../word-hunter/domain/battle/battleTypes'

type FamiliarityFilter = 'all' | 1 | 2 | 3 | 4 | 5 | 'wordbook'

const FILTERS: Array<{ id: FamiliarityFilter; label: string }> = [
  { id: 'all', label: '全部' },
  { id: 1, label: '1 分' },
  { id: 2, label: '2 分' },
  { id: 3, label: '3 分' },
  { id: 4, label: '4 分' },
  { id: 5, label: '非常熟悉' },
  { id: 'wordbook', label: '重点单词本' },
]

const POS_LABEL: Record<PartOfSpeech, string> = {
  noun: '名词',
  verb: '动词',
  adjective: '形容词',
  adverb: '副词',
  prep: '介词',
  pronoun: '代词',
  other: '其他',
}

function parseWordbookWordId(wordId: string): number | null {
  const matched = /^w_(\d+)$/.exec(wordId)
  if (!matched) return null
  const id = Number(matched[1])
  return Number.isFinite(id) && id > 0 ? id : null
}

export function MyWordListPage() {
  const { session, setSession } = useConquer()
  const [filter, setFilter] = useState<FamiliarityFilter>('all')
  const [flippedIds, setFlippedIds] = useState<Set<string>>(() => new Set())
  const [wordbookIds, setWordbookIds] = useState<Set<number>>(() => new Set())
  const [loadingWordbook, setLoadingWordbook] = useState(false)
  const [busyWord, setBusyWord] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    setLoadingWordbook(true)
    fetchWordbookIds()
      .then((ids) => setWordbookIds(ids))
      .catch(() => setWordbookIds(new Set()))
      .finally(() => setLoadingWordbook(false))
  }, [])

  const sortedSoldiers = useMemo(() => {
    const soldiers = session?.soldiers ?? []
    return [...soldiers].sort(
      (a, b) =>
        a.familiarity - b.familiarity ||
        a.meaning.localeCompare(b.meaning, 'zh-Hans-CN') ||
        a.word.localeCompare(b.word),
    )
  }, [session?.soldiers])

  const filteredSoldiers = useMemo(() => {
    if (filter === 'all') {
      return sortedSoldiers.filter((soldier) => soldier.familiarity < 5)
    }
    if (filter === 'wordbook') {
      return sortedSoldiers.filter((soldier) => {
        const wordbookId = parseWordbookWordId(soldier.wordId)
        return Boolean(wordbookId && wordbookIds.has(wordbookId))
      })
    }
    return sortedSoldiers.filter((soldier) => soldier.familiarity === filter)
  }, [filter, sortedSoldiers, wordbookIds])

  const counts = useMemo(() => {
    return {
      all: sortedSoldiers.filter((item) => item.familiarity < 5).length,
      1: sortedSoldiers.filter((item) => item.familiarity === 1).length,
      2: sortedSoldiers.filter((item) => item.familiarity === 2).length,
      3: sortedSoldiers.filter((item) => item.familiarity === 3).length,
      4: sortedSoldiers.filter((item) => item.familiarity === 4).length,
      5: sortedSoldiers.filter((item) => item.familiarity === 5).length,
      wordbook: sortedSoldiers.filter((item) => {
        const wordbookId = parseWordbookWordId(item.wordId)
        return Boolean(wordbookId && wordbookIds.has(wordbookId))
      }).length,
    } satisfies Record<FamiliarityFilter, number>
  }, [sortedSoldiers, wordbookIds])

  const markMastered = async (word: string) => {
    if (busyWord) return
    setBusyWord(word)
    try {
      const { session: nextSession } = await setPlanetWordFamiliarity(word, 5)
      setSession(nextSession)
      setMessage(`已将 ${word} 设为 5 分熟悉度`)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '设置失败，请稍后重试')
    } finally {
      setBusyWord(null)
    }
  }

  const addCurrentToWordbook = async (wordIdText: string, word: string) => {
    if (busyWord) return
    const wordId = parseWordbookWordId(wordIdText)
    if (!wordId) {
      setMessage('该单词暂不支持加入单词本')
      return
    }
    if (wordbookIds.has(wordId)) {
      setMessage(`${word} 已在重点单词本中`)
      return
    }
    setBusyWord(word)
    try {
      await addToWordbook(wordId)
      setWordbookIds((prev) => new Set(prev).add(wordId))
      setMessage(`已将 ${word} 加入重点单词本`)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '加入失败，请稍后重试')
    } finally {
      setBusyWord(null)
    }
  }

  const removeCurrentFromWordbook = async (wordIdText: string, word: string) => {
    if (busyWord) return
    const wordId = parseWordbookWordId(wordIdText)
    if (!wordId) {
      setMessage('该单词暂不支持从重点单词本移除')
      return
    }
    if (!wordbookIds.has(wordId)) return
    setBusyWord(word)
    try {
      await removeFromWordbook(wordId)
      setWordbookIds((prev) => {
        const next = new Set(prev)
        next.delete(wordId)
        return next
      })
      setMessage(`${word} 已从重点单词本回归普通列表`)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '移除失败，请稍后重试')
    } finally {
      setBusyWord(null)
    }
  }

  const importFromCurrentTarget = async () => {
    if (importing) return
    setImporting(true)
    setMessage('')
    try {
      const { imported, session: nextSession } = await importTargetWords(30, 2)
      setSession(nextSession)
      if (imported === 30) {
        setMessage('成功导入30个')
      } else if (imported > 0) {
        setMessage(`成功导入${imported}个`)
      } else {
        setMessage('当前挑战目标没有可导入的新词')
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '导入失败，请稍后重试')
    } finally {
      setImporting(false)
    }
  }

  return (
    <section className="lw-wordbook-page lw-wordlist-page">
      <header className="lw-wordbook-page__head">
        <div className="lw-wordbook-page__head-row">
          <h1 className="lw-wordbook-page__title">🗂️ 我的单词表</h1>
          <button
            type="button"
            className="lw-wordlist-page__import-btn"
            disabled={importing}
            onClick={() => void importFromCurrentTarget()}
          >
            {importing ? '导入中...' : '导入单词本'}
          </button>
        </div>
        <p className="lw-wordbook-page__sub">按熟悉度筛选，中文闪卡复习</p>
      </header>

      <div className="lw-mw-wordcards__filters" role="tablist" aria-label="按熟悉度筛选">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={filter === item.id}
            className={`lw-mw-wordcards__filter${filter === item.id ? ' is-active' : ''}${item.id === 5 ? ' is-mastered' : ''}${item.id === 'wordbook' ? ' is-wordbook' : ''}`}
            onClick={() => setFilter(item.id)}
          >
            {item.label}
            <span className="lw-mw-wordcards__filter-count">{counts[item.id]}</span>
          </button>
        ))}
      </div>

      <div className="lw-wordlist-summary">符合条件：{filteredSoldiers.length} 个</div>

      <div className="lw-mw-wordcards__body">
        {filteredSoldiers.length === 0 ? <p className="learning-status">当前筛选下暂无单词</p> : null}
        {filteredSoldiers.length > 0 ? (
          <div className="lw-wordlist-grid">
            {filteredSoldiers.flatMap((item, index) => {
              const wordbookId = parseWordbookWordId(item.wordId)
              const inWordbook = wordbookId ? wordbookIds.has(wordbookId) : false
              const isWordbookFilter = filter === 'wordbook'
              const disabled = Boolean(busyWord) || loadingWordbook
              const flipped = flippedIds.has(item.wordId)
              const nodes = [
                <article key={item.wordId} className="lw-wordlist-card">
                  <span className="lw-wordlist-card__fam-tag">{item.familiarity}</span>
                  <button
                    type="button"
                    className={`lw-wordlist-card__face-toggle${flipped ? ' is-flipped' : ''}`}
                    onClick={() =>
                      setFlippedIds((prev) => {
                        const next = new Set(prev)
                        if (next.has(item.wordId)) next.delete(item.wordId)
                        else next.add(item.wordId)
                        return next
                      })
                    }
                    aria-label={`${flipped ? '查看中文面' : '翻到英文面'} ${item.word}`}
                  >
                    <span className="lw-wordlist-card__flip-inner">
                      <span className="lw-wordlist-card__flip-face lw-wordlist-card__flip-face--front">
                        <p className="lw-wordlist-card__zh" title={item.meaning}>
                          {item.meaning}
                        </p>
                      </span>
                      <span className="lw-wordlist-card__flip-face lw-wordlist-card__flip-face--back">
                        <span className="lw-wordlist-card__back">
                          <span className="lw-wordlist-card__back-head">
                            <p className="lw-wordlist-card__en" title={item.word}>
                              {item.word}
                            </p>
                            <p className="lw-wordlist-card__pos">{POS_LABEL[item.partOfSpeech]}</p>
                          </span>
                          <p className="lw-wordlist-card__zh-back" title={item.meaning}>
                            {item.meaning}
                          </p>
                        </span>
                      </span>
                    </span>
                  </button>
                  <div className="lw-wordlist-card__actions">
                    <button
                      type="button"
                      className="lw-wordlist-card__icon-btn lw-wordlist-card__icon-btn--mastered"
                      title={isWordbookFilter ? '查看非常熟悉列表' : '我非常熟悉'}
                      aria-label={isWordbookFilter ? `查看非常熟悉列表 ${item.word}` : `我非常熟悉 ${item.word}`}
                      disabled={disabled}
                      onClick={() => void markMastered(item.word)}
                    >
                      ✓
                    </button>
                    <button
                      type="button"
                      className={`lw-wordlist-card__icon-btn lw-wordlist-card__icon-btn--add${inWordbook ? ' is-added' : ''}`}
                      title={isWordbookFilter ? '从重点单词本移除' : inWordbook ? '已加入单词本' : '加入单词本'}
                      aria-label={`${isWordbookFilter ? '从重点单词本移除' : inWordbook ? '已加入单词本' : '加入单词本'} ${item.word}`}
                      disabled={disabled || (!isWordbookFilter && inWordbook)}
                      onClick={() =>
                        isWordbookFilter
                          ? void removeCurrentFromWordbook(item.wordId, item.word)
                          : void addCurrentToWordbook(item.wordId, item.word)
                      }
                    >
                      {isWordbookFilter ? '−' : inWordbook ? '✓' : '+'}
                    </button>
                  </div>
                </article>,
              ]

              const isGroupEnd = (index + 1) % 10 === 0 && index < filteredSoldiers.length - 1
              if (isGroupEnd) {
                nodes.push(
                  <div key={`separator-${index}`} className="lw-wordlist-separator" aria-hidden="true" />,
                )
              }
              return nodes
            })}
          </div>
        ) : null}
      </div>

      {message ? <p className="lw-mw-wordcards__msg">{message}</p> : null}
    </section>
  )
}
