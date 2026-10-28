"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { registrarAuditoria } from "@/lib/auditoria";
import { reintentarFuentes } from "@/lib/solicitudes/procesar";
import { createClient } from "@/lib/supabase/server";

/**
 * Decisiones del admin. Se escriben con la SESIÓN del admin (no con la secret
 * key): RLS + grants solo le dejan cambiar `revision_estado` y
 * `revision_comentario`, y el trigger `stamp_revision` registra quién y cuándo.
 */

export type ResultadoAccion =
  { ok: true; mensaje: string } | { ok: false; error: string };

const id = z.uuid();

function revalidar() {
  revalidatePath("/estudios");
  revalidatePath("/estudios/[numero]", "page");
  revalidatePath("/dashboard");
}

export async function decidirEstudio(
  solicitudId: string,
  decision: "aprobado" | "rechazado" | "pendiente",
  comentario: string,
): Promise<ResultadoAccion> {
  const yo = await requireAdmin();
  const p = z
    .object({
      id,
      decision: z.enum(["aprobado", "rechazado", "pendiente"]),
      comentario: z.string().trim().max(1000),
    })
    .safeParse({ id: solicitudId, decision, comentario });
  if (!p.success) return { ok: false, error: "Datos inválidos." };
  if (p.data.decision === "rechazado" && !p.data.comentario) {
    return { ok: false, error: "Escribe el motivo del rechazo." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("solicitud_resultados")
    .update({
      revision_estado: p.data.decision,
      revision_comentario:
        p.data.decision === "pendiente" ? null : p.data.comentario || null,
    })
    .eq("solicitud_id", p.data.id)
    .select("solicitud_id");
  if (error || !data?.length) {
    return {
      ok: false,
      error: "No se pudo guardar la decisión (¿la consulta ya terminó?).",
    };
  }

  await registrarAuditoria({
    actorId: yo.id,
    accion:
      p.data.decision === "aprobado"
        ? "estudio.aprobar"
        : p.data.decision === "rechazado"
          ? "estudio.rechazar"
          : "estudio.reabrir",
    entidad: "solicitud",
    entidadId: p.data.id,
    metadata: p.data.comentario ? { comentario: p.data.comentario } : undefined,
  });
  revalidar();
  return {
    ok: true,
    mensaje:
      p.data.decision === "pendiente"
        ? "La revisión quedó abierta de nuevo."
        : `Estudio ${p.data.decision}.`,
  };
}

/**
 * Aprobación en lote: el servidor vuelve a filtrar y SOLO aprueba los que
 * siguen pendientes, sin hallazgos y sin fuentes con error.
 */
export async function aprobarEnLote(
  solicitudIds: string[],
): Promise<ResultadoAccion> {
  const yo = await requireAdmin();
  const p = z.array(id).min(1).max(200).safeParse(solicitudIds);
  if (!p.success) return { ok: false, error: "Selección inválida." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("solicitud_resultados")
    .update({
      revision_estado: "aprobado",
      revision_comentario: "Aprobado en lote (sin hallazgos)",
    })
    .in("solicitud_id", p.data)
    .eq("revision_estado", "pendiente")
    .eq("hallazgo_nivel", "sin_hallazgo")
    .eq("fuentes_con_error", "{}")
    .select("solicitud_id");
  if (error) return { ok: false, error: "No se pudo aprobar el lote." };

  await Promise.all(
    (data ?? []).map((r) =>
      registrarAuditoria({
        actorId: yo.id,
        accion: "estudio.aprobar",
        entidad: "solicitud",
        entidadId: r.solicitud_id,
        metadata: { comentario: "Aprobado en lote (sin hallazgos)" },
      }),
    ),
  );
  revalidar();
  const n = data?.length ?? 0;
  return {
    ok: true,
    mensaje: `${n} estudio${n === 1 ? "" : "s"} aprobado${n === 1 ? "" : "s"}.`,
  };
}

/** Reintento de fuentes con error (en TusDatos no consume créditos). */
export async function reintentarFuentesEstudio(
  solicitudId: string,
): Promise<ResultadoAccion> {
  const yo = await requireAdmin();
  if (!id.safeParse(solicitudId).success)
    return { ok: false, error: "Datos inválidos." };
  await reintentarFuentes(solicitudId, yo.id);
  revalidar();
  return { ok: true, mensaje: "Reintento completado." };
}
