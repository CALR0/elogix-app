import "server-only";
import type { Hallazgo, NivelHallazgo } from "@/lib/estudios/tipos";

/**
 * Simulador de TusDatos para TUSDATOS_MODO=simulado (contexto §14.7).
 * Produce lo mismo que la API real entregaría al finalizar una consulta:
 * `results` por fuente (true = hallazgo, false = limpio, "Error" = la fuente
 * falló), el nivel máximo, el nombre consultado y el detalle de hallazgos.
 *
 * Es determinista por documento/placa: la misma consulta da el mismo
 * resultado, útil para probar. NO llama a ningún servicio externo.
 */

export interface ResultadoSimulado {
  nombre: string;
  results: Record<string, boolean | "Error">;
  nivel: NivelHallazgo;
  hallazgos: Hallazgo[];
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

const FUENTES_EMPRESA = [
  "RUES",
  "Procuraduría",
  "Contraloría",
  "Listas OFAC",
  "Listas ONU",
  "SECOP",
  "Supersociedades",
  "Rama Judicial",
];

const FUENTES_VEHICULO = [
  "RUNT",
  "SOAT",
  "SIMIT",
  "Comparendos",
  "Revisión técnico-mecánica",
  "Inmovilizados Bogotá",
];

/** Hallazgo de ejemplo por fuente (códigos ilustrativos, ver /api/fuentes-disponibles). */
const CATALOGO: Record<string, Omit<Hallazgo, "fuente">> = {
  "Policía Nacional": {
    nivel: "alto",
    codigo: "policia_antecedentes",
    titulo: "Registra antecedentes judiciales",
    descripcion: "Anotaciones vigentes en la consulta de antecedentes.",
  },
  Procuraduría: {
    nivel: "medio",
    codigo: "procuraduria_sancion",
    titulo: "Sanción disciplinaria",
    descripcion: "Inhabilidad registrada en los últimos 5 años.",
  },
  Contraloría: {
    nivel: "medio",
    codigo: "contraloria_responsable_fiscal",
    titulo: "Responsable fiscal",
    descripcion: "Aparece en el boletín de responsables fiscales.",
  },
  "Rama Judicial": {
    nivel: "medio",
    codigo: "rama_procesos",
    titulo: "Proceso judicial activo",
    descripcion: "Proceso en curso como demandado.",
  },
  INPEC: {
    nivel: "alto",
    codigo: "inpec_registro",
    titulo: "Registro en el INPEC",
    descripcion: "Registro de reclusión en el sistema penitenciario.",
  },
  "Listas OFAC": {
    nivel: "alto",
    codigo: "ofac_coincidencia",
    titulo: "Coincidencia en lista restrictiva",
    descripcion: "Coincidencia por nombre y documento en lista OFAC (SDN).",
  },
  "Listas ONU": {
    nivel: "alto",
    codigo: "onu_coincidencia",
    titulo: "Coincidencia en lista ONU",
    descripcion:
      "Coincidencia en la lista consolidada del Consejo de Seguridad.",
  },
  PEPs: {
    nivel: "info",
    codigo: "peps_registro",
    titulo: "Persona expuesta políticamente",
    descripcion: "Registra cargo público en los últimos 2 años.",
  },
  SIMIT: {
    nivel: "bajo",
    codigo: "simit_multas",
    titulo: "Multas de tránsito pendientes",
    descripcion: "Comparendos pendientes de pago.",
  },
  "RUNT licencias": {
    nivel: "bajo",
    codigo: "runt_licencia_vencida",
    titulo: "Licencia de conducción vencida",
    descripcion: "La licencia de categoría C2 está vencida.",
  },
  Registraduría: {
    nivel: "info",
    codigo: "registraduria_estado",
    titulo: "Documento en trámite",
    descripcion: "La cédula registra un trámite de rectificación.",
  },
  "Migración Colombia": {
    nivel: "info",
    codigo: "migracion_permiso",
    titulo: "Permiso migratorio vigente",
    descripcion: "Permiso vigente con fecha de vencimiento próxima.",
  },
  RUES: {
    nivel: "info",
    codigo: "rues_renovacion",
    titulo: "Matrícula sin renovar",
    descripcion: "La matrícula mercantil no se renovó este año.",
  },
  SECOP: {
    nivel: "bajo",
    codigo: "secop_multa",
    titulo: "Multa en contratación pública",
    descripcion: "Multa por incumplimiento contractual.",
  },
  Supersociedades: {
    nivel: "medio",
    codigo: "supersociedades_proceso",
    titulo: "Proceso de insolvencia",
    descripcion: "Proceso de reorganización empresarial en curso.",
  },
  RUNT: {
    nivel: "medio",
    codigo: "runt_limitacion",
    titulo: "Limitación a la propiedad",
    descripcion: "Registra prenda o embargo sobre el vehículo.",
  },
  SOAT: {
    nivel: "medio",
    codigo: "soat_vencido",
    titulo: "SOAT vencido",
    descripcion: "El SOAT no está vigente.",
  },
  Comparendos: {
    nivel: "bajo",
    codigo: "comparendos_pendientes",
    titulo: "Comparendos pendientes",
    descripcion: "Comparendos de tránsito sin resolver.",
  },
  "Revisión técnico-mecánica": {
    nivel: "medio",
    codigo: "runt_rtm_vencida",
    titulo: "Revisión técnico-mecánica vencida",
    descripcion: "La revisión técnico-mecánica no está vigente.",
  },
  "Inmovilizados Bogotá": {
    nivel: "alto",
    codigo: "inmovilizado",
    titulo: "Vehículo inmovilizado",
    descripcion: "Registra inmovilización en patios.",
  },
};

const NOMBRES = [
  "JUAN CARLOS PÉREZ GÓMEZ",
  "MARÍA FERNANDA RÍOS LÓPEZ",
  "JHON FREDY CASTAÑO RÍOS",
  "LUZ ADRIANA MORENO DÍAZ",
  "CARLOS ANDRÉS PINEDA ROJAS",
  "DIANA MARCELA SUÁREZ PEÑA",
];
const EMPRESAS = [
  "TRANSPORTES DEL VALLE S.A.S.",
  "LOGÍSTICA ANDINA S.A.",
  "CARGA EXPRESS DEL CARIBE S.A.S.",
];
const VEHICULOS = [
  "TRACTOCAMIÓN KENWORTH T800 · 2019",
  "CAMIÓN CHEVROLET NPR · 2021",
  "TRACTOCAMIÓN INTERNATIONAL PROSTAR · 2018",
];

/** PRNG determinista (mulberry32) a partir de un texto. */
function aleatorio(semilla: string) {
  let h = 2166136261;
  for (const c of semilla) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = (h + 0x6d2b79f5) | 0;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PESO: Record<NivelHallazgo, number> = {
  alto: 4,
  medio: 3,
  bajo: 2,
  info: 1,
  sin_hallazgo: 0,
};

export function simularConsulta(entrada: {
  tipoDocumento: string;
  documento: string | null;
  placa: string | null;
  placaRemolque: string | null;
  /** 0 = primer intento; en los reintentos las fuentes con error se recuperan. */
  intento?: number;
}): ResultadoSimulado {
  const rnd = aleatorio(
    `${entrada.tipoDocumento}|${entrada.documento}|${entrada.placa}`,
  );
  const esVehiculo = entrada.tipoDocumento === "PLACA";
  const esEmpresa = entrada.tipoDocumento === "NIT";

  const fuentes = esVehiculo
    ? [
        ...FUENTES_VEHICULO,
        ...(entrada.placaRemolque ? ["RUNT remolque", "SOAT remolque"] : []),
      ]
    : esEmpresa
      ? FUENTES_EMPRESA
      : FUENTES_PERSONA;

  // ~55 % limpio, el resto con 1 a 3 hallazgos; ~25 % con alguna fuente caída
  const conHallazgos = rnd() > 0.55;
  const cuantos = conHallazgos ? 1 + Math.floor(rnd() * 3) : 0;
  const conError = rnd() < 0.25 && !(entrada.intento && entrada.intento >= 1);

  const elegidas = new Set<string>();
  while (elegidas.size < cuantos)
    elegidas.add(fuentes[Math.floor(rnd() * fuentes.length)]);
  const caida = conError ? fuentes[Math.floor(rnd() * fuentes.length)] : null;

  const results: Record<string, boolean | "Error"> = {};
  const hallazgos: Hallazgo[] = [];
  for (const f of fuentes) {
    if (f === caida) {
      results[f] = "Error";
      continue;
    }
    results[f] = elegidas.has(f);
    if (elegidas.has(f)) {
      const base = CATALOGO[f.replace(/ remolque$/, "")] ?? CATALOGO.RUNT;
      hallazgos.push({ ...base, fuente: f });
    }
  }

  const nivel = hallazgos.reduce<NivelHallazgo>(
    (max, h) => (PESO[h.nivel] > PESO[max] ? h.nivel : max),
    "sin_hallazgo",
  );
  const lista = esVehiculo ? VEHICULOS : esEmpresa ? EMPRESAS : NOMBRES;

  return {
    nombre: lista[Math.floor(rnd() * lista.length)],
    results,
    nivel,
    hallazgos,
  };
}

/**
 * Simula si el ENVÍO a TusDatos falla (timeout, servicio caído). Para poder
 * probar el error del lado del usuario: documentos terminados en "000".
 */
export function simularFalloDeEnvio(documento: string | null) {
  return Boolean(documento?.endsWith("000"));
}
