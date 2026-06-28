import { useEffect, useState } from 'react'
import { fetchWordbook, removeFromWordbook, type WordbookItem } from '../../vocab-training/wordbookApi'

interface MyWordbookPanelProps {
  onClose: () => void
}

export function MyWordbookPanel({ onClose }: MyWordbookPanelProps) {
  const [items, setItems] = useState<WordbookItem[]>([])
  const [loading, setLoading] = useState(true)
  const [busyWordId, setBusyWordId] = useState<number | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchWordbook()
      .then((rows) => {
        setItems(rows)
        setError('')
      })
      .catch((err) => setError(err instanceof Error ? err.message : '加载单词本失败'))
      .finally(() => setLoading(false))
  }, [])

  const handleRemove = async (wordId: number) => {
    if (busyWordId !== null) return
    setBusyWordId(wordId)
    setError('')
    try {
      await removeFromWordbook(wordId)
      setItems((prev) => prev.filter((item) => item.wordId !== wordId))
    } catch (err) {
      setError(err instanceof Error ? err.message : '移除失败，请稍后重试')
    } finally {
      setBusyWordId(null)
    }
  }

  return (
    <div className="lw-mw-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="lw-mw-sheet lw-mw-wordbook" onClick={(e) => e.stopPropagation()}>
        <div className="lw-mw-sheet__head">
          <h2 className="lw-mw-sheet__title">📒 我的单词本</h2>
          <button type="button" className="lw-mw-sheet__close" onClick={onClose} aria-label="关闭">
            ✕
          </button>
        </div>

        <div className="lw-mw-sheet__body">
          {loading ? <p className="lw-mw-lib-msg">正在加载单词本...</p> : null}
          {error ? <p className="lw-mw-wordbook__error">{error}</p> : null}

          {!loading && items.length === 0 ? (
            <p className="lw-mw-lib-msg">单词本还是空的，先从单词表里加入重点词吧。</p>
          ) : null}

          {!loading && items.length > 0 ? (
            <ul className="lw-mw-wordbook__list">
              {items.map((item) => (
                <li key={item.wordId} className="lw-mw-wordbook__card">
                  <div className="lw-mw-wordbook__head">
                    <strong className="lw-mw-wordbook__word">{item.word}</strong>
                    <button
                      type="button"
                      className="lw-mw-wordbook__remove"
                      disabled={busyWordId === item.wordId}
                      onClick={() => void handleRemove(item.wordId)}
                    >
                      {busyWordId === item.wordId ? '移除中...' : '移除'}
                    </button>
                  </div>
                  {item.meaningZh ? <p className="lw-mw-wordbook__meaning">{item.meaningZh}</p> : null}
                  {item.exampleEn ? <p className="lw-mw-wordbook__example">{item.exampleEn}</p> : null}
                  {item.exampleZh ? <p className="lw-mw-wordbook__example-zh">{item.exampleZh}</p> : null}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  )
}
