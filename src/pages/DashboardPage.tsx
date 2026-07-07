import { useEffect, useMemo, useState } from 'react'
import { Users, FolderKanban, AlertTriangle, MailWarning, Clock } from 'lucide-react'

import { api } from '@/api/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Metricas } from '@/types'

function formatDuracion(segundos: number | null) {
  if (segundos == null) return '—'
  const horas = segundos / 3600
  if (horas >= 1) return `${horas.toFixed(1)} h`
  return `${Math.round(segundos / 60)} min`
}

export function DashboardPage() {
  const [metricas, setMetricas] = useState<Metricas | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .metricas()
      .then(setMetricas)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const kpis = useMemo(() => {
    if (!metricas) return []
    return [
      { label: 'Usuarios activos', value: metricas.usuarios_activos, icon: Users, color: 'text-foreground' },
      { label: 'Total casos', value: metricas.total_carpetas, icon: FolderKanban, color: 'text-foreground' },
      {
        label: 'Tasa de error',
        value: `${metricas.tasa_error}%`,
        icon: AlertTriangle,
        color: 'text-red-600 dark:text-red-400',
      },
      {
        label: 'Correos rechazados (30d)',
        value: metricas.correos_rechazados_30d,
        icon: MailWarning,
        color: 'text-amber-600 dark:text-amber-400',
      },
      {
        label: 'Tiempo prom. procesamiento',
        value: formatDuracion(metricas.tiempo_procesamiento_promedio_segundos),
        icon: Clock,
        color: 'text-foreground',
      },
    ]
  }, [metricas])

  const maxPorDia = useMemo(
    () => Math.max(1, ...(metricas?.carpetas_por_dia.map((d) => d.total) ?? [1])),
    [metricas],
  )

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Métricas de uso de la aplicación.</p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      ) : (
        <>
          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <Card key={i}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        —
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">—</p>
                    </CardContent>
                  </Card>
                ))
              : kpis.map((k) => (
                  <Card key={k.label}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          {k.label}
                        </CardTitle>
                        <k.icon className={`h-4 w-4 ${k.color}`} />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className={`text-3xl font-bold ${k.color}`}>{k.value}</p>
                    </CardContent>
                  </Card>
                ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Carpetas por estado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {loading || !metricas ? (
                  <p className="text-sm text-muted-foreground">Cargando...</p>
                ) : Object.keys(metricas.carpetas_por_estado).length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin datos.</p>
                ) : (
                  Object.entries(metricas.carpetas_por_estado).map(([estado, total]) => (
                    <div key={estado} className="flex items-center gap-3 text-sm">
                      <span className="w-28 shrink-0 text-muted-foreground">{estado}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${(total / metricas.total_carpetas) * 100 || 0}%` }}
                        />
                      </div>
                      <span className="w-8 shrink-0 text-right font-medium">{total}</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Carpetas recibidas (últimos 30 días)</CardTitle>
              </CardHeader>
              <CardContent>
                {loading || !metricas ? (
                  <p className="text-sm text-muted-foreground">Cargando...</p>
                ) : metricas.carpetas_por_dia.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin datos en el período.</p>
                ) : (
                  <div className="flex h-32 items-end gap-1">
                    {metricas.carpetas_por_dia.map((d) => (
                      <div
                        key={d.dia}
                        className="flex-1 rounded-t bg-primary/70 transition-all hover:bg-primary"
                        style={{ height: `${(d.total / maxPorDia) * 100}%`, minHeight: '2px' }}
                        title={`${d.dia}: ${d.total} carpeta(s)`}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">Top usuarios por volumen de casos</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40">
                  <tr>
                    {['Usuario', 'Email', 'Casos'].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loading ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                        Cargando...
                      </td>
                    </tr>
                  ) : !metricas || metricas.top_usuarios.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                        Sin datos todavía.
                      </td>
                    </tr>
                  ) : (
                    metricas.top_usuarios.map((u) => (
                      <tr key={u.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">
                          {`${u.first_name} ${u.last_name}`.trim() || u.email}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                        <td className="px-4 py-3 text-right font-semibold">{u.total_carpetas}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
