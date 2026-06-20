import { useEffect } from 'react'
import { AdminAuthProvider, useAdminAuth } from './AdminAuthContext'
import { AdminLoginPage } from './AdminLoginPage'
import { AdminPage } from '../pages/AdminPage'
import '../App.css'

function AdminAppContent() {
  const { admin, loading, logout } = useAdminAuth()

  useEffect(() => {
    document.title = '管理后台'
  }, [])

  if (loading) {
    return (
      <div className="module">
        <main className="app-main">
          <p className="vocab-status">正在验证登录状态...</p>
        </main>
      </div>
    )
  }

  if (!admin) {
    return <AdminLoginPage />
  }

  return (
    <AdminPage
      user={{ displayName: admin.displayName }}
      onBack={() => {
        window.location.href = '/'
      }}
      onLogout={() => void logout()}
    />
  )
}

export function AdminApp() {
  return (
    <AdminAuthProvider>
      <AdminAppContent />
    </AdminAuthProvider>
  )
}
