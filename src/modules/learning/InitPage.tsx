import { useCallback, useEffect, useState } from 'react'

import type { LearningNav } from './LearningModule'

import { learningApi, type InitStatus, type KnownWord } from './api'
import { InitWordDrawPanel } from './components/InitWordDrawPanel'

const POS_LABEL: Record<string, string> = {
  noun: '名词',
  verb: '动词',
  adj: '形容词',
  pronoun: '代词',
  adv: '副词',
  other: '其他',
}

interface InitPageProps {
  onDone: () => Promise<void>
  nav: LearningNav
}

export function InitPage({ onDone, nav }: InitPageProps) {
  const [known, setKnown] = useState<KnownWord[]>([])
  const [status, setStatus] = useState<InitStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

  const loadPage = useCallback(async () => {
    setLoading(true)
    try {
      const [{ words }, s] = await Promise.all([
        learningApi.listKnownWords(),
        learningApi.initStatus('beginner'),
      ])
      setKnown(words)
      setStatus(s)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadPage()
  }, [loadPage])

  const handleImported = async () => {
    await onDone()
    await loadPage()
  }

  const progress = status ? Math.min(100, Math.round((status.knownCount / status.targetCount) * 100)) : 0

  return (
    <div className="learning-page">
      <header className="learning-page-head learning-page-head-row">
        <div>
          <h1>我的单词库</h1>
          <p>
            已掌握的单词会出现在下方；目标 {status?.targetCount ?? 100} 词，用于后续学习白名单。
          </p>
        </div>
        <button type="button" className="learning-primary" onClick={() => setModalOpen(true)}>
          初始化
        </button>
      </header>

      <section className="learning-card">
        <div className="learning-progress">
          <div className="learning-progress-bar" style={{ width: `${progress}%` }} />
          <span className="learning-progress-text">
            已掌握 {status?.knownCount ?? 0} / {status?.targetCount ?? 100}
          </span>
        </div>
        {status?.initialized && (
          <div className="learning-form-actions">
            <button type="button" className="learning-secondary" onClick={() => nav.go('library')}>
              下一步：选择学习库
            </button>
          </div>
        )}
      </section>

      <section className="learning-card">
        <h2>全部单词（{known.length}）</h2>
        {loading ? (
          <p className="learning-status">加载中…</p>
        ) : known.length === 0 ? (
          <p className="learning-empty">还没有单词，点击右上角「初始化」抽取并导入认识的词。</p>
        ) : (
          <div className="learning-known-list">
            {known.map((w) => (
              <div key={w.word} className={`learning-known-row learning-known-${w.source}`}>
                <span className="learning-known-row-word">{w.word}</span>
                <span className="learning-known-row-pos">{POS_LABEL[w.pos] ?? w.pos}</span>
                <span className="learning-known-row-source">
                  {w.source === 'pronoun' ? '系统' : w.source === 'init' ? '初始化' : '学习通过'}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <InitWordDrawPanel
        active={modalOpen}
        onClose={() => setModalOpen(false)}
        onImported={handleImported}
        onGoLibrary={() => nav.go('library')}
      />
    </div>
  )
}
