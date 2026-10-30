export type EstadoCarpeta = 'RECIBIDA' | 'PROCESANDO' | 'COMPLETADA' | 'ERROR'

export interface UserProfile {
  email: string
  nombre: string
  rol: 'Admin' | 'Liquidador'
}

export interface AdminUsuario {
  id: number
  email: string
  nombre: string
  is_staff: boolean
  is_active: boolean
  date_joined: string
  last_login: string | null
  carpetas_count: number
}

export interface AdminUsuarioInput {
  email: string
  nombre: string
  password?: string
  is_staff: boolean
  is_active: boolean
}

export interface AdminCarpeta {
  id: string
  caso_id: string
  usuario_id: number | null
  usuario_email: string | null
  usuario_nombre: string | null
  email_remitente: string
  email_asunto: string
  estado: EstadoCarpeta
  recibida_en: string
  procesada_en: string | null
  total_documentos: number
}

export interface CorreoRechazado {
  id: number
  email_remitente: string
  email_asunto: string
  motivo: string
  recibido_en: string
}

export interface TopUsuario {
  id: number
  email: string
  first_name: string
  last_name: string
  total_carpetas: number
}

export interface CarpetaPorDia {
  dia: string
  total: number
}

export interface Metricas {
  usuarios_activos: number
  usuarios_inactivos: number
  total_carpetas: number
  carpetas_por_estado: Partial<Record<EstadoCarpeta, number>>
  tasa_error: number
  carpetas_por_dia: CarpetaPorDia[]
  tiempo_procesamiento_promedio_segundos: number | null
  top_usuarios: TopUsuario[]
  correos_rechazados_30d: number
}

export interface FuentesCorpus {
  fuentes: string[]
  fuentes_propias: string[]
  total_chunks: number
  total_casos_historicos: number
}

export interface IndexarPdfResponse {
  titulo: string
  chunks_indexados: number
  municipio: string
}
