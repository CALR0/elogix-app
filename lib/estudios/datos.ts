import "server-only";
import { connection } from "next/server";
import {
  describir,
  COLUMNAS_SOLICITUD,
  type FilaSolicitud,
} from "@/lib/solicitudes/datos";
import { createClient } from "@/lib/supabase/server";
import type {
  EstadoEstudio,
  Estudio,
  EventoEstudio,
  Hallazgo,
  NivelHallazgo,
  ResultadoFuente,
} from "./tipos";

/**
 * Estudios = solicitudes con su autor y su resultado, para el ADMIN.
 * Se leen con la sesión del admin: RLS es la que permite ver todas las
 * solicitudes y los resultados (un usuario normal no obtendría nada).
 * Llamar después de `requireAdmin()`.
 */

type FilaResultado = {
  hallazgo_nivel: NivelHallazgo | null;
  fuentes: Record<string, boolean | "Error"> | null;
  fuentes_con_error: string[];
  nombre_consultado: string | null;
  hallazgos: Hallazgo[];
  reintentos: number;
  revision_estado: "pendiente" | "aprobado" | "rechazado";
  revision_comentario: string | null;
};

type FilaEstudio = FilaSolicitud & {
  simulada: boolean;
  autor: { full_name: string | null; email: string } | null;
  resultado: FilaResultado | null;
};

const SELECT = `${COLUMNAS_SOLICITUD}, simulada,
  autor:profiles!solicitudes_created_by_fkey(full_name, email),
  resultado:solicitud_resultados(hallazgo_nivel, fuentes, fuentes_con_error, nombre_consultado, hallazgos, reintentos, revision_estado, revision_comentario)`;

function estadoAdmin(s: FilaEstudio): EstadoEstudio {
  if (s.estado === "error") return "error_envio";
  if (s.estado !== "finalizada" || !s.resultado) return "procesando";
  const r = s.resultado;
  if (r.revision_estado !== "pendiente") return r.revision_estado;
  return r.fuentes_con_error.length > 0 ? "fuentes_error" : "por_revisar";
}

function aEstudio(s: FilaEstudio, eventos: EventoEstudio[] = []): Estudio {
  const r = s.resultado;
  const fuentes: Record<string, ResultadoFuente> = {};
  for (const [f, v] of Object.entries(r?.fuentes ?? {})) {
    fuentes[f] = v === "Error" ? "error" : v ? "hallazgo" : "ok";
  }
  return {
    id: s.id,
    numero: s.numero,
    modulo: s.tipo_documento === "PLACA" ? "vehiculo" : "documento",
    descripcion: describir(s),
    nombreConsultado: r?.nombre_consultado ?? "—",
    solicitante: s.autor?.full_name || s.autor?.email || "—",
    fecha: s.created_at,
    estado: estadoAdmin(s),
    nivel: r?.hallazgo_nivel ?? null,
    fuentes,
    hallazgos: r?.hallazgos ?? [],
    reintentos: r?.reintentos ?? 0,
    comentario: r?.revision_comentario ?? undefined,
    simulada: s.simulada,
    eventos,
  };
}

export async function listarEstudios(): Promise<Estudio[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("solicitudes")
    .select(SELECT)
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) throw new Error(error.message);
  return (data as unknown as FilaEstudio[]).map((s) => aEstudio(s));
}

const TEXTO_ACCION: Record<string, (actor: string) => string> = {
  "solicitud.crear": (a) => `Solicitud enviada por ${a}`,
  "solicitud.reintentar": (a) => `${a} reintentó el envío`,
  "estudio.aprobar": (a) => `Aprobado por ${a}`,
  "estudio.rechazar": (a) => `Rechazado por ${a}`,
  "estudio.reabrir": (a) => `${a} reabrió la revisión`,
};

/** Estudio completo con su historial (sale de `audit_logs`). */
export async function obtenerEstudio(numero: number): Promise<Estudio | null> {
  if (!Number.isInteger(numero) || numero <= 0) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("solicitudes")
    .select(SELECT)
    .eq("numero", numero)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const s = data as unknown as FilaEstudio;

  const { data: logs } = await supabase
    .from("audit_logs")
    .select(
      "accion, metadata, created_at, actor:profiles!audit_logs_actor_id_fkey(full_name, email)",
    )
    .eq("entidad", "solicitud")
    .eq("entidad_id", s.id)
    .order("created_at", { ascending: true });

  const eventos: EventoEstudio[] = (logs ?? []).map((l) => {
    const actor = l.actor as unknown as {
      full_name: string | null;
      email: string;
    } | null;
    const nombre = actor?.full_name || actor?.email || "el sistema";
    const metadata = (l.metadata ?? {}) as {
      detalle?: string;
      comentario?: string;
    };
    const texto =
      TEXTO_ACCION[l.accion]?.(nombre) ?? metadata.detalle ?? l.accion;
    return {
      fecha: l.created_at,
      texto: metadata.comentario
        ? `${texto} · “${metadata.comentario}”`
        : texto,
      tipo: /error|rechazar/.test(l.accion)
        ? "error"
        : /finalizar|aprobar/.test(l.accion)
          ? l.accion === "tusdatos.finalizar" &&
            metadata.detalle?.includes("error")
            ? "error"
            : "ok"
          : "info",
    };
  });

  return aEstudio(s, eventos);
}

/** Contador del menú: finalizados, sin fuentes con error y sin decisión. */
export async function contarPorRevisar(): Promise<number> {
  await connection();
  const supabase = await createClient();
  const { count } = await supabase
    .from("solicitud_resultados")
    .select("solicitud_id", { count: "exact", head: true })
    .eq("revision_estado", "pendiente")
    .eq("fuentes_con_error", "{}");
  return count ?? 0;
}
