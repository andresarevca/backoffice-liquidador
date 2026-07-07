import { useEffect, useState } from 'react'
import { api } from '@/api/client'
import type { UserProfile } from '@/types'
import { AUTH_EVENT, clearTokens, getAccessToken } from './tokens'

const USER_CACHE_KEY = 'backoffice.liquidador.user'

export type AuthUser = UserProfile

function getCachedUser(): AuthUser | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(USER_CACHE_KEY)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

function setCachedUser(user: AuthUser | null) {
  if (typeof window === 'undefined') return
  if (user) {
    window.localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user))
  } else {
    window.localStorage.removeItem(USER_CACHE_KEY)
  }
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(() => getCachedUser())
  const [loading, setLoading] = useState(() => !!getAccessToken() && !getCachedUser())

  useEffect(() => {
    const sync = () => {
      setUser(getCachedUser())
      if (!getAccessToken()) setLoading(false)
    }
    window.addEventListener(AUTH_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(AUTH_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  useEffect(() => {
    if (!getAccessToken() || user) {
      setLoading(false)
      return
    }
    let active = true
    api
      .me()
      .then((profile) => {
        if (!active) return
        if (profile.rol !== 'Admin') {
          clearTokens()
          setCachedUser(null)
          return
        }
        setCachedUser(profile)
        setUser(profile)
      })
      .catch(() => {
        clearTokens()
        setCachedUser(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [user])

  return {
    user,
    loading,
    isAuthenticated: !!getAccessToken() && !!user,
    login: async (email: string, password: string) => {
      await api.authLogin(email, password)
      const profile = await api.me()
      if (profile.rol !== 'Admin') {
        api.logout()
        throw new Error('No tenés permisos de administrador para acceder al backoffice.')
      }
      setCachedUser(profile)
      setUser(profile)
    },
    logout: () => {
      api.logout()
      setCachedUser(null)
      setUser(null)
    },
  }
}
