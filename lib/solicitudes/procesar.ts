import "server-only";
import { after } from "next/server";
import { registrarAuditoria } from "@/lib/auditoria";
import { serverEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { simularConsulta, simularFalloDeEnvio } from "@/lib/tusdatos/simulador";

/**
 * Procesamiento de una solicitud: lo hace el SISTEMA (secret key), no el
 * usuario, que solo puede insertar los datos de entrada (RLS + grants).
 *
 * Modo simulado (contexto §14.7): no sale nada a TusDatos. Se simula el
 * lanzamiento y, unos segundos después (con `after()`, sin bloquear al
 * usuario), el resultado. Modo real: pendiente (POST /api/launch, webhook y
 * cron de reconciliación, §6).
 */

/** Tiempo que "tarda" una consulta simulada (TusDatos real: ~1 minuto). */
const DEMORA_SIMULADA_MS = 8_000;

export type ResultadoLanzamiento =
  { ok: true } | { ok: false; mensaje: string };

type Fila = {
  id: string;
  numero: number;
  tipo_documento: string;
  documento: string | null;
  placa: string | null;
  placa_remolque: string | null;
  intentos: number;
};

async function leer(id: string) {
  const { data, error } = await createAdminClient()
    .from("solicitudes")
    .select(
      "id, numero, tipo_documento, documento, placa, placa_remolque, intentos",
    )
    .eq("id", id)
    .single<Fila>();
  if (error) throw new Error(`Solicitud ${id}: ${error.message}`);
  return data;
}

/** Lanza la consulta. Si falla el envío, la solicitud queda en "error". */
export async function lanzarConsulta(
  solicitudId: string,
): Promise<ResultadoLanzamiento> {
  if (serverEnv().TUSDATOS_MODO === "real") {
    // Protección: el envío real aún no está implementado (no gastar créditos por accidente)
    throw new Error(
      "TUSDATOS_MODO=real: el envío real a TusDatos aún no está implementado.",
    );
  }

  const admin = createAdminClient();
  const s = await leer(solicitudId);
  const intentos = s.intentos + 1;

  if (simularFalloDeEnvio(s.documento)) {
    await admin
      .from("solicitudes")
      .update({ estado: "error", intentos, simulada: true })
      .eq("id", solicitudId);
    await registrarAuditoria({
      actorId: null,
      accion: "tusdatos.error_envio",
      entidad: "solicitud",
      entidadId: solicitudId,
      metadata: {
        detalle:
          "TusDatos no respondió a tiempo (simulado). Se avisó al usuario.",
      },
    });
    return {
      ok: false,
      mensaje:
        "El servicio de consultas no respondió a tiempo. Tus datos se conservaron; intenta de nuevo en unos segundos.",
    };
  }

  await admin
    .from("solicitudes")
    .update({
      estado: "procesando",
      intentos,
      simulada: true,
      tusdatos_jobid: `sim-${crypto.randomUUID()}`,
    })
    .eq("id", solicitudId);
  await registrarAuditoria({
    actorId: null,
    accion: "tusdatos.lanzar",
    entidad: "solicitud",
    entidadId: solicitudId,
    metadata: {
      detalle: "Consulta lanzada (modo simulado: no sale a TusDatos)",
    },
  });

  // El resultado llega después, sin hacer esperar al usuario
  after(async () => {
    await new Promise((r) => setTimeout(r, DEMORA_SIMULADA_MS));
    await completarSimulada(solicitudId);
  });
  return { ok: true };
}

/** Escribe el resultado simulado y deja la solicitud "finalizada". */
async function completarSimulada(solicitudId: string, intento = 0) {
  const admin = createAdminClient();
  const s = await leer(solicitudId);
  const r = simularConsulta({
    tipoDocumento: s.tipo_documento,
    documento: s.documento,
    placa: s.placa,
    placaRemolque: s.placa_remolque,
    intento,
  });
  const conError = Object.entries(r.results)
    .filter(([, v]) => v === "Error")
    .map(([f]) => f);

  const { error } = await admin.from("solicitud_resultados").upsert({
    solicitud_id: solicitudId,
    hallazgo: r.nivel !== "sin_hallazgo",
    hallazgo_nivel: r.nivel,
    fuentes: r.results,
    fuentes_con_error: conError,
    nombre_consultado: r.nombre,
    hallazgos: r.hallazgos,
    reintentos: intento,
  });
  if (error) {
    console.error("[procesar] resultado", error.message);
    return;
  }
  await admin
    .from("solicitudes")
    .update({
      estado: "finalizada",
      finalizada_at: new Date().toISOString(),
      tusdatos_report_id: `sim-${s.numero}`,
    })
    .eq("id", solicitudId);

  const total = Object.keys(r.results).length;
  await registrarAuditoria({
    actorId: null,
    accion: "tusdatos.finalizar",
    entidad: "solicitud",
    entidadId: solicitudId,
    metadata: {
      detalle: conError.length
        ? `Finalizada con ${conError.length} fuente(s) con error · ${total} fuentes`
        : `Consulta finalizada · ${total} fuentes`,
      nivel: r.nivel,
    },
  });
}

/**
 * Reintenta las fuentes con error. En TusDatos real: GET /api/retry/{id}
 * (no consume créditos). En simulado: las fuentes caídas se recuperan.
 */
export async function reintentarFuentes(solicitudId: string, actorId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("solicitud_resultados")
    .select("reintentos")
    .eq("solicitud_id", solicitudId)
    .single();
  await registrarAuditoria({
    actorId,
    accion: "tusdatos.reintentar",
    entidad: "solicitud",
    entidadId: solicitudId,
    metadata: {
      detalle: "Reintento de fuentes con error (no consume créditos)",
    },
  });
  await completarSimulada(solicitudId, (data?.reintentos ?? 0) + 1);
}
