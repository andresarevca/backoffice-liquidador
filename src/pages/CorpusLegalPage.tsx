import { useEffect, useRef, useState } from 'react'

import { api } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { FuentesCorpus } from '@/types'

export function CorpusLegalPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fuentes, setFuentes] = useState<FuentesCorpus | null>(null)
  const [fuentesError, setFuentesError] = useState<string | null>(null)
  const [municipio, setMunicipio] = useState('Nacional')
  const [subiendo, setSubiendo] = useState(false)
  const [subidaOk, setSubidaOk] = useState<string | null>(null)
  const [subidaError, setSubidaError] = useState<string | null>(null)

  const cargarFuentes = () => {
    api
      .corpusFuentes()
      .then(setFuentes)
      .catch((e: Error) => setFuentesError(e.message))
  }

  useEffect(cargarFuentes, [])

  const handleEliminar = async (fuente: string) => {
    if (!window.confirm(`¿Eliminar "${fuente}" del corpus global? Dejará de estar disponible para todos los usuarios.`)) return
    setSubidaError(null)
    setSubidaOk(null)
    try {
      await api.corpusEliminar(fuente)
      cargarFuentes()
    } catch (err) {
      setSubidaError((err as Error).message)
    }
  }

  const handleSubir = async (e: React.FormEvent) => {
    e.preventDefault()
    const archivo = fileInputRef.current?.files?.[0]
    if (!archivo) {
      setSubidaError('Seleccioná un archivo PDF o DOCX.')
      return
    }
    setSubiendo(true)
    setSubidaError(null)
    setSubidaOk(null)
    try {
      const res = await api.corpusIndexar(archivo, municipio.trim() || 'Nacional')
      setSubidaOk(`"${res.titulo}" indexado: ${res.chunks_indexados} fragmento(s) (municipio: ${res.municipio}).`)
      if (fileInputRef.current) fileInputRef.current.value = ''
      cargarFuentes()
    } catch (err) {
      setSubidaError((err as Error).message)
    } finally {
      setSubiendo(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Corpus Legal Global</h1>
        <p className="text-sm text-muted-foreground">
          Leyes y ordenanzas oficiales visibles para todos los usuarios. Los documentos que cada
          usuario sube desde la aplicación son privados y no aparecen aquí.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-4 lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold">Documentos globales</h2>
          {fuentesError ? (
            <p className="text-sm text-red-600 dark:text-red-400">{fuentesError}</p>
          ) : !fuentes ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : fuentes.fuentes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todavía no hay documentos globales.</p>
          ) : (
            <>
              <p className="mb-3 text-sm text-muted-foreground">
                {fuentes.fuentes.length} documento(s) · {fuentes.total_chunks} fragmentos
              </p>
              <ul className="space-y-1 text-sm">
                {fuentes.fuentes.map((f) => (
                  <li key={f} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2">
                    <span className="truncate">{f}</span>
                    <Button type="button" variant="ghost" size="sm" onClick={() => handleEliminar(f)}>
                      Eliminar
                    </Button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>

        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">Publicar en el corpus global (PDF o DOCX)</h2>
          <form onSubmit={handleSubir} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="corpus-file">Archivo</Label>
              <Input id="corpus-file" type="file" accept=".pdf,.docx" ref={fileInputRef} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="corpus-municipio">Municipio</Label>
              <Input
                id="corpus-municipio"
                placeholder="Nacional"
                value={municipio}
                onChange={(e) => setMunicipio(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={subiendo} className="w-full">
              {subiendo ? 'Indexando...' : 'Publicar documento'}
            </Button>
            {subidaError && <p className="text-sm text-red-600 dark:text-red-400">{subidaError}</p>}
            {subidaOk && <p className="text-sm text-emerald-600 dark:text-emerald-400">{subidaOk}</p>}
          </form>
        </Card>
      </div>
    </div>
  )
}
