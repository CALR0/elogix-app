import type { EstadoUsuario } from "./estados";

/**
 * DATOS DE EJEMPLO para las maquetas. Se reemplazan por consultas a Supabase
 * (tabla `solicitudes`, RLS: el usuario solo ve las suyas) en la Fase 3.
 */

export interface SolicitudResumen {
  numero: number;
  modulo: "documento" | "vehiculo";
  /** "CC 1.023.456.789" o "Placa ABC123 · CC 79.456.123" */
  descripcion: string;
  estado: EstadoUsuario;
  /** ISO */
  fecha: string;
}

export const USUARIO_DEMO = { nombre: "Laura Gómez", iniciales: "LG" };

export const SOLICITUDES_DEMO: SolicitudResumen[] = [
  {
    numero: 148,
    modulo: "documento",
    descripcion: "CC 1.023.456.789",
    estado: "procesando",
    fecha: "2026-10-26T09:42:00-05:00",
  },
  {
    numero: 147,
    modulo: "vehiculo",
    descripcion: "Placa WMK482 · CC 79.456.123",
    estado: "enviada",
    fecha: "2026-10-26T09:38:00-05:00",
  },
  {
    numero: 145,
    modulo: "documento",
    descripcion: "PPT 4.512.309",
    estado: "error",
    fecha: "2026-10-26T08:15:00-05:00",
  },
  {
    numero: 143,
    modulo: "documento",
    descripcion: "CC 80.112.554",
    estado: "finalizada",
    fecha: "2026-10-25T16:20:00-05:00",
  },
  {
    numero: 141,
    modulo: "vehiculo",
    descripcion: "Placa TGR915 · NIT 900.345.112",
    estado: "finalizada",
    fecha: "2026-10-25T14:05:00-05:00",
  },
  {
    numero: 138,
    modulo: "documento",
    descripcion: "CE 612.774",
    estado: "finalizada",
    fecha: "2026-10-25T10:47:00-05:00",
  },
  {
    numero: 135,
    modulo: "documento",
    descripcion: "CC 1.098.765.432",
    estado: "finalizada",
    fecha: "2026-10-24T17:30:00-05:00",
  },
  {
    numero: 131,
    modulo: "vehiculo",
    descripcion: "Placa KDS27F · CC 1.144.023.887",
    estado: "finalizada",
    fecha: "2026-10-24T11:12:00-05:00",
  },
  {
    numero: 127,
    modulo: "documento",
    descripcion: "NIT 901.223.778",
    estado: "finalizada",
    fecha: "2026-10-23T15:55:00-05:00",
  },
  {
    numero: 122,
    modulo: "documento",
    descripcion: "CC 52.889.301",
    estado: "finalizada",
    fecha: "2026-10-23T09:08:00-05:00",
  },
  {
    numero: 118,
    modulo: "vehiculo",
    descripcion: "Placa EQT204 · CC 1.020.334.981",
    estado: "finalizada",
    fecha: "2026-10-22T16:41:00-05:00",
  },
  {
    numero: 115,
    modulo: "documento",
    descripcion: "CC 1.007.889.214",
    estado: "finalizada",
    fecha: "2026-10-22T10:13:00-05:00",
  },
  {
    numero: 111,
    modulo: "documento",
    descripcion: "PP AT4492017",
    estado: "finalizada",
    fecha: "2026-10-21T15:02:00-05:00",
  },
  {
    numero: 108,
    modulo: "vehiculo",
    descripcion: "Placa JHN58E · CC 79.880.112",
    estado: "finalizada",
    fecha: "2026-10-21T08:50:00-05:00",
  },
  {
    numero: 104,
    modulo: "documento",
    descripcion: "CC 1.152.447.630",
    estado: "finalizada",
    fecha: "2026-10-20T14:27:00-05:00",
  },
  {
    numero: 101,
    modulo: "documento",
    descripcion: "NIT 900.778.341",
    estado: "finalizada",
    fecha: "2026-10-20T09:31:00-05:00",
  },
];
