import { useState } from 'react'
import type { LearningNav } from './LearningModule'
import { learningApi, type LearningProfile, type LearningSet, type SectionView } from './api'

interface PlanPageProps {
  profile: LearningProfile | null
  activeSet: LearningSet | null
  onChange: () => Promise<void>
  nav: LearningNav
}

const STATUS_LABEL: Record<SectionView['status'], string> = {
  locked: '未解锁',
  learning: '学习中',
  passed: '已通过',
}

export function PlanPage({ profile, activeSet, onChange, nav }: PlanPageProps) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const create = async () => {
    setLoading(true)
    setMessage('')
    try {
      await learningApi.createSet()
      await onChange()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '创建失败')
    } finally {
      setLoading(false)
    }
  }

  const abandon = async () => {
    if (!window.confirm('确定放弃当前学习集？已通过小节的单词仍保留在我的库中。')) return
    setLoading(true)
    try {
      await learningApi.abandonSet()
      await onChange()
    } finally {
      setLoading(false)
    }
  }

  if (!profile?.currentLibraryId) {
    return (
      <div className="learning-page">
        <header className="learning-page-head">
          <h1>设定目标与小节</h1>
        </header>
        <p className="learning-empty">请先选择一个学习库。</p>
        <button type="button" className="learning-primary" onClick={() => nav.go('library')}>
          去选库
        </button>
      </div>
    )
  }

  return (
    <div className="learning-page">
      <header className="learning-page-head">
        <h1>设定目标与小节</h1>
        <p>当前学习库：{profile.currentLibraryName}</p>
      </header>

      {message && <p className="learning-hint">{message}</p>}

      {!activeSet ? (
        <section className="learning-card">
          <h2>创建学习集</h2>
          <p>将从「{profile.currentLibraryName}」中抽取至多 100 个你尚未掌握的单词，自动拆成 5–10 个小节。</p>
          <button type="button" className="learning-primary" onClick={create} disabled={loading}>
            {loading ? '创建中…' : '创建学习集'}
          </button>
        </section>
      ) : (
        <section className="learning-card">
          <div className="learning-set-head">
            <div>
              <h2>{activeSet.libraryName} · 学习集</h2>
              <p>
                共 {activeSet.size} 词，拆成 {activeSet.sectionCount} 个小节
              </p>
            </div>
            <button type="button" className="learning-danger" onClick={abandon} disabled={loading}>
              放弃学习集
            </button>
          </div>

          <div className="learning-section-list">
            {activeSet.sections.map((s) => (
              <div key={s.id} className={`learning-section-row is-${s.status}`}>
                <span className="learning-section-seq">第 {s.seq} 节</span>
                <span className="learning-section-meta">
                  {s.wordCount} 词 · {STATUS_LABEL[s.status]}
                </span>
                <button
                  type="button"
                  className="learning-section-enter"
                  disabled={s.status === 'locked'}
                  onClick={() => nav.go('section', s.id)}
                >
                  {s.status === 'passed' ? '复习' : s.status === 'locked' ? '未解锁' : '去学习'}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
