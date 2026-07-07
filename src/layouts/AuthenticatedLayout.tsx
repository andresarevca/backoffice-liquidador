import { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'

import { AppSidebar } from '@/components/app-sidebar'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { useAuth } from '@/lib/auth'
import { ModeToggle } from '@/components/mode-toggle'

export function AuthenticatedLayout() {
  const { isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate('/auth', { replace: true })
  }, [loading, isAuthenticated, navigate])

  if (loading || !isAuthenticated) return null

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted/30">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-12 items-center justify-between gap-2 border-b bg-background/80 px-3 backdrop-blur">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <span className="text-sm font-medium text-muted-foreground">
                Backoffice Liquidador — Gestión y métricas
              </span>
            </div>
            <ModeToggle />
          </header>
          <main className="flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
