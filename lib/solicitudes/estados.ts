/**
 * Estados que ve el USUARIO. Nunca incluyen resultados ni la decisión del
 * admin (contexto §14.5). "error" es solo el error al enviar: los errores de
 * fuentes se reintentan solos y el usuario sigue viendo "En proceso".
 */
export type EstadoUsuario = "enviada" | "procesando" | "finalizada" | "error";

export const ESTADOS_USUARIO: Record<
  EstadoUsuario,
  { etiqueta: string; descripcion: string }
> = {
  enviada: {
    etiqueta: "Enviada",
    descripcion: "Recibida, en cola para consultar.",
  },
  procesando: {
    etiqueta: "En proceso",
    descripcion: "Consultando las fuentes.",
  },
  finalizada: {
    etiqueta: "Finalizada",
    descripcion: "Consulta completa, en manos del administrador.",
  },
  error: {
    etiqueta: "No enviada",
    descripcion: "Hubo un error al enviarla. Intenta de nuevo.",
  },
};

/** Fila de "Mis solicitudes": solo datos de entrada y estado, nunca resultados. */
export interface SolicitudResumen {
  id: string;
  numero: number;
  modulo: "documento" | "vehiculo";
  descripcion: string;
  estado: EstadoUsuario;
  /** ISO */
  fecha: string;
  /** Decisión del admin (no incluye hallazgos). */
  decision: Decision;
  /** Comentario del admin al decidir, si lo dejó. */
  comentario: string | null;
}

export type Decision = "pendiente" | "aprobado" | "rechazado";
