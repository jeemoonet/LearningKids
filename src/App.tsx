import { AuthProvider, useAuth } from './modules/auth/AuthContext'
import { LearningModule } from './modules/learning/LearningModule'
import { LoginPage } from './pages/LoginPage'
import './App.css'

function AppContent() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="app">
        <div className="module">
          <main className="app-main">
            <p className="learning-status">正在验证登录状态...</p>
          </main>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="app">
        <LoginPage
          title="LearningKids"
          subtitle="我的世界建军团 · 冒险星球远征 · 训练营专项"
        />
      </div>
    )
  }

  return (
    <div className="app">
      <LearningModule />
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
