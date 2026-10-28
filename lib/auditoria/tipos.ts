/** Evento de auditoría ya traducido para la pantalla del admin. */

export type CategoriaAuditoria =
  "sesion" | "solicitud" | "estudio" | "usuario" | "configuracion" | "sistema";

export interface EventoAuditoria {
  id: number;
  /** ISO */
  fecha: string;
  actor: { nombre: string; rol: "usuario" | "admin" | "sistema" };
  categoria: CategoriaAuditoria;
  /** Código estable de la acción (columna `accion` de audit_logs). */
  accion: string;
  detalle: string;
  /** SOL-000123 cuando el evento es de una solicitud. */
  referencia?: string;
  ip?: string;
  resultado: "ok" | "error";
}
