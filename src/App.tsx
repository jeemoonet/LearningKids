import { useState } from 'react'
import type { AppView } from './app/types'
import { AuthProvider, useAuth } from './modules/auth/AuthContext'
import { GraphModule } from './modules/graph/GraphModule'
import { SignTrainingModule } from './modules/sign-training/SignTrainingModule'
import { VocabTrainingModule } from './modules/vocab-training/VocabTrainingModule'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import './App.css'

function AppContent() {
  const [view, setView] = useState<AppView>('home')
  const { user, loading, logout } = useAuth()

  return (
    <div className="app">
      {view === 'home' && (
        <HomePage
          user={user}
          authLoading={loading}
          onLogout={() => void logout()}
          onEnterGraph={() => setView('graph')}
          onEnterSignTraining={() => setView('sign-training')}
          onEnterVocabTraining={() => setView('vocab-training')}
        />
      )}

      {view === 'graph' && <GraphModule onBack={() => setView('home')} />}

      {view === 'sign-training' && <SignTrainingModule onBack={() => setView('home')} />}

      {view === 'vocab-training' && loading && (
        <div className="module">
          <main className="app-main">
            <p className="vocab-status">正在验证登录状态...</p>
          </main>
        </div>
      )}

      {view === 'vocab-training' && !loading && !user && (
        <LoginPage onCancel={() => setView('home')} />
      )}

      {view === 'vocab-training' && !loading && user && (
        <VocabTrainingModule onBack={() => setView('home')} />
      )}

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
