/**
 * DATOS DE EJEMPLO para las maquetas del ADMIN. Incluyen hallazgos: en la
 * app real vienen de `solicitud_resultados` (RLS solo-admin) y de
 * `GET /api/report_json/{id}` de TusDatos. Los códigos y textos de hallazgo
 * son ilustrativos; los reales están en `GET /api/fuentes-disponibles`.
 */

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
  eventos: EventoEstudio[];
}

const FUENTES_PERSONA = [
  "Policía Nacional",
  "Procuraduría",
  "Contraloría",
  "Rama Judicial",
  "INPEC",
  "Listas OFAC",
  "Listas ONU",
  "PEPs",
  "SIMIT",
  "RUNT licencias",
  "Registraduría",
  "Migración Colombia",
];

const FUENTES_VEHICULO = [
  "RUNT",
  "SOAT",
  "SIMIT",
  "Comparendos",
  "Revisión técnico-mecánica",
  "Inmovilizados Bogotá",
];

function fuentes(
  lista: string[],
  hallazgo: string[] = [],
  error: string[] = [],
): Record<string, ResultadoFuente> {
  return Object.fromEntries(
    lista.map((f) => [
      f,
      error.includes(f) ? "error" : hallazgo.includes(f) ? "hallazgo" : "ok",
    ]),
  );
}

