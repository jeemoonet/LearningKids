import { useEffect, useState } from 'react'
import { apiFetch } from '../../lib/api'
import type { VocabWord } from '../vocab-training/types'
import { speakEnglish } from '../vocab-training/speak'

interface Tier {
  id: string
  label: string
  wordCount: number
}

export function StandardLibraryPage() {
  const [tiers, setTiers] = useState<Tier[]>([])
  const [tierId, setTierId] = useState<string>('')
  const [words, setWords] = useState<VocabWord[]>([])
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    apiFetch<{ tiers: Tier[] }>('/vocab/tiers').then(({ tiers: list }) => {
      setTiers(list)
      if (list[0]) setTierId(list[0].id)
    })
  }, [])

  useEffect(() => {
    if (!tierId) return
    setLoading(true)
    apiFetch<{ words: VocabWord[] }>(`/vocab/words?tierId=${encodeURIComponent(tierId)}`)
      .then(({ words: list }) => setWords(list))
      .finally(() => setLoading(false))
  }, [tierId])

  const filtered = keyword.trim()
    ? words.filter(
        (w) =>
          w.word.toLowerCase().includes(keyword.trim().toLowerCase()) ||
          w.meaningZh.includes(keyword.trim()),
      )
    : words

  return (
    <div className="learning-page">
      <header className="learning-page-head">
        <h1>标准单词库</h1>
        <p>全平台共享的单词母库，按档位浏览</p>
      </header>

      <section className="learning-card">
        <div className="learning-stdlib-toolbar">
          <div className="learning-tabs">
            {tiers.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`learning-tab${tierId === t.id ? ' is-active' : ''}`}
                onClick={() => setTierId(t.id)}
              >
                {t.label}（{t.wordCount}）
              </button>
            ))}
          </div>
          <input
            className="learning-search"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索单词或释义"
          />
        </div>

        {loading ? (
          <p className="learning-status">加载中…</p>
        ) : (
          <div className="learning-stdlib-list">
            {filtered.map((w) => (
              <div key={w.id} className="learning-stdlib-row">
                <button
                  type="button"
                  className="learning-stdlib-word"
                  onClick={() => speakEnglish(w.word)}
                >
                  {w.word}
                </button>
                <span className="learning-stdlib-pos">{w.posLabel}</span>
                <span className="learning-stdlib-zh">{w.meaningZh}</span>
              </div>
            ))}
            {filtered.length === 0 && <p className="learning-empty">没有匹配的单词。</p>}
          </div>
        )}
      </section>
    </div>
  )
}
