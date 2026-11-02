import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'

type PaginationProps = {
  page: number
  pageCount: number
  count: number
  noun: string
  disabled?: boolean
  onPage: (page: number) => void
}

export function Pagination({ page, pageCount, count, noun, disabled, onPage }: PaginationProps) {
  if (count === 0) return null
  return (
    <div className="mt-4 flex flex-col items-center justify-between gap-3 text-sm sm:flex-row">
      <span className="text-xs text-muted-foreground">
        {count} {noun} · Página {page} de {pageCount}
      </span>
      <div className="flex w-full gap-2 sm:w-auto">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 sm:flex-none"
          disabled={disabled || page <= 1}
          onClick={() => onPage(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" /> Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 sm:flex-none"
          disabled={disabled || page >= pageCount}
          onClick={() => onPage(page + 1)}
        >
          Siguiente <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