export const ESTUDIOS_DEMO: Estudio[] = [
  {
    numero: 146,
    modulo: "documento",
    descripcion: "CC 1.032.554.871",
    nombreConsultado: "JHON FREDY CASTAÑO RÍOS",
    solicitante: "Laura Gómez",
    fecha: "2026-10-26T09:05:00-05:00",
    estado: "por_revisar",
    nivel: "alto",
    fuentes: fuentes(FUENTES_PERSONA, [
      "Policía Nacional",
      "Rama Judicial",
      "SIMIT",
    ]),
    hallazgos: [
      {
        nivel: "alto",
        codigo: "policia_antecedentes",
        fuente: "Policía Nacional",
        titulo: "Registra antecedentes judiciales",
        descripcion:
          "La persona registra anotaciones vigentes en la consulta de antecedentes.",
      },
      {
        nivel: "medio",
        codigo: "rama_procesos_penales",
        fuente: "Rama Judicial",
        titulo: "Proceso penal activo",
        descripcion:
          "Un proceso penal en curso como demandado (Juzgado Penal Municipal de Bogotá).",
      },
      {
        nivel: "bajo",
        codigo: "simit_multas",
        fuente: "SIMIT",
        titulo: "Multas de tránsito pendientes",
        descripcion: "2 comparendos pendientes de pago por $1.280.000.",
      },
    ],
    reintentos: 0,
    eventos: [
      {
        fecha: "2026-10-26T09:05:00-05:00",
        texto: "Solicitud enviada por Laura Gómez",
        tipo: "info",
      },
      {
        fecha: "2026-10-26T09:05:08-05:00",
        texto: "Consulta lanzada en TusDatos",
        tipo: "info",
      },
      {
        fecha: "2026-10-26T09:06:12-05:00",
        texto: "Consulta finalizada · 12 fuentes",
        tipo: "ok",
      },
    ],
  },
  {
    numero: 144,
    modulo: "vehiculo",
    descripcion: "Placa SNT413 + remolque R41130 · CC 71.234.556",
    nombreConsultado: "TRACTOCAMIÓN KENWORTH T800 · 2019",
    solicitante: "Andrés Mejía",
    fecha: "2026-10-26T08:41:00-05:00",
    estado: "por_revisar",
    nivel: "medio",
    fuentes: fuentes(FUENTES_VEHICULO, [
      "Revisión técnico-mecánica",
      "Comparendos",
    ]),
    hallazgos: [
      {
        nivel: "medio",
        codigo: "runt_rtm_vencida",
        fuente: "Revisión técnico-mecánica",
        titulo: "Revisión técnico-mecánica vencida",
        descripcion: "Venció el 14/08/2026.",
      },
      {
        nivel: "info",
        codigo: "comparendos_historicos",
        fuente: "Comparendos",
        titulo: "Comparendos pagados",
        descripcion: "3 comparendos en los últimos 2 años, todos pagados.",
      },
    ],
    reintentos: 0,
    eventos: [
      {
        fecha: "2026-10-26T08:41:00-05:00",
        texto: "Solicitud enviada por Andrés Mejía",
        tipo: "info",
      },
      {
        fecha: "2026-10-26T08:41:06-05:00",
        texto: "Consulta lanzada en TusDatos",
        tipo: "info",
      },
      {
        fecha: "2026-10-26T08:42:01-05:00",
        texto: "Consulta finalizada · 6 fuentes",
        tipo: "ok",
      },
    ],
  },
  {
    numero: 142,
    modulo: "documento",
    descripcion: "CC 1.144.023.887",
    nombreConsultado: "MARÍA CAMILA SUÁREZ PEÑA",
    solicitante: "Laura Gómez",
    fecha: "2026-10-26T08:02:00-05:00",
    estado: "fuentes_error",
    nivel: "sin_hallazgo",
    fuentes: fuentes(FUENTES_PERSONA, [], ["Rama Judicial", "Registraduría"]),
    hallazgos: [],
    reintentos: 2,
    eventos: [
      {
        fecha: "2026-10-26T08:02:00-05:00",
        texto: "Solicitud enviada por Laura Gómez",
        tipo: "info",
      },
      {
        fecha: "2026-10-26T08:03:10-05:00",
        texto: "Finalizada con 2 fuentes con error",
        tipo: "error",
      },
      {
        fecha: "2026-10-26T08:13:00-05:00",
        texto: "Reintento automático 1 de 3 · siguen 2 con error",
        tipo: "error",
      },
      {
        fecha: "2026-10-26T08:23:00-05:00",
        texto: "Reintento automático 2 de 3 · siguen 2 con error",
        tipo: "error",
      },
    ],
  },
  {
    numero: 140,
    modulo: "documento",
    descripcion: "PPT 4.871.220",
    nombreConsultado: "LUIS ALBERTO MORA HERNÁNDEZ",
    solicitante: "Andrés Mejía",
    fecha: "2026-10-25T17:48:00-05:00",
    estado: "por_revisar",
    nivel: "info",
    fuentes: fuentes(FUENTES_PERSONA, ["Migración Colombia"]),
    hallazgos: [
      {
        nivel: "info",
        codigo: "migracion_ppt_vigente",
        fuente: "Migración Colombia",
        titulo: "PPT vigente",
        descripcion: "Permiso por protección temporal vigente hasta 2031.",
      },
    ],
    reintentos: 0,
    eventos: [
      {
        fecha: "2026-10-25T17:48:00-05:00",
        texto: "Solicitud enviada por Andrés Mejía",
        tipo: "info",
      },
      {
        fecha: "2026-10-25T17:49:05-05:00",
        texto: "Consulta finalizada · 12 fuentes",
        tipo: "ok",
      },
    ],
  },
  {
    numero: 139,
    modulo: "documento",
    descripcion: "CC 80.112.554",
    nombreConsultado: "CARLOS ANDRÉS PINEDA ROJAS",
    solicitante: "Laura Gómez",
    fecha: "2026-10-25T16:20:00-05:00",
    estado: "por_revisar",
    nivel: "sin_hallazgo",
    fuentes: fuentes(FUENTES_PERSONA),
    hallazgos: [],
    reintentos: 0,
    eventos: [
      {
        fecha: "2026-10-25T16:20:00-05:00",
        texto: "Solicitud enviada por Laura Gómez",
        tipo: "info",
      },
      {
        fecha: "2026-10-25T16:21:02-05:00",
        texto: "Consulta finalizada · 12 fuentes",
        tipo: "ok",
      },
    ],
  },
  {
    numero: 137,
    modulo: "vehiculo",
    descripcion: "Placa TGR915 · NIT 900.345.112",
    nombreConsultado: "VOLQUETA INTERNATIONAL 7600 · 2017",
    solicitante: "Paola Ruiz",
    fecha: "2026-10-25T14:05:00-05:00",
    estado: "por_revisar",
    nivel: "sin_hallazgo",
    fuentes: fuentes(FUENTES_VEHICULO),
    hallazgos: [],
    reintentos: 0,
    eventos: [
      {
        fecha: "2026-10-25T14:05:00-05:00",
        texto: "Solicitud enviada por Paola Ruiz",
        tipo: "info",
      },
      {
        fecha: "2026-10-25T14:05:58-05:00",
        texto: "Consulta finalizada · 6 fuentes",
        tipo: "ok",
      },
    ],
  },
  {
    numero: 148,
    modulo: "documento",
    descripcion: "CC 1.023.456.789",
    nombreConsultado: "—",
    solicitante: "Laura Gómez",
    fecha: "2026-10-26T09:42:00-05:00",
    estado: "procesando",
    nivel: null,
    fuentes: {},
    hallazgos: [],
    reintentos: 0,
    eventos: [
      {
        fecha: "2026-10-26T09:42:00-05:00",
        texto: "Solicitud enviada por Laura Gómez",
        tipo: "info",
      },
      {
        fecha: "2026-10-26T09:42:06-05:00",
        texto: "Consulta lanzada en TusDatos",
        tipo: "info",
      },
    ],
  },
  {
    numero: 145,
    modulo: "documento",
    descripcion: "PPT 4.512.309",
    nombreConsultado: "—",
    solicitante: "Laura Gómez",
    fecha: "2026-10-26T08:15:00-05:00",
    estado: "error_envio",
    nivel: null,
    fuentes: {},
    hallazgos: [],
    reintentos: 0,
    eventos: [
      {
        fecha: "2026-10-26T08:15:00-05:00",
        texto: "Solicitud enviada por Laura Gómez",
        tipo: "info",
      },
      {
        fecha: "2026-10-26T08:15:31-05:00",
        texto: "TusDatos no respondió (timeout). El usuario fue avisado.",
        tipo: "error",
      },
    ],
  },
  {
    numero: 136,
    modulo: "documento",
    descripcion: "CE 612.774",
    nombreConsultado: "ANA SOFÍA BRICEÑO LÓPEZ",
    solicitante: "Paola Ruiz",
    fecha: "2026-10-25T10:47:00-05:00",
    estado: "aprobado",
    nivel: "bajo",
    fuentes: fuentes(FUENTES_PERSONA, ["SIMIT"]),
    hallazgos: [
      {
        nivel: "bajo",
        codigo: "simit_multas",
        fuente: "SIMIT",
        titulo: "Multa de tránsito pendiente",
        descripcion: "1 comparendo por $468.000.",
      },
    ],
    reintentos: 0,
    comentario: "Multa menor, no impide la contratación.",
    eventos: [
      {
        fecha: "2026-10-25T10:47:00-05:00",
        texto: "Solicitud enviada por Paola Ruiz",
        tipo: "info",
      },
      {
        fecha: "2026-10-25T10:48:03-05:00",
        texto: "Consulta finalizada · 12 fuentes",
        tipo: "ok",
      },
      {
        fecha: "2026-10-25T11:30:00-05:00",
        texto: "Aprobado por Keyner",
        tipo: "ok",
      },
    ],
  },
  {
    numero: 133,
    modulo: "documento",
    descripcion: "CC 1.098.765.432",
    nombreConsultado: "DIEGO ARMANDO QUINTERO SALAZAR",
    solicitante: "Andrés Mejía",
    fecha: "2026-10-24T17:30:00-05:00",
    estado: "rechazado",
    nivel: "alto",
    fuentes: fuentes(FUENTES_PERSONA, ["Procuraduría", "Listas OFAC"]),
    hallazgos: [
      {
        nivel: "alto",
        codigo: "ofac_coincidencia",
        fuente: "Listas OFAC",
        titulo: "Coincidencia en lista restrictiva",
        descripcion: "Coincidencia por nombre y documento en lista OFAC (SDN).",
      },
      {
        nivel: "medio",
        codigo: "procuraduria_sancion",
        fuente: "Procuraduría",
        titulo: "Sanción disciplinaria",
        descripcion: "Inhabilidad registrada en 2023.",
      },
    ],
    reintentos: 0,
    comentario: "Coincidencia en lista restrictiva.",
    eventos: [
      {
        fecha: "2026-10-24T17:30:00-05:00",
        texto: "Solicitud enviada por Andrés Mejía",
        tipo: "info",
      },
      {
        fecha: "2026-10-24T17:31:10-05:00",
        texto: "Consulta finalizada · 12 fuentes",
        tipo: "ok",
      },
      {
        fecha: "2026-10-24T18:02:00-05:00",
        texto: "Rechazado por Keyner",
        tipo: "error",
      },
    ],
  },
  ...[
    {
      numero: 134,
      modulo: "vehiculo",
      descripcion: "Placa KDS27F · CC 1.144.023.887",
      nombre: "MOTOCICLETA YAMAHA XTZ 150 · 2022",
      solicitante: "Paola Ruiz",
      fecha: "2026-10-24T11:12:00-05:00",
      nivel: "sin_hallazgo",
    },
    {
      numero: 132,
      modulo: "documento",
      descripcion: "CC 52.889.301",
      nombre: "SANDRA MILENA ACOSTA DÍAZ",
      solicitante: "Laura Gómez",
      fecha: "2026-10-24T09:08:00-05:00",
      nivel: "sin_hallazgo",
    },
    {
      numero: 130,
      modulo: "documento",
      descripcion: "CC 1.007.889.214",
      nombre: "KEVIN ESTEBAN RAMÍREZ TORO",
      solicitante: "Andrés Mejía",
      fecha: "2026-10-23T15:20:00-05:00",
      nivel: "bajo",
    },
    {
      numero: 128,
      modulo: "documento",
      descripcion: "NIT 900.778.341",
      nombre: "TRANSPORTES DEL VALLE S.A.S.",
      solicitante: "Paola Ruiz",
      fecha: "2026-10-23T10:02:00-05:00",
      nivel: "sin_hallazgo",
    },
  ].map((e): Estudio => ({
    numero: e.numero,
    modulo: e.modulo as Estudio["modulo"],
    descripcion: e.descripcion,
    nombreConsultado: e.nombre,
    solicitante: e.solicitante,
    fecha: e.fecha,
    estado: "por_revisar",
    nivel: e.nivel as NivelHallazgo,
    fuentes: fuentes(
      e.modulo === "vehiculo" ? FUENTES_VEHICULO : FUENTES_PERSONA,
      e.nivel === "bajo" ? ["SIMIT"] : [],
    ),
    hallazgos:
      e.nivel === "bajo"
        ? [
            {
              nivel: "bajo",
              codigo: "simit_multas",
              fuente: "SIMIT",
              titulo: "Multa de tránsito pendiente",
              descripcion: "1 comparendo por $604.000.",
            },
          ]
        : [],
    reintentos: 0,
    eventos: [
      {
        fecha: e.fecha,
        texto: `Solicitud enviada por ${e.solicitante}`,
        tipo: "info",
      },
      { fecha: e.fecha, texto: "Consulta finalizada", tipo: "ok" },
    ],
  })),
];

