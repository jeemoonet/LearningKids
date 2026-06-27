import { useEffect, useState } from 'react'
import type { LearningNav } from './LearningModule'
import { learningApi, type LearningLibrary, type LearningProfile } from './api'

interface LibraryPickPageProps {
  profile: LearningProfile | null
  onChange: () => Promise<void>
  nav: LearningNav
}

export function LibraryPickPage({ profile, onChange, nav }: LibraryPickPageProps) {
  const [libraries, setLibraries] = useState<LearningLibrary[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    learningApi
      .listLibraries()
      .then(({ libraries: list }) => setLibraries(list))
      .catch((err) => setMessage(err instanceof Error ? err.message : '加载失败'))
      .finally(() => setLoading(false))
  }, [])

  const choose = async (id: string) => {
    setMessage('')
    try {
      await learningApi.setCurrentLibrary(id)
      await onChange()
      setMessage('已设为当前学习目标')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '设置失败')
    }
  }

  return (
    <div className="learning-page">
      <header className="learning-page-head">
        <h1>选择学习库</h1>
        <p>选定一个学习库作为整体学习目标，后续学习集从中抽取单词</p>
      </header>

      {message && <p className="learning-hint">{message}</p>}

      {loading ? (
        <p className="learning-status">加载中…</p>
      ) : (
        <div className="learning-library-grid">
          {libraries.map((lib) => {
            const current = profile?.currentLibraryId === lib.id
            return (
              <div key={lib.id} className={`learning-library-card${current ? ' is-current' : ''}`}>
                <div className="learning-library-head">
                  <strong>{lib.name}</strong>
                  {current && <span className="learning-badge">当前目标</span>}
                </div>
                <p className="learning-library-desc">{lib.description || '—'}</p>
                <div className="learning-library-meta">
                  <span>{lib.wordCount} 词</span>
                  {lib.sourceTier && <span>来源：{lib.sourceTier}</span>}
                </div>
                <button
                  type="button"
                  className={current ? 'learning-secondary' : 'learning-primary'}
                  onClick={() => choose(lib.id)}
                >
                  {current ? '已选择' : '设为目标'}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {profile?.currentLibraryId && (
        <div className="learning-form-actions">
          <button type="button" className="learning-primary" onClick={() => nav.go('plan')}>
            下一步：设定学习集
          </button>
        </div>
      )}
    </div>
  )
}
