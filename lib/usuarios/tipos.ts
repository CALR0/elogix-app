/** Fila de la gestión de usuarios (compartida entre servidor y cliente). */
export interface UsuarioFila {
  id: string;
  nombre: string;
  email: string;
  rol: "usuario" | "admin";
  activo: boolean;
  solicitudes: number;
  /** ISO: último inicio de sesión o, si nunca ha entrado, fecha de creación. */
  ultimaActividad: string;
}