/** Orden de riesgo para la bandeja: lo más grave primero. */
export const PESO_NIVEL: Record<NivelHallazgo, number> = {
  alto: 0,
  medio: 1,
  bajo: 2,
  info: 3,
  sin_hallazgo: 4,
};

export function buscarEstudio(numero: number) {
  return ESTUDIOS_DEMO.find((e) => e.numero === numero);
}

export const ADMIN_DEMO = { nombre: "Keyner", iniciales: "KE" };

export const CREDITOS_DEMO = { disponibles: 412, comprados: 500 };

/** Consultas por día, últimos 14 días (más antiguo primero). */
export const ACTIVIDAD_DEMO = [6, 9, 4, 11, 8, 3, 2, 12, 10, 7, 13, 9, 11, 8];

export const FUENTES_ESTADO_DEMO = {
  operativas: 248,
  mantenimiento: 9,
  caidas: 4,
};

export interface UsuarioDemo {
  id: string;
  nombre: string;
  email: string;
  rol: "usuario" | "admin";
  activo: boolean;
  solicitudes: number;
  ultimaActividad: string;
}

export const USUARIOS_DEMO: UsuarioDemo[] = [
  {
    id: "1",
    nombre: "Keyner",
    email: "keyner@elogia.com",
    rol: "admin",
    activo: true,
    solicitudes: 0,
    ultimaActividad: "2026-10-26T09:50:00-05:00",
  },
  {
    id: "2",
    nombre: "Laura Gómez",
    email: "laura.gomez@elogia.com",
    rol: "usuario",
    activo: true,
    solicitudes: 64,
    ultimaActividad: "2026-10-26T09:42:00-05:00",
  },
  {
    id: "3",
    nombre: "Andrés Mejía",
    email: "andres.mejia@elogia.com",
    rol: "usuario",
    activo: true,
    solicitudes: 41,
    ultimaActividad: "2026-10-26T08:41:00-05:00",
  },
  {
    id: "4",
    nombre: "Paola Ruiz",
    email: "paola.ruiz@elogia.com",
    rol: "usuario",
    activo: true,
    solicitudes: 27,
    ultimaActividad: "2026-10-25T14:05:00-05:00",
  },
  {
    id: "5",
    nombre: "Julián Ortiz",
    email: "julian.ortiz@elogia.com",
    rol: "usuario",
    activo: false,
    solicitudes: 12,
    ultimaActividad: "2026-09-30T16:10:00-05:00",
  },
  {
    id: "6",
    nombre: "Camilo Restrepo",
    email: "camilo.restrepo@elogia.com",
    rol: "usuario",
    activo: true,
    solicitudes: 33,
    ultimaActividad: "2026-10-26T08:05:00-05:00",
  },
  {
    id: "7",
    nombre: "Diana Patiño",
    email: "diana.patino@elogia.com",
    rol: "usuario",
    activo: true,
    solicitudes: 19,
    ultimaActividad: "2026-10-25T17:22:00-05:00",
  },
  {
    id: "8",
    nombre: "Mauricio Lozano",
    email: "mauricio.lozano@elogia.com",
    rol: "admin",
    activo: true,
    solicitudes: 0,
    ultimaActividad: "2026-10-24T10:40:00-05:00",
  },
  {
    id: "9",
    nombre: "Natalia Cárdenas",
    email: "natalia.cardenas@elogia.com",
    rol: "usuario",
    activo: true,
    solicitudes: 8,
    ultimaActividad: "2026-10-22T15:31:00-05:00",
  },
  {
    id: "10",
    nombre: "Óscar Beltrán",
    email: "oscar.beltran@elogia.com",
    rol: "usuario",
    activo: false,
    solicitudes: 4,
    ultimaActividad: "2026-08-14T09:12:00-05:00",
  },
  {
    id: "11",
    nombre: "Valentina Herrera",
    email: "valentina.herrera@elogia.com",
    rol: "usuario",
    activo: true,
    solicitudes: 22,
    ultimaActividad: "2026-10-26T07:48:00-05:00",
  },
];
