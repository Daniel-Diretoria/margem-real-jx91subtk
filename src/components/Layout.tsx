import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import {
  LayoutDashboard,
  ArrowLeftRight,
  TrendingUp,
  CreditCard,
  BookOpen,
  Upload,
  LogOut,
} from 'lucide-react'

const nav = [
  { to: '/', label: 'Painel', icon: LayoutDashboard },
  { to: '/lancamentos', label: 'Lançamentos', icon: ArrowLeftRight },
  { to: '/contas-a-receber', label: 'A Receber', icon: TrendingUp },
  { to: '/contas-a-pagar', label: 'A Pagar', icon: CreditCard },
  { to: '/importar-extrato', label: 'Importar extrato', icon: Upload },
  { to: '/cadastros', label: 'Cadastros', icon: BookOpen },
]

export default function Layout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen">
      <aside className="hidden md:flex w-60 flex-col border-r bg-card">
        <div className="px-5 py-5 border-b">
          <div className="text-lg font-bold leading-tight">Margem Real</div>
          <div className="text-xs text-muted-foreground">Consolidação financeira</div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ' +
                (isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground')
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t px-4 py-3">
          <div className="text-sm font-medium truncate">{user?.name || user?.email}</div>
          <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full justify-start gap-2 text-muted-foreground"
            onClick={() => {
              signOut()
              navigate('/login')
            }}
          >
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar mobile */}
        <header className="md:hidden border-b bg-card px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="font-bold">Margem Real</div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                signOut()
                navigate('/login')
              }}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
          <nav className="mt-2 flex gap-1 overflow-x-auto pb-1">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  'whitespace-nowrap rounded-md px-3 py-1.5 text-xs ' +
                  (isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground')
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </header>

        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
