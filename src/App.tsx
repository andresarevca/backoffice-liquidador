import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { AuthenticatedLayout } from './layouts/AuthenticatedLayout'
import { AuthPage } from './pages/AuthPage'
import { DashboardPage } from './pages/DashboardPage'
import { UsuariosPage } from './pages/UsuariosPage'
import { CasosPage } from './pages/CasosPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route element={<AuthenticatedLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/usuarios" element={<UsuariosPage />} />
          <Route path="/casos" element={<CasosPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
