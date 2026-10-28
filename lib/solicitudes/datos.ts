import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Decision, EstadoUsuario, SolicitudResumen } from "./estados";

export type { SolicitudResumen };

export interface FilaSolicitud {
  id: string;
  numero: number;
  tipo_documento: string;
  documento: string | null;
  nombre: string | null;
  placa: string | null;
  tipo_doc_propietario: string | null;
  placa_remolque: string | null;
  estado: EstadoUsuario;
  decision: Decision;
  decision_comentario: string | null;
  created_at: string;
}

export const COLUMNAS_SOLICITUD =
  "id, numero, tipo_documento, documento, nombre, placa, tipo_doc_propietario, placa_remolque, estado, decision, decision_comentario, created_at";

/** "CC 1023456789" o "Placa SNT413 + R41130 · CC 71234556". */
export function describir(s: FilaSolicitud) {
  if (s.tipo_documento === "PLACA") {
    const remolque = s.placa_remolque ? ` + ${s.placa_remolque}` : "";
    return `Placa ${s.placa}${remolque} · ${s.tipo_doc_propietario} ${s.documento}`;
  }
  if (s.tipo_documento === "NOMBRE") return s.nombre ?? "";
  const tipo = s.tipo_documento === "PP" ? "Pasaporte" : s.tipo_documento;
  return `${tipo} ${s.documento}`;
}

export function aResumen(s: FilaSolicitud): SolicitudResumen {
  return {
    id: s.id,
    numero: s.numero,
    modulo: s.tipo_documento === "PLACA" ? "vehiculo" : "documento",
    descripcion: describir(s),
    estado: s.estado,
    fecha: s.created_at,
    decision: s.decision,
    comentario: s.decision_comentario,
  };
}

/**
 * Solicitudes del usuario de la sesión. RLS garantiza que solo vea las suyas
 * (y la tabla no tiene resultados). Llamar después de `requireUser()`.
 */
export async function listarMisSolicitudes(usuarioId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("solicitudes")
    .select(COLUMNAS_SOLICITUD)
    .eq("created_by", usuarioId)
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw new Error(error.message);
  return (data as FilaSolicitud[]).map(aResumen);
}
