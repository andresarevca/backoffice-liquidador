import { AlertCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'

type ErrorStateProps = {
  message: string
  onRetry?: () => void
  title?: string
}

export function ErrorState({ message, onRetry, title = 'No se pudo cargar la información' }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700 sm:flex-row sm:items-center dark:border-red-900 dark:bg-red-950 dark:text-red-300"
    >
      <AlertCircle className="h-5 w-5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="font-medium">{title}</p>
        <p className="break-words text-xs opacity-90">{message}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="bg-background text-foreground">
          Reintentar
        </Button>
      )}
    </div>
  )
}
