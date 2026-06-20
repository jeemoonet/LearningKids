import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  adminLogin as adminLoginRequest,
  adminLogout as adminLogoutRequest,
  fetchAdminSession,
  type AdminUser,
} from './adminAuthApi'
import { registerAdminUnauthorized } from './adminApiFetch'

interface AdminAuthContextValue {
  admin: AdminUser | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null)

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    registerAdminUnauthorized(() => setAdmin(null))
  }, [])

  useEffect(() => {
    fetchAdminSession()
      .then(setAdmin)
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const nextAdmin = await adminLoginRequest(username, password)
    setAdmin(nextAdmin)
  }, [])

  const logout = useCallback(async () => {
    await adminLogoutRequest()
    setAdmin(null)
  }, [])

  const value = useMemo(
    () => ({ admin, loading, login, logout }),
    [admin, loading, login, logout],
  )

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}

export function useAdminAuth(): AdminAuthContextValue {
  const context = useContext(AdminAuthContext)
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider')
  }
  return context
}
