import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'

// Gate on isAuthenticated (authStore.isValid), never on !!user.
export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando…</div>
      </div>
    )
  }
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}
