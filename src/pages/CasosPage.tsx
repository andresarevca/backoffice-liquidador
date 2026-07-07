import { useEffect, useMemo, useState } from 'react'

import { api } from '@/api/client'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StatusBadge } from '@/components/StatusBadge'
import type { AdminCarpeta, EstadoCarpeta } from '@/types'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function CasosPage() {
  const [carpetas, setCarpetas] = useState<AdminCarpeta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [estado, setEstado] = useState<EstadoCarpeta | 'ALL'>('ALL')

  useEffect(() => {
    api
      .carpetas()
      .then(setCarpetas)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return carpetas.filter((c) => {
      const matchSearch =
        !q ||
        c.caso_id.toLowerCase().includes(q) ||
        c.email_remitente.toLowerCase().includes(q) ||
        c.email_asunto.toLowerCase().includes(q) ||
        (c.usuario_email ?? '').toLowerCase().includes(q)
      const matchEstado = estado === 'ALL' || c.estado === estado
      return matchSearch && matchEstado
    })
  }, [carpetas, search, estado])

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
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
          {loading ? '—' : `${filtered.length} de ${carpetas.length} casos`}
        </span>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      ) : (
        <Card className="overflow-hidden">
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
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    Cargando casos...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    No se encontraron casos.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-xs font-semibold">{c.caso_id}</td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-muted-foreground">
                      {c.usuario_nombre ?? (
                        <span className="italic text-red-600 dark:text-red-400">sin asignar</span>
                      )}
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-muted-foreground">
                      {c.email_remitente}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge estado={c.estado} />
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground">
                      {c.total_documentos}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                      {formatDate(c.recibida_en)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
