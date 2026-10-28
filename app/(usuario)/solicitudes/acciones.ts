"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { registrarAuditoria } from "@/lib/auditoria";
import { lanzarConsulta } from "@/lib/solicitudes/procesar";
import {
  consultaDocumentoSchema,
  consultaVehiculoSchema,
  erroresPorCampo,
} from "@/lib/solicitudes/schemas";
import { createClient } from "@/lib/supabase/server";

/**
 * Crear solicitudes (usuario). Se valida otra vez en el servidor con los
 * mismos esquemas del formulario y se inserta con la sesión del usuario: RLS
 * y los grants por columna solo le permiten escribir los datos de entrada
 * (`created_by` lo pone la BD). Después el sistema lanza la consulta.
 */

export type ResultadoEnvio =
  | { ok: true; numero: number }
  | {
      ok: false;
      mensaje: string;
      errores?: Record<string, string>;
      solicitudId?: string;
    };

const FALLO = "No se pudo registrar la solicitud. Intenta de nuevo.";

async function insertarYLanzar(
  fila: Record<string, unknown>,
  detalle: string,
): Promise<ResultadoEnvio> {
  const yo = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("solicitudes")
    .insert(fila)
    .select("id, numero")
    .single();
  if (error || !data) {
    console.error("[solicitudes] insertar", error?.message);
    return { ok: false, mensaje: FALLO };
  }

  await registrarAuditoria({
    actorId: yo.id,
    accion: "solicitud.crear",
    entidad: "solicitud",
    entidadId: data.id,
    metadata: { detalle, numero: data.numero },
  });

  const r = await lanzarConsulta(data.id);
  revalidatePath("/solicitudes");
  revalidatePath("/inicio");
  return r.ok
    ? { ok: true, numero: data.numero }
    : { ok: false, mensaje: r.mensaje, solicitudId: data.id };
}

export async function crearConsultaDocumento(
  datos: unknown,
): Promise<ResultadoEnvio> {
  const p = consultaDocumentoSchema.safeParse(datos);
  if (!p.success) {
    return {
      ok: false,
      mensaje: "Revisa los datos.",
      errores: erroresPorCampo(p.error),
    };
  }
  const d = p.data;
  return insertarYLanzar(
    {
      tipo_documento: d.tipo,
      documento: d.documento,
      nombre: d.tipo === "PP" ? d.nombre : null,
      fecha_expedicion:
        d.tipo === "CE" || d.tipo === "PPT" ? d.fechaExpedicion : null,
      autorizacion_titular: true,
    },
    `Consulta por documento · ${d.tipo} ${d.documento}`,
  );
}

export async function crearConsultaVehiculo(
  datos: unknown,
): Promise<ResultadoEnvio> {
  const p = consultaVehiculoSchema.safeParse(datos);
  if (!p.success) {
    return {
      ok: false,
      mensaje: "Revisa los datos.",
      errores: erroresPorCampo(p.error),
    };
  }
  const d = p.data;
  const otroPropietario = d.incluirRemolque && !d.remolqueMismoPropietario;
  return insertarYLanzar(
    {
      tipo_documento: "PLACA",
      placa: d.placa,
      documento: d.documentoPropietario,
      tipo_doc_propietario: d.tipoPropietario,
      placa_remolque: d.incluirRemolque ? d.placaRemolque : null,
      tipo_doc_propietario_remolque: otroPropietario
        ? d.tipoPropietarioRemolque
        : null,
      documento_propietario_remolque: otroPropietario
        ? d.documentoPropietarioRemolque
        : null,
      autorizacion_titular: true,
    },
    `Consulta por vehículo · Placa ${d.placa}${d.incluirRemolque ? ` + remolque ${d.placaRemolque}` : ""}`,
  );
}

/** "Intentar de nuevo" de una solicitud propia que no se pudo enviar. */
export async function reintentarEnvio(
  solicitudId: string,
): Promise<ResultadoEnvio> {
  const yo = await requireUser();
  const supabase = await createClient();
  // RLS: solo encuentra la solicitud si es del usuario (o si es admin)
  const { data } = await supabase
    .from("solicitudes")
    .select("id, numero, estado, created_by")
    .eq("id", solicitudId)
    .single();
  if (!data || data.created_by !== yo.id)
    return { ok: false, mensaje: "Solicitud no encontrada." };
  if (data.estado !== "error") return { ok: true, numero: data.numero };

  await registrarAuditoria({
    actorId: yo.id,
    accion: "solicitud.reintentar",
    entidad: "solicitud",
    entidadId: data.id,
    metadata: { detalle: "El usuario reintentó el envío" },
  });
  const r = await lanzarConsulta(data.id);
  revalidatePath("/solicitudes");
  revalidatePath("/inicio");
  return r.ok
    ? { ok: true, numero: data.numero }
    : { ok: false, mensaje: r.mensaje, solicitudId: data.id };
}
