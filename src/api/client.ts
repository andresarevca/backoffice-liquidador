import type {
  AdminCarpeta,
  AdminUsuario,
  AdminUsuarioInput,
  CorreoRechazado,
  FuentesCorpus,
  IndexarPdfResponse,
  Metricas,
  UserProfile,
} from '../types'
import { clearTokens, getAccessToken, getRefreshToken, setAccessToken, setTokens } from '../lib/tokens'

let refreshPromise: Promise<boolean> | null = null

async function tryRefresh(): Promise<boolean> {
  const refresh = getRefreshToken()
  if (!refresh) return false

  if (!refreshPromise) {
    refreshPromise = fetch('/api/auth/refresh/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    })
      .then(async (res) => {
        if (!res.ok) return false
        const data = (await res.json()) as { access: string }
        setAccessToken(data.access)
        return true
      })
      .catch(() => false)
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

function authHeaders(extra?: HeadersInit): Headers {
  const headers = new Headers(extra)
  const access = getAccessToken()
  if (access) headers.set('Authorization', `Bearer ${access}`)
  return headers
}

async function request<T>(path: string, options?: RequestInit, _retried = false): Promise<T> {
  const res = await fetch(`/api${path}`, { ...options, headers: authHeaders(options?.headers) })

  if (res.status === 401 && !_retried && (await tryRefresh())) {
    return request<T>(path, options, true)
  }

  if (res.status === 401) {
    clearTokens()
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `${res.status} ${res.statusText}`)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

async function requestList<T>(path: string): Promise<T[]> {
  const data = await request<T[] | { results: T[]; next: string | null }>(path)
  if (Array.isArray(data)) return data

  const results = [...data.results]
  let next = data.next
  while (next) {
    const page = await request<{ results: T[]; next: string | null }>(next.replace(/^.*\/api/, ''))
    results.push(...page.results)
    next = page.next
  }
  return results
}

async function requestUpload<T>(path: string, formData: FormData, _retried = false): Promise<T> {
  const res = await fetch(`/api${path}`, { method: 'POST', body: formData, headers: authHeaders() })

  if (res.status === 401 && !_retried && (await tryRefresh())) {
    return requestUpload<T>(path, formData, true)
  }
  if (res.status === 401) {
    clearTokens()
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `${res.status} ${res.statusText}`)
  }
  return res.json() as Promise<T>
}

function json(body: unknown): RequestInit {
  return { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
}

export const api = {
  authLogin: async (username: string, password: string) => {
    const res = await fetch('/api/auth/login/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => null)
      throw new Error(data?.detail ?? 'No se pudo iniciar sesión.')
    }
    const data = (await res.json()) as { access: string; refresh: string }
    setTokens(data.access, data.refresh)
  },
  me: () => request<UserProfile>('/auth/me/'),
  logout: () => clearTokens(),

  usuarios: () => requestList<AdminUsuario>('/admin/usuarios/'),
  crearUsuario: (data: AdminUsuarioInput) =>
    request<AdminUsuario>('/admin/usuarios/', { method: 'POST', ...json(data) }),
  actualizarUsuario: (id: number, data: Partial<AdminUsuarioInput>) =>
    request<AdminUsuario>(`/admin/usuarios/${id}/`, { method: 'PATCH', ...json(data) }),
  eliminarUsuario: (id: number) =>
    request<void>(`/admin/usuarios/${id}/`, { method: 'DELETE' }),

  carpetas: (usuarioId?: number) =>
    requestList<AdminCarpeta>(`/admin/carpetas/${usuarioId ? `?usuario=${usuarioId}` : ''}`),
  carpeta: (id: string) => request<AdminCarpeta>(`/admin/carpetas/${id}/`),

  correosRechazados: () => requestList<CorreoRechazado>('/admin/correos-rechazados/'),

  metricas: () => request<Metricas>('/admin/metricas/'),

  corpusFuentes: () => request<FuentesCorpus>('/admin/corpus/fuentes/'),
  corpusEliminar: (fuente: string) =>
    request<{ chunks_eliminados: number }>(`/admin/corpus/fuente/?fuente=${encodeURIComponent(fuente)}`, {
      method: 'DELETE',
    }),
  corpusIndexar: (archivo: File, municipio: string) => {
    const formData = new FormData()
    formData.append('archivo', archivo)
    formData.append('municipio', municipio)
    return requestUpload<IndexarPdfResponse>('/admin/corpus/indexar-pdf/', formData)
  },
}
