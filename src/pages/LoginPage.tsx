import { useState, type FormEvent } from 'react'
import { useAuth } from '../modules/auth/AuthContext'

interface LoginPageProps {
  onSuccess?: () => void
  onCancel?: () => void
  title?: string
  subtitle?: string
  allowRegister?: boolean
}

export function LoginPage({
  onSuccess,
  onCancel,
  title,
  subtitle,
  allowRegister = true,
}: LoginPageProps) {
  const { login, register } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      if (mode === 'login') {
        await login(username, password)
      } else {
        await register(username, password, displayName || username)
      }
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>{title ?? (mode === 'login' ? '登录' : '注册')}</h2>
        <p className="auth-subtitle">
          {subtitle ?? '单词学习进度保存在服务器，登录后可跨设备同步'}
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <label className="auth-field">
              <span>昵称</span>
              <input
                type="text"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="可选，默认同用户名"
                autoComplete="nickname"
              />
            </label>
          )}

          <label className="auth-field">
            <span>用户名</span>
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
              autoComplete="username"
            />
          </label>

          <label className="auth-field">
            <span>密码</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </label>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="auth-submit" disabled={submitting}>
            {submitting ? '提交中…' : mode === 'login' ? '登录' : '注册并登录'}
          </button>
        </form>

        <div className="auth-switch">
          {allowRegister && (
            <button
              type="button"
              className="auth-link-button"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login')
                setError('')
              }}
            >
              {mode === 'login' ? '没有账号？注册' : '已有账号？登录'}
            </button>
          )}
          {onCancel && (
            <button type="button" className="auth-link-button" onClick={onCancel}>
              返回
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
