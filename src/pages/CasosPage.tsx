import { useState } from 'react'
import { FolderOpen } from 'lucide-react'

import { api } from '@/api/client'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Pagination } from '@/components/Pagination'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { usePagedList } from '@/hooks/use-paged-list'
import type { AdminCarpeta, EstadoCarpeta } from '@/types'

const POLL_MS = 8000

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

const enCurso = (items: AdminCarpeta[]) =>
  items.some((c) => c.estado === 'PROCESANDO' || c.estado === 'RECIBIDA')

function SinAsignar() {
  return <span className="italic text-red-600 dark:text-red-400">sin asignar</span>
}

export function CasosPage() {
  const [search, setSearch] = useState('')
  const [estado, setEstado] = useState<EstadoCarpeta | 'ALL'>('ALL')

  const { items, count, page, setPage, pageCount, loading, firstLoad, error, reload } =
    usePagedList<AdminCarpeta>(
      api.carpetasPage,
      { search, estado: estado === 'ALL' ? undefined : estado },
      { pollMs: POLL_MS, shouldPoll: enCurso },
    )

  const hayFiltros = search.trim() !== '' || estado !== 'ALL'
  const limpiarFiltros = () => {
    setSearch('')
    setEstado('ALL')
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Casos</h1>
        <p className="text-sm text-muted-foreground">
          Vista global de todas las carpetas del sistema, de todos los usuarios.
        </p>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Buscar por caso, remitente, asunto o usuario..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <Select value={estado} onValueChange={(v) => setEstado(v as EstadoCarpeta | 'ALL')}>
          <SelectTrigger className="sm:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos los estados</SelectItem>
            <SelectItem value="RECIBIDA">Recibida</SelectItem>
            <SelectItem value="PROCESANDO">Procesando</SelectItem>
            <SelectItem value="COMPLETADA">Completada</SelectItem>
            <SelectItem value="ERROR">Error</SelectItem>
          </SelectContent>
        </Select>
        <span className="whitespace-nowrap text-xs text-muted-foreground">
          {firstLoad ? '—' : `${count} caso${count === 1 ? '' : 's'}`}
        </span>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : firstLoad ? (
        <Card className="px-4 py-12 text-center text-sm text-muted-foreground">Cargando casos...</Card>
      ) : items.length === 0 ? (
        <Card>
          <EmptyState
            icon={FolderOpen}
            title={hayFiltros ? 'No se encontraron casos' : 'Aún no hay casos'}
            description={
              hayFiltros
                ? 'Prueba con otra búsqueda o quita los filtros.'
                : 'Los casos aparecen cuando llega un correo con la documentación del siniestro.'
            }
            action={
              <Button variant="outline" size="sm" onClick={hayFiltros ? limpiarFiltros : reload}>
                {hayFiltros ? 'Limpiar filtros' : 'Actualizar'}
              </Button>
            }
          />
        </Card>
      ) : (
        <div className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
          {/* Móvil: tarjetas */}
          <ul className="space-y-3 md:hidden">
            {items.map((c) => (
              <li key={c.id} className="rounded-lg border bg-card p-4 shadow-sm">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <span className="break-all font-mono text-sm font-semibold">{c.caso_id}</span>
                  <StatusBadge estado={c.estado} />
                </div>
                <p className="line-clamp-2 text-sm">{c.email_asunto}</p>
                <p className="mt-1 truncate text-xs text-muted-foreground">{c.email_remitente}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {c.usuario_nombre ?? <SinAsignar />} · {c.total_documentos} doc
                  {c.total_documentos === 1 ? '' : 's'} · {formatDate(c.recibida_en)}
                </p>
              </li>
            ))}
          </ul>

          {/* Escritorio: tabla */}
          <Card className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40">
                <tr>
                  {['Caso ID', 'Usuario', 'Remitente', 'Estado', 'Docs', 'Recibida'].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-xs font-semibold">{c.caso_id}</td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-muted-foreground">
                      {c.usuario_nombre ?? <SinAsignar />}
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-muted-foreground">
                      {c.email_remitente}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge estado={c.estado} />
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{c.total_documentos}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                      {formatDate(c.recibida_en)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <Pagination
            page={page}
            pageCount={pageCount}
            count={count}
            noun="casos"
            disabled={loading}
            onPage={setPage}
          />
        </div>
      )}
    </div>
  )
}
