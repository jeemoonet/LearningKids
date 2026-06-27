import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AdminApp } from './admin/AdminApp.tsx'

const path = window.location.pathname
const isAdminEntry = path === '/admin' || path.startsWith('/admin/')

function Root() {
  if (isAdminEntry) return <AdminApp />
  return <App />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
