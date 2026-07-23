import { useMemo, useState } from 'react'
import { useConquer } from '../conquer-planet/ConquerContext'
import { importTargetWords, setPlanetWordFamiliarity } from '../conquer-planet/api'
import { addToWordbook, exportWordbookPdf, fetchWordbookIds, removeFromWordbook } from '../vocab-training/wordbookApi'
import { speakEnglish } from '../vocab-training/speak'
import { useEffect } from 'react'
import type { PartOfSpeech } from '../word-hunter/domain/battle/battleTypes'
import { highlightMeaningInZh } from '../../lib/highlightMeaningInZh'
import { WordlistReadingModal } from './components/WordlistReadingModal'

type FamiliarityFilter = 'all' | 1 | 2 | 3 | 4 | 5 | 'wordbook'
type CardDisplayMode = 'zh-word' | 'en-word' | 'zh-example' | 'en-example'

const FILTERS: Array<{ id: FamiliarityFilter; label: string }> = [
  { id: 'all', label: '全部' },
  { id: 1, label: '1 分' },
  { id: 2, label: '2 分' },
  { id: 3, label: '3 分' },
  { id: 4, label: '4 分' },
  { id: 5, label: '非常熟悉' },
  { id: 'wordbook', label: '重点单词本' },
]

const DISPLAY_TABS: Array<{ id: CardDisplayMode; label: string }> = [
  { id: 'zh-word', label: '中文单词' },
  { id: 'en-word', label: '英文单词' },
  { id: 'zh-example', label: '中文例句' },
  { id: 'en-example', label: '英文例句' },
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

function filterExportTitle(filter: FamiliarityFilter): string {
  const label = FILTERS.find((item) => item.id === filter)?.label ?? '全部'
  if (filter === 'all') return '我的单词表'
  if (filter === 'wordbook') return '重点单词本'
  return `我的单词表·${label}`
}

function parseWordbookWordId(wordId: string): number | null {
  const matched = /^w_(\d+)$/.exec(wordId)
  if (!matched) return null
  const id = Number(matched[1])
  return Number.isFinite(id) && id > 0 ? id : null
}

function getCardFrontText(item: { word: string; meaning: string; exampleEn?: string; exampleZh?: string }, mode: CardDisplayMode) {
  switch (mode) {
    case 'zh-word':
      return item.meaning?.trim() || '暂无释义'
    case 'en-word':
      return item.word
    case 'zh-example':
      return item.exampleZh?.trim() || '暂无例句'
    case 'en-example':
      return item.exampleEn?.trim() || '暂无例句'
  }
}

function getCardFrontClass(mode: CardDisplayMode) {
  if (mode === 'en-word') return 'lw-wordlist-card__en lw-wordlist-card__en--front'
  if (mode === 'en-example') return 'lw-wordlist-card__example-en lw-wordlist-card__example-en--front'
  if (mode === 'zh-example') return 'lw-wordlist-card__example-zh lw-wordlist-card__example-zh--front'
  return 'lw-wordlist-card__zh'
}

export function MyWordListPage() {
  const { session, setSession } = useConquer()
  const [filter, setFilter] = useState<FamiliarityFilter>('all')
  const [displayMode, setDisplayMode] = useState<CardDisplayMode>('zh-word')
  const [flippedIds, setFlippedIds] = useState<Set<string>>(() => new Set())
  const [wordbookIds, setWordbookIds] = useState<Set<number>>(() => new Set())
  const [loadingWordbook, setLoadingWordbook] = useState(false)
  const [busyWord, setBusyWord] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')
  const [showReading, setShowReading] = useState(false)

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

  const unfamiliarSoldiers = useMemo(
    () => sortedSoldiers.filter((soldier) => soldier.familiarity >= 1 && soldier.familiarity <= 4),
    [sortedSoldiers],
  )

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
    } catch {
      // silent
    } finally {
      setBusyWord(null)
    }
  }

  const increaseFamiliarity = async (word: string, currentFamiliarity: number) => {
    if (busyWord || currentFamiliarity >= 5) return
    const nextFamiliarity = currentFamiliarity + 1
    setBusyWord(word)
    try {
      const { session: nextSession } = await setPlanetWordFamiliarity(word, nextFamiliarity)
      setSession(nextSession)
    } catch {
      // silent
    } finally {
      setBusyWord(null)
    }
  }

  const decreaseFamiliarity = async (word: string, currentFamiliarity: number) => {
    if (busyWord || currentFamiliarity <= 1) return
    const nextFamiliarity = currentFamiliarity - 1
    setBusyWord(word)
    try {
      const { session: nextSession } = await setPlanetWordFamiliarity(word, nextFamiliarity)
      setSession(nextSession)
    } catch {
      // silent
    } finally {
      setBusyWord(null)
    }
  }

  const addCurrentToWordbook = async (wordIdText: string, word: string) => {
    if (busyWord) return
    const wordId = parseWordbookWordId(wordIdText)
    if (!wordId || wordbookIds.has(wordId)) return
    setBusyWord(word)
    try {
      await addToWordbook(wordId)
      setWordbookIds((prev) => new Set(prev).add(wordId))
    } catch {
      // silent
    } finally {
      setBusyWord(null)
    }
  }

  const removeCurrentFromWordbook = async (wordIdText: string, word: string) => {
    if (busyWord) return
    const wordId = parseWordbookWordId(wordIdText)
    if (!wordId || !wordbookIds.has(wordId)) return
    setBusyWord(word)
    try {
      await removeFromWordbook(wordId)
      setWordbookIds((prev) => {
        const next = new Set(prev)
        next.delete(wordId)
        return next
      })
    } catch {
      // silent
    } finally {
      setBusyWord(null)
    }
  }

  const importFromCurrentTarget = async () => {
    if (importing) return
    setImporting(true)
    try {
      const { imported, session: nextSession } = await importTargetWords(30, 2)
      setSession(nextSession)
      if (imported > 0) {
        setFilter(2)
      } else {
        setFilter('all')
      }
    } catch {
      // silent
    } finally {
      setImporting(false)
    }
  }

  const exportSoldiersPdf = async (
    soldiers: typeof filteredSoldiers,
    title: string,
  ) => {
    if (exporting || soldiers.length === 0) return
    setExporting(true)
    setExportError('')
    try {
      const { blob, filename } = await exportWordbookPdf({
        title,
        words: soldiers.map((item) => ({
          word: item.word,
          posLabel: item.posLabel?.trim() || POS_LABEL[item.partOfSpeech],
          meaningZh: item.meaning,
          exampleEn: item.exampleEn?.trim() || '',
        })),
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setExportError(err instanceof Error ? err.message : '导出失败')
    } finally {
      setExporting(false)
    }
  }

  const exportCurrentList = () =>
    void exportSoldiersPdf(filteredSoldiers, filterExportTitle(filter))

  const exportUnfamiliarList = () =>
    void exportSoldiersPdf(unfamiliarSoldiers, '不熟悉单词')

  const toggleFlip = (wordId: string) => {
    setFlippedIds((prev) => {
      const next = new Set(prev)
      if (next.has(wordId)) next.delete(wordId)
      else next.add(wordId)
      return next
    })
  }

  return (
    <section className="lw-wordbook-page lw-wordlist-page">
      <header className="lw-wordbook-page__head">
        <div className="lw-wordbook-page__head-row">
          <h1 className="lw-wordbook-page__title">🗂️ 我的单词表</h1>
          <div className="lw-wordlist-page__head-actions">
            <button
              type="button"
              className="lw-wordlist-page__export-btn"
              disabled={exporting || filteredSoldiers.length === 0}
              title={filteredSoldiers.length === 0 ? '当前筛选下暂无单词' : '导出当前列表为 PDF'}
              onClick={exportCurrentList}
            >
              {exporting ? '导出中…' : '导出 PDF'}
            </button>
            <button
              type="button"
              className="lw-wordlist-page__export-btn"
              disabled={exporting || unfamiliarSoldiers.length === 0}
              title={
                unfamiliarSoldiers.length === 0
                  ? '暂无不熟悉单词'
                  : `导出熟悉度 1–4 的单词（${unfamiliarSoldiers.length} 词）`
              }
              onClick={exportUnfamiliarList}
            >
              {exporting ? '导出中…' : '导出不熟悉'}
            </button>
            <button
              type="button"
              className="lw-wordlist-page__reading-btn"
              disabled={filteredSoldiers.length < 5}
              title={filteredSoldiers.length < 5 ? '至少需要 5 个单词' : '生成阅读短文'}
              onClick={() => setShowReading(true)}
            >
              生成阅读短文
            </button>
            <button
              type="button"
              className="lw-wordlist-page__import-btn"
              disabled={importing}
              onClick={() => void importFromCurrentTarget()}
            >
              {importing ? '导入中...' : '导入单词本'}
            </button>
          </div>
        </div>
        <p className="lw-wordbook-page__sub">按熟悉度筛选，点击卡片查看详情</p>
        {exportError ? <p className="lw-wordlist-page__export-error">{exportError}</p> : null}
      </header>

      <div className="lw-wordlist-display-tabs" role="tablist" aria-label="卡片显示内容">
        {DISPLAY_TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={displayMode === item.id}
            className={`lw-wordlist-display-tabs__btn${displayMode === item.id ? ' is-active' : ''}`}
            onClick={() => {
              setDisplayMode(item.id)
              setFlippedIds(new Set())
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

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

      <div className="lw-mw-wordcards__body">
        {filteredSoldiers.length === 0 ? <p className="learning-status">当前筛选下暂无单词</p> : null}
        {filteredSoldiers.length > 0 ? (
          <div className="lw-wordlist-grid">
            {filteredSoldiers.flatMap((item, index) => {
              const wordbookId = parseWordbookWordId(item.wordId)
              const inWordbook = wordbookId ? wordbookIds.has(wordbookId) : false
              const isWordbookFilter = filter === 'wordbook'
              const isMasteredFilter = filter === 5
              const disabled = Boolean(busyWord) || loadingWordbook
              const flipped = flippedIds.has(item.wordId)
              const frontText = getCardFrontText(item, displayMode)
              const frontClass = getCardFrontClass(displayMode)
              const nodes = [
                <article key={item.wordId} className="lw-wordlist-card">
                  <button
                    type="button"
                    className="lw-wordlist-card__fam-tag"
                    title={item.familiarity >= 5 ? '已是最高熟悉度' : '熟悉度 +1'}
                    aria-label={`熟悉度加一 ${item.word}（当前 ${item.familiarity} 分）`}
                    disabled={disabled || item.familiarity >= 5}
                    onClick={(e) => {
                      e.stopPropagation()
                      void increaseFamiliarity(item.word, item.familiarity)
                    }}
                  >
                    {item.familiarity}
                  </button>
                  <div
                    role="button"
                    tabIndex={0}
                    className={`lw-wordlist-card__face-toggle${flipped ? ' is-flipped' : ''}`}
                    onClick={() => toggleFlip(item.wordId)}
                    onKeyDown={(e) => {
                      if (e.key !== 'Enter' && e.key !== ' ') return
                      e.preventDefault()
                      toggleFlip(item.wordId)
                    }}
                    aria-label={`${flipped ? '返回' : '查看详情'} ${item.word}`}
                  >
                    {!flipped ? (
                      <span className="lw-wordlist-card__face lw-wordlist-card__face--front">
                        {displayMode === 'en-word' ? (
                          <span className="lw-wordlist-card__en-row lw-wordlist-card__en-row--front">
                            <p className={frontClass} title={frontText}>
                              {frontText}
                            </p>
                            <button
                              type="button"
                              className="lw-wordlist-card__speak"
                              title="播放发音"
                              aria-label={`播放 ${item.word} 发音`}
                              onClick={(e) => {
                                e.stopPropagation()
                                speakEnglish(item.word)
                              }}
                            >
                              🔊
                            </button>
                          </span>
                        ) : displayMode === 'zh-example' ? (
                          <p className={frontClass} title={frontText}>
                            {highlightMeaningInZh(item.exampleZh?.trim() || '暂无例句', item.meaning)}
                          </p>
                        ) : (
                          <p className={frontClass} title={frontText}>
                            {frontText}
                          </p>
                        )}
                      </span>
                    ) : (
                      <span className="lw-wordlist-card__face lw-wordlist-card__face--detail">
                        <span className="lw-wordlist-card__back">
                          <span className="lw-wordlist-card__back-head">
                            <span className="lw-wordlist-card__en-row">
                              <p className="lw-wordlist-card__en" title={item.word}>
                                {item.word}
                              </p>
                              <button
                                type="button"
                                className="lw-wordlist-card__speak"
                                title="播放发音"
                                aria-label={`播放 ${item.word} 发音`}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  speakEnglish(item.word)
                                }}
                              >
                                🔊
                              </button>
                            </span>
                            <p className="lw-wordlist-card__pos">{POS_LABEL[item.partOfSpeech]}</p>
                          </span>
                          <p className="lw-wordlist-card__zh-detail" title={item.meaning}>
                            {item.meaning || '暂无释义'}
                          </p>
                          <span className="lw-wordlist-card__example">
                            {item.exampleEn?.trim() ? (
                              <p className="lw-wordlist-card__example-en" title={item.exampleEn}>
                                {item.exampleEn.trim()}
                              </p>
                            ) : null}
                            {item.exampleZh?.trim() ? (
                              <p className="lw-wordlist-card__example-zh" title={item.exampleZh}>
                                {highlightMeaningInZh(item.exampleZh.trim(), item.meaning)}
                              </p>
                            ) : null}
                            {!item.exampleEn?.trim() && !item.exampleZh?.trim() ? (
                              <p className="lw-wordlist-card__example-empty">暂无例句</p>
                            ) : null}
                          </span>
                        </span>
                      </span>
                    )}
                  </div>
                  <div className="lw-wordlist-card__actions">
                    <button
                      type="button"
                      className="lw-wordlist-card__icon-btn lw-wordlist-card__icon-btn--mastered"
                      title={
                        isMasteredFilter
                          ? '降低熟悉度'
                          : isWordbookFilter
                            ? '查看非常熟悉列表'
                            : '我非常熟悉'
                      }
                      aria-label={
                        isMasteredFilter
                          ? `降低熟悉度 ${item.word}`
                          : isWordbookFilter
                            ? `查看非常熟悉列表 ${item.word}`
                            : `我非常熟悉 ${item.word}`
                      }
                      disabled={disabled}
                      onClick={() =>
                        isMasteredFilter
                          ? void decreaseFamiliarity(item.word, item.familiarity)
                          : void markMastered(item.word)
                      }
                    >
                      {isMasteredFilter ? '−' : '✓'}
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

      {showReading ? (
        <WordlistReadingModal soldiers={filteredSoldiers} onClose={() => setShowReading(false)} />
      ) : null}

    </section>
  )
}
