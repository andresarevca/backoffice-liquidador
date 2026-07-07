import { useEffect, useState } from 'react'

import { api } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { AdminUsuario, AdminUsuarioInput } from '@/types'

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const FORM_VACIO: AdminUsuarioInput = { email: '', nombre: '', password: '', is_staff: false, is_active: true }

export function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<AdminUsuario[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [dialogAbierto, setDialogAbierto] = useState(false)
  const [editando, setEditando] = useState<AdminUsuario | null>(null)
  const [form, setForm] = useState<AdminUsuarioInput>(FORM_VACIO)
  const [formError, setFormError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  const cargar = () => {
    setLoading(true)
    api
      .usuarios()
      .then(setUsuarios)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(cargar, [])

  const abrirCrear = () => {
    setEditando(null)
    setForm(FORM_VACIO)
    setFormError(null)
    setDialogAbierto(true)
  }

  const abrirEditar = (u: AdminUsuario) => {
    setEditando(u)
    setForm({ email: u.email, nombre: u.nombre, password: '', is_staff: u.is_staff, is_active: u.is_active })
    setFormError(null)
    setDialogAbierto(true)
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setGuardando(true)
    setFormError(null)
    try {
      if (editando) {
        const cambios: Partial<AdminUsuarioInput> = {
          email: form.email,
          nombre: form.nombre,
          is_staff: form.is_staff,
          is_active: form.is_active,
        }
        if (form.password) cambios.password = form.password
        await api.actualizarUsuario(editando.id, cambios)
      } else {
        await api.crearUsuario(form)
      }
      setDialogAbierto(false)
      cargar()
    } catch (err) {
      setFormError((err as Error).message || 'No se pudo guardar el usuario.')
    } finally {
      setGuardando(false)
    }
  }

  const onEliminar = async (u: AdminUsuario) => {
    if (!window.confirm(`¿Eliminar al usuario ${u.email}? Sus carpetas quedarán sin asignar.`)) return
    try {
      await api.eliminarUsuario(u.id)
      cargar()
    } catch (err) {
      setError((err as Error).message || 'No se pudo eliminar el usuario.')
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Usuarios</h1>
        <p className="text-sm text-muted-foreground">Alta, edición y baja de usuarios del sistema.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Usuarios del sistema</CardTitle>
            <Button size="sm" onClick={abrirCrear}>
              Nuevo usuario
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {error && (
            <div className="m-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
              {error}
            </div>
          )}
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                {['Nombre', 'Email', 'Rol', 'Estado', 'Casos', 'Alta', ''].map((h) => (
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
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    Cargando usuarios...
                  </td>
                </tr>
              ) : usuarios.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    No hay usuarios registrados.
                  </td>
                </tr>
              ) : (
                usuarios.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{u.nombre}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.is_staff ? 'Admin' : 'Liquidador'}</td>
                    <td className="px-4 py-3">
                      <span className={u.is_active ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}>
                        {u.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{u.carpetas_count}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                      {formatDate(u.date_joined)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="ghost" onClick={() => abrirEditar(u)}>
                        Editar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => onEliminar(u)}>
                        Eliminar
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={dialogAbierto} onOpenChange={setDialogAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar usuario' : 'Nuevo usuario'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{editando ? 'Nueva contraseña (opcional)' : 'Contraseña'}</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required={!editando}
                autoComplete="new-password"
              />
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-input"
                  checked={form.is_staff}
                  onChange={(e) => setForm({ ...form, is_staff: e.target.checked })}
                />
                Administrador (acceso al backoffice)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-input"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                />
                Activo
              </label>
            </div>

            {formError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                {formError}
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogAbierto(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={guardando}>
                {guardando ? 'Guardando...' : 'Guardar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
