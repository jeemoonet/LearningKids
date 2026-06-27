import { useEffect, useState } from 'react'
import { learningApi, type KnownWord, type LearningProfile } from './api'

interface ProfilePageProps {
  profile: LearningProfile | null
  onRefresh: () => Promise<void>
}

export function ProfilePage({ profile, onRefresh }: ProfilePageProps) {
  const [displayName, setDisplayName] = useState(profile?.displayName ?? '')
  const [grade, setGrade] = useState(profile?.grade ?? '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [known, setKnown] = useState<KnownWord[]>([])

  useEffect(() => {
    setDisplayName(profile?.displayName ?? '')
    setGrade(profile?.grade ?? '')
  }, [profile])

  useEffect(() => {
    learningApi.listKnownWords().then(({ words }) => setKnown(words)).catch(() => undefined)
  }, [profile?.knownCount])

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    try {
      await learningApi.updateProfile({ displayName, grade })
      await onRefresh()
      setMessage('已保存')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="learning-page">
      <header className="learning-page-head">
        <h1>我的资料</h1>
        <p>维护学员信息，查看已掌握的单词库</p>
      </header>

      <section className="learning-card">
        <div className="learning-form-row">
          <label>昵称</label>
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </div>
        <div className="learning-form-row">
          <label>年级</label>
          <input
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            placeholder="如：初一 / 初二 / 初三"
          />
        </div>
        <div className="learning-form-actions">
          <button type="button" className="learning-primary" onClick={handleSave} disabled={saving}>
            {saving ? '保存中…' : '保存'}
          </button>
          {message && <span className="learning-hint">{message}</span>}
        </div>
      </section>

      <section className="learning-card">
        <h2>我的单词库（{known.length}）</h2>
        {known.length === 0 ? (
          <p className="learning-empty">还没有掌握的单词，先去初始化或学习吧。</p>
        ) : (
          <div className="learning-known-grid">
            {known.map((w) => (
              <span key={w.word} className={`learning-known-chip learning-known-${w.source}`}>
                {w.word}
              </span>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
