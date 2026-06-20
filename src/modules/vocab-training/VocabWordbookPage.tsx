import { useEffect, useState } from 'react'
import { VocabTranslateButton } from './VocabTranslateButton'
import type { WordbookItem } from './wordbookApi'
import { fetchWordbook, removeFromWordbook } from './wordbookApi'

interface VocabWordbookPageProps {
  onBack: () => void
}

function WordbookListItem({
  item,
  onRemove,
}: {
  item: WordbookItem
  onRemove: (wordId: number) => void
}) {
  const [showZh, setShowZh] = useState(false)
  const exampleEn = item.exampleEn?.trim() ?? ''
  const exampleZh = item.exampleZh?.trim() ?? ''
  const meaningZh = item.meaningZh?.trim() ?? ''

  useEffect(() => {
    setShowZh(false)
  }, [item.wordId])

  return (
    <li className="vocab-wordbook-item">
      <div className="vocab-wordbook-item-head">
        <span className="vocab-wordbook-word">{item.word}</span>
        {meaningZh && (
          <VocabTranslateButton
            show={showZh}
            onToggle={() => setShowZh((value) => !value)}
            className="vocab-translate-button-inline"
          />
        )}
        <button
          type="button"
          className="vocab-wordbook-remove"
          onClick={() => onRemove(item.wordId)}
          aria-label={`从单词本移除 ${item.word}`}
        >
          移除
        </button>
      </div>
      {showZh && meaningZh && <p className="vocab-wordbook-meaning">{meaningZh}</p>}
      {exampleEn && <p className="vocab-wordbook-example">{exampleEn}</p>}
      {showZh && exampleZh && <p className="vocab-wordbook-example-zh">{exampleZh}</p>}
    </li>
  )
}

export function VocabWordbookPage({ onBack }: VocabWordbookPageProps) {
  const [items, setItems] = useState<WordbookItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchWordbook()
      .then(setItems)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const handleRemove = async (wordId: number) => {
    try {
      await removeFromWordbook(wordId)
      setItems((current) => current.filter((item) => item.wordId !== wordId))
    } catch (err) {
      setError(err instanceof Error ? err.message : '移除失败')
    }
  }

  return (
    <div className="module module-vocab-training">
      <header className="vocab-home-header">
        <button type="button" className="module-back-button" onClick={onBack}>
          ← 返回
        </button>
        <div className="vocab-home-header-row">
          <div className="vocab-home-title-block">
            <h1>单词本</h1>
            <p>收藏的重要单词，随时复习</p>
          </div>
        </div>
      </header>

      <main className="app-main app-main-vocab-home">
        <div className="vocab-home-center">
          {loading && <p className="vocab-status">正在加载单词本...</p>}
          {error && <p className="vocab-inline-error">{error}</p>}

          {!loading && items.length === 0 && (
            <p className="vocab-status vocab-status--full">
              单词本还是空的。在闪卡页面点击「加入单词本」收藏重要单词。
            </p>
          )}

          {!loading && items.length > 0 && (
            <ul className="vocab-wordbook-list">
              {items.map((item) => (
                <WordbookListItem key={item.wordId} item={item} onRemove={handleRemove} />
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  )
}
