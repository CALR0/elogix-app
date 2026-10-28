import "server-only";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

export interface EventoAuditable {
  actorId: string | null;
  /** Código estable: "usuario.crear", "sesion.iniciar", "estudio.aprobar"… */
  accion: string;
  entidad?: string;
  entidadId?: string;
  /** Contexto legible. NUNCA contraseñas, tokens ni llaves. */
  metadata?: Record<string, unknown>;
}

/**
 * Escribe en `audit_logs` (solo el servidor puede: los usuarios no tienen
 * permiso de inserción). Nunca rompe la acción principal: si falla, lo deja
 * en el log del servidor.
 */
export async function registrarAuditoria(evento: EventoAuditable) {
  try {
    const h = await headers();
    const ip =
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      h.get("x-real-ip") ||
      null;
    const { error } = await createAdminClient()
      .from("audit_logs")
      .insert({
        actor_id: evento.actorId,
        accion: evento.accion,
        entidad: evento.entidad ?? null,
        entidad_id: evento.entidadId ?? null,
        metadata: evento.metadata ?? null,
        ip: ip && /^[0-9a-f.:]+$/i.test(ip) ? ip : null,
        user_agent: h.get("user-agent"),
      });
    if (error) console.error("[auditoria]", error.message);
  } catch (e) {
    console.error("[auditoria]", e);
  }
}
