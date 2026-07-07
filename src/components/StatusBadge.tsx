import type { EstadoCarpeta } from '../types'
import { cn } from '@/lib/utils'

const styles: Record<EstadoCarpeta, string> = {
  RECIBIDA: 'bg-blue-50 text-blue-700 ring-blue-200',
  PROCESANDO: 'bg-amber-50 text-amber-700 ring-amber-200',
  COMPLETADA: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  ERROR: 'bg-red-50 text-red-700 ring-red-200',
}

const dots: Record<EstadoCarpeta, string> = {
  RECIBIDA: 'bg-blue-500',
  PROCESANDO: 'bg-amber-500',
  COMPLETADA: 'bg-emerald-500',
  ERROR: 'bg-red-500',
}

const labels: Record<EstadoCarpeta, string> = {
  RECIBIDA: 'Recibida',
  PROCESANDO: 'Procesando',
  COMPLETADA: 'Completada',
  ERROR: 'Error',
}

export function StatusBadge({ estado }: { estado: EstadoCarpeta }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        styles[estado],
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', dots[estado])} />
      {labels[estado]}
    </span>
  )
}
