import "server-only";
import { createClient } from "@/lib/supabase/server";
import { referencia } from "@/lib/utils";
import type { CategoriaAuditoria, EventoAuditoria } from "./tipos";

/**
 * Eventos de `audit_logs` para la pantalla de Auditoría. Se leen con la sesión
 * del admin (RLS: solo admin lee; nadie edita ni borra). Llamar después de
 * `requireAdmin()`.
 *
 * Volumen: se traen los más recientes (LIMITE) y se filtran/paginan en el
 * cliente. Si el registro crece mucho, pasar filtros y página al servidor
 * (`.range()` + filtros por `accion`/`actor_id`/fecha en la consulta).
 */

const LIMITE = 1000;

type Fila = {
  id: number;
  accion: string;
  entidad: string | null;
  entidad_id: string | null;
  metadata: Record<string, unknown> | null;
  ip: string | null;
  created_at: string;
  actor: {
    full_name: string | null;
    email: string;
    role: "usuario" | "admin";
  } | null;
};

const CATEGORIA: Record<string, CategoriaAuditoria> = {
  sesion: "sesion",
  solicitud: "solicitud",
  estudio: "estudio",
  usuario: "usuario",
  configuracion: "configuracion",
  tusdatos: "sistema",
};

const ROLES: Record<string, string> = {
  admin: "administrador",
  usuario: "usuario",
};

/** Frase legible de cada acción (cae en `metadata.detalle` o en el código). */
function describir(f: Fila, objetivo: string | undefined): string {
  const m = (f.metadata ?? {}) as Record<string, string | undefined>;
  const quien = objetivo ?? "un usuario";
  switch (f.accion) {
    case "sesion.iniciar":
      return "Inició sesión";
    case "sesion.cerrar":
      return "Cerró sesión";
    case "sesion.fallida":
      return `Intento de inicio de sesión fallido${m.email ? ` · ${m.email}` : ""}`;
    case "usuario.crear":
      return `Creó la cuenta de ${m.nombre ?? quien}${m.rol ? ` (${ROLES[m.rol] ?? m.rol})` : ""}`;
    case "usuario.cambiar_rol":
      return `Cambió el rol de ${quien} a ${ROLES[m.rol ?? ""] ?? m.rol}`;
    case "usuario.activar":
      return `Activó la cuenta de ${quien}`;
    case "usuario.desactivar":
      return `Desactivó la cuenta de ${quien}`;
    case "usuario.editar": {
      const partes = [
        m.correo_nuevo && `correo: ${m.correo_anterior} → ${m.correo_nuevo}`,
        m.contrasena && "restableció la contraseña",
      ].filter(Boolean);
      return `Editó el acceso de ${quien}${partes.length ? ` (${partes.join("; ")})` : ""}`;
    }
    case "estudio.aprobar":
      return `Aprobó el estudio${m.comentario ? ` · “${m.comentario}”` : ""}`;
    case "estudio.rechazar":
      return `Rechazó el estudio${m.comentario ? ` · “${m.comentario}”` : ""}`;
    case "estudio.reabrir":
      return "Reabrió la revisión del estudio";
    default:
      return m.detalle ?? f.accion;
  }
}

export async function listarAuditoria(): Promise<EventoAuditoria[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select(
      "id, accion, entidad, entidad_id, metadata, ip, created_at, actor:profiles!audit_logs_actor_id_fkey(full_name, email, role)",
    )
    .order("created_at", { ascending: false })
    .limit(LIMITE);
  if (error) throw new Error(error.message);
  const filas = data as unknown as Fila[];

  // Nombres de los objetivos: SOL- de las solicitudes y nombre de los usuarios
  const ids = (entidad: string) => [
    ...new Set(
      filas
        .filter((f) => f.entidad === entidad && f.entidad_id)
        .map((f) => f.entidad_id!),
    ),
  ];
  const [solicitudes, perfiles] = await Promise.all([
    ids("solicitud").length
      ? supabase
          .from("solicitudes")
          .select("id, numero")
          .in("id", ids("solicitud"))
      : Promise.resolve({ data: [] as { id: string; numero: number }[] }),
    ids("usuario").length
      ? supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", ids("usuario"))
      : Promise.resolve({
          data: [] as { id: string; full_name: string | null; email: string }[],
        }),
  ]);
  const numeros = new Map(
    (solicitudes.data ?? []).map((s) => [s.id, s.numero]),
  );
  const nombres = new Map(
    (perfiles.data ?? []).map((p) => [p.id, p.full_name || p.email]),
  );

  return filas.map((f) => {
    const m = (f.metadata ?? {}) as Record<string, string | undefined>;
    const numero =
      f.entidad === "solicitud" ? numeros.get(f.entidad_id ?? "") : undefined;
    return {
      id: f.id,
      fecha: f.created_at,
      actor: f.actor
        ? { nombre: f.actor.full_name || f.actor.email, rol: f.actor.role }
        : f.accion === "sesion.fallida"
          ? { nombre: m.email ?? "Desconocido", rol: "usuario" }
          : { nombre: "Sistema", rol: "sistema" },
      categoria: CATEGORIA[f.accion.split(".")[0]] ?? "sistema",
      accion: f.accion,
      detalle: describir(
        f,
        f.entidad === "usuario" ? nombres.get(f.entidad_id ?? "") : undefined,
      ),
      referencia: numero ? referencia(numero) : undefined,
      ip: f.ip ?? undefined,
      resultado: /error|fallida/.test(f.accion) ? "error" : "ok",
    };
  });
}
