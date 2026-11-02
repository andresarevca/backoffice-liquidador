import { useEffect, useState } from 'react'

import type { ListParams, Page } from '@/types'

export const PAGE_SIZE = 20
const SEARCH_DEBOUNCE_MS = 300

type Result<T> = { key: string; data?: Page<T>; error?: string }

type Options<T> = {
  /** Cada cuántos ms refrescar en segundo plano (sin spinner) mientras `shouldPoll` devuelva true. */
  pollMs?: number
  shouldPoll?: (items: T[]) => boolean
}

/**
 * Lista paginada con búsqueda/filtro en el servidor.
 * - La búsqueda se envía con debounce y vuelve a la página 1 al cambiar filtros.
 * - `fetcher` debe ser una referencia estable (por ejemplo `api.carpetasPage`).
 */
export function usePagedList<T>(
  fetcher: (params: ListParams) => Promise<Page<T>>,
  filters: { search: string; estado?: string },
  options: Options<T> = {},
) {
  const { pollMs, shouldPoll } = options
  const { search, estado } = filters

  const [debouncedSearch, setDebouncedSearch] = useState(search)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [search])

  const filterKey = `${debouncedSearch}|${estado ?? ''}`
  const [pageState, setPageState] = useState({ key: filterKey, page: 1 })
  const page = pageState.key === filterKey ? pageState.page : 1
  const setPage = (p: number) => setPageState({ key: filterKey, page: p })

  const [tick, setTick] = useState(0)
  const requestKey = `${filterKey}|${page}|${tick}`
  const [result, setResult] = useState<Result<T> | null>(null)

  useEffect(() => {
    let cancelled = false
    fetcher({ page, search: debouncedSearch || undefined, estado: estado || undefined })
      .then((data) => !cancelled && setResult({ key: requestKey, data }))
      .catch((e: Error) => !cancelled && setResult({ key: requestKey, error: e.message }))
    return () => {
      cancelled = true
    }
  }, [fetcher, requestKey, page, debouncedSearch, estado])

  const items = result?.data?.results ?? []
  const polling = Boolean(pollMs && shouldPoll?.(items))

  useEffect(() => {
    if (!polling || !pollMs) return
    const id = setInterval(() => {
      if (document.visibilityState !== 'visible') return
      fetcher({ page, search: debouncedSearch || undefined, estado: estado || undefined })
        .then((data) => setResult((r) => (r?.key === requestKey ? { key: requestKey, data } : r)))
        .catch(() => undefined)
    }, pollMs)
    return () => clearInterval(id)
  }, [polling, pollMs, fetcher, requestKey, page, debouncedSearch, estado])

  const current = result?.key === requestKey
  return {
    items,
    count: result?.data?.count ?? 0,
    page,
    setPage,
    pageCount: Math.max(1, Math.ceil((result?.data?.count ?? 0) / PAGE_SIZE)),
    loading: !current,
    firstLoad: result === null,
    error: current ? (result?.error ?? null) : null,
    reload: () => setTick((t) => t + 1),
  }
}
