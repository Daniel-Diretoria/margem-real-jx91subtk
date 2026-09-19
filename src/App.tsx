/* Main App Component - Handles routing (using react-router-dom), query client and other providers - use this file to add all routes */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider, useAuth } from '@/hooks/use-auth'
import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'
import Login from '@/pages/Login'
import Index from '@/pages/Index'
import Lancamentos from '@/pages/Lancamentos'
import ContasReceber from '@/pages/ContasReceber'
import ContasPagar from '@/pages/ContasPagar'
import Cadastros from '@/pages/Cadastros'
import ImportarExtrato from '@/pages/ImportarExtrato'
import DREPage from '@/pages/DRE'
import PrevistoRealizado from '@/pages/PrevistoRealizado'
import Rateio from '@/pages/Rateio'
import NotFound from '@/pages/NotFound'

// ONLY IMPORT AND RENDER WORKING PAGES, NEVER ADD PLACEHOLDER COMPONENTS OR PAGES IN THIS FILE
// AVOID REMOVING ANY CONTEXT PROVIDERS FROM THIS FILE (e.g. TooltipProvider, Toaster, Sonner)

const AppRoutes = () => {
  const { loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando…</div>
      </div>
    )
  }
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Index />} />
          <Route path="/lancamentos" element={<Lancamentos />} />
          <Route path="/contas-a-receber" element={<ContasReceber />} />
          <Route path="/contas-a-pagar" element={<ContasPagar />} />
          <Route path="/cadastros" element={<Cadastros />} />
          <Route path="/importar-extrato" element={<ImportarExtrato />} />
          <Route path="/dre" element={<DREPage />} />
          <Route path="/previsto-realizado" element={<PrevistoRealizado />} />
          <Route path="/rateio" element={<Rateio />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

const App = () => (
  <BrowserRouter>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <AppRoutes />
      </AuthProvider>
    </TooltipProvider>
  </BrowserRouter>
)

export default App
