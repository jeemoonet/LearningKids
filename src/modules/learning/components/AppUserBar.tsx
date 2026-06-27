import { useState } from 'react'
import type { LearningProfile } from '../api'

interface AppUserBarProps {
  userDisplayName?: string
  profile: LearningProfile | null
  onLogout: () => void
}

export function AppUserBar({ userDisplayName, profile, onLogout }: AppUserBarProps) {
  const [open, setOpen] = useState(false)
  const name = profile?.displayName ?? userDisplayName ?? '学员'
  const grade = profile?.grade

  return (
    <div className="lk-user-column">
      <div className="lk-user-bar">
        <button
          type="button"
          className="lk-user-bar__trigger"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="true"
        >
          <span className="lk-user-bar__avatar">{name.slice(0, 1)}</span>
          <span className="lk-user-bar__name">{name}</span>
          {grade && <span className="lk-user-bar__grade">{grade}</span>}
        </button>
        {open && (
          <>
            <button
              type="button"
              className="lk-user-bar__backdrop"
              aria-label="关闭菜单"
              onClick={() => setOpen(false)}
            />
            <div className="lk-user-bar__menu">
              <div className="lk-user-bar__menu-head">
                <strong>{name}</strong>
                {grade && <span>{grade}</span>}
              </div>
              <div className="lk-user-bar__stats">
                <span>单词库 {profile?.knownCount ?? 0}</span>
                <span>{profile?.currentLibraryName ?? '未选学习库'}</span>
              </div>
              <a className="lk-user-bar__menu-item" href="/admin">管理后台</a>
              <button type="button" className="lk-user-bar__menu-item" onClick={() => void onLogout()}>
                退出登录
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
