/** Tipos del lado admin (estudios = solicitudes vistas con sus resultados). */

export type NivelHallazgo = "alto" | "medio" | "bajo" | "info" | "sin_hallazgo";

/** Estado del estudio desde la óptica del admin. */
export type EstadoEstudio =
  | "por_revisar"
  | "procesando"
  | "fuentes_error"
  | "error_envio"
  | "aprobado"
  | "rechazado";

export type ResultadoFuente = "ok" | "hallazgo" | "error";

export interface Hallazgo {
  nivel: Exclude<NivelHallazgo, "sin_hallazgo">;
  codigo: string;
  fuente: string;
  titulo: string;
  descripcion: string;
}

export interface EventoEstudio {
  fecha: string;
  texto: string;
  tipo: "info" | "error" | "ok";
}

export interface Estudio {
  id: string;
  numero: number;
  modulo: "documento" | "vehiculo";
  descripcion: string;
  nombreConsultado: string;
  solicitante: string;
  fecha: string;
  estado: EstadoEstudio;
  nivel: NivelHallazgo | null;
  fuentes: Record<string, ResultadoFuente>;
  hallazgos: Hallazgo[];
  reintentos: number;
  comentario?: string;
  simulada: boolean;
  eventos: EventoEstudio[];
}

/** Orden de riesgo para la bandeja: lo más grave primero. */
export const PESO_NIVEL: Record<NivelHallazgo, number> = {
  alto: 0,
  medio: 1,
  bajo: 2,
  info: 3,
  sin_hallazgo: 4,
};
