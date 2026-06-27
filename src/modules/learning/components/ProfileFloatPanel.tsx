import { useEffect, useState } from 'react'
import { learningApi, type LearningProfile } from '../api'

interface ProfileFloatPanelProps {
  profile: LearningProfile | null
  onRefresh: () => Promise<void>
  onClose: () => void
}

export function ProfileFloatPanel({ profile, onRefresh, onClose }: ProfileFloatPanelProps) {
  const [displayName, setDisplayName] = useState(profile?.displayName ?? '')
  const [grade, setGrade] = useState(profile?.grade ?? '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    setDisplayName(profile?.displayName ?? '')
    setGrade(profile?.grade ?? '')
  }, [profile])

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
    <div className="lw-wordbank-overlay" onClick={onClose}>
      <aside
        className="lw-profile-panel"
        role="dialog"
        aria-label="我的资料"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="lw-wordbank-head">
          <div>
            <h2 className="lw-wordbank-title">我的资料</h2>
            <p className="lw-wordbank-sub">维护学员信息与学习档案</p>
          </div>
          <button type="button" className="lw-wordbank-close" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </header>

        <div className="lw-profile-body">
          <div className="lw-profile-field">
            <label htmlFor="lw-profile-name">昵称</label>
            <input
              id="lw-profile-name"
              className="lw-profile-input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <div className="lw-profile-field">
            <label htmlFor="lw-profile-grade">年级</label>
            <input
              id="lw-profile-grade"
              className="lw-profile-input"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              placeholder="如：初一 / 初二 / 初三"
            />
          </div>
          <div className="lw-profile-stats">
            <div>
              <span className="lw-profile-stats__num">{profile?.knownCount ?? 0}</span>
              <span className="lw-profile-stats__label">掌握单词</span>
            </div>
            <div>
              <span className="lw-profile-stats__num lw-profile-stats__num--text">
                {profile?.currentLibraryName ?? '未选择'}
              </span>
              <span className="lw-profile-stats__label">当前学习库</span>
            </div>
          </div>
          <div className="lw-profile-actions">
            <button
              type="button"
              className="lw-map-action lw-map-action--primary"
              onClick={() => void handleSave()}
              disabled={saving}
            >
              {saving ? '保存中…' : '保存资料'}
            </button>
            {message && <span className="lw-map-library__hint">{message}</span>}
          </div>
        </div>
      </aside>
    </div>
  )
}
