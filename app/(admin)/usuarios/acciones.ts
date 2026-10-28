"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { registrarAuditoria } from "@/lib/auditoria";
import { createAdminClient } from "@/lib/supabase/admin";
import type { UsuarioFila } from "@/lib/usuarios/tipos";

/**
 * Acciones del admin sobre cuentas. Todas: requireAdmin() → validar con Zod →
 * Supabase Auth Admin (secret key, solo servidor) → audit_logs.
 * Las contraseñas nunca se registran ni se devuelven.
 */

export type Resultado<T = undefined> =
  { ok: true; mensaje: string; dato?: T } | { ok: false; error: string };

const BLOQUEO = "876000h"; // ~100 años: Supabase no tiene "bloqueo indefinido"

const email = z.email("Correo inválido.").trim().toLowerCase();
const clave = z
  .string()
  .min(10, "La contraseña debe tener al menos 10 caracteres.");
const rol = z.enum(["usuario", "admin"]);
const id = z.uuid();

function mensajeAuth(codigo: string | undefined, mensaje: string) {
  if (codigo === "email_exists" || /already been registered/i.test(mensaje))
    return "Ya existe un usuario con ese correo.";
  if (codigo === "weak_password") return "La contraseña es demasiado débil.";
  return "No se pudo completar la operación. Intenta de nuevo.";
}

export async function crearUsuario(entrada: {
  nombre: string;
  email: string;
  rol: "usuario" | "admin";
  clave: string;
}): Promise<Resultado<UsuarioFila>> {
  const yo = await requireAdmin();
  const p = z
    .object({
      nombre: z.string().trim().min(3, "Escribe el nombre completo."),
      email,
      rol,
      clave,
    })
    .safeParse(entrada);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };

  const { data, error } = await createAdminClient().auth.admin.createUser({
    email: p.data.email,
    password: p.data.clave,
    email_confirm: true,
    user_metadata: { full_name: p.data.nombre },
    app_metadata: { role: p.data.rol }, // el trigger crea el perfil con este rol
  });
  if (error || !data.user)
    return { ok: false, error: mensajeAuth(error?.code, error?.message ?? "") };

  await registrarAuditoria({
    actorId: yo.id,
    accion: "usuario.crear",
    entidad: "usuario",
    entidadId: data.user.id,
    metadata: { nombre: p.data.nombre, email: p.data.email, rol: p.data.rol },
  });
  revalidatePath("/usuarios");
  return {
    ok: true,
    mensaje: `Se creó la cuenta de ${p.data.nombre}.`,
    dato: {
      id: data.user.id,
      nombre: p.data.nombre,
      email: p.data.email,
      rol: p.data.rol,
      activo: true,
      solicitudes: 0,
      ultimaActividad: data.user.created_at,
    },
  };
}

export async function cambiarRol(
  usuarioId: string,
  nuevoRol: "usuario" | "admin",
): Promise<Resultado> {
  const yo = await requireAdmin();
  if (!id.safeParse(usuarioId).success || !rol.safeParse(nuevoRol).success)
    return { ok: false, error: "Datos inválidos." };
  if (usuarioId === yo.id && nuevoRol !== "admin")
    return {
      ok: false,
      error: "No puedes quitarte tu propio rol de administrador.",
    };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(usuarioId, {
    app_metadata: { role: nuevoRol },
  });
  if (error)
    return { ok: false, error: mensajeAuth(error.code, error.message) };
  const perfil = await admin
    .from("profiles")
    .update({ role: nuevoRol })
    .eq("id", usuarioId);
  if (perfil.error)
    return { ok: false, error: "No se pudo actualizar el rol." };

  await registrarAuditoria({
    actorId: yo.id,
    accion: "usuario.cambiar_rol",
    entidad: "usuario",
    entidadId: usuarioId,
    metadata: { rol: nuevoRol },
  });
  revalidatePath("/usuarios");
  return { ok: true, mensaje: "Rol actualizado." };
}

/**
 * Desactivar: `profiles.active = false` (RLS le corta todo acceso a datos) y
 * bloqueo en Supabase Auth (no puede volver a iniciar sesión ni renovarla).
 */
export async function cambiarEstado(
  usuarioId: string,
  activo: boolean,
): Promise<Resultado> {
  const yo = await requireAdmin();
  if (!id.safeParse(usuarioId).success)
    return { ok: false, error: "Datos inválidos." };
  if (usuarioId === yo.id && !activo)
    return { ok: false, error: "No puedes desactivar tu propia cuenta." };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(usuarioId, {
    ban_duration: activo ? "none" : BLOQUEO,
  });
  if (error)
    return { ok: false, error: mensajeAuth(error.code, error.message) };
  const perfil = await admin
    .from("profiles")
    .update({ active: activo })
    .eq("id", usuarioId);
  if (perfil.error)
    return { ok: false, error: "No se pudo actualizar el estado." };

  await registrarAuditoria({
    actorId: yo.id,
    accion: activo ? "usuario.activar" : "usuario.desactivar",
    entidad: "usuario",
    entidadId: usuarioId,
  });
  revalidatePath("/usuarios");
  return {
    ok: true,
    mensaje: activo ? "Cuenta activada." : "Cuenta desactivada.",
  };
}

export async function editarAcceso(
  usuarioId: string,
  cambios: { email: string; clave: string },
): Promise<Resultado> {
  const yo = await requireAdmin();
  const p = z
    .object({ id, email, clave: z.union([z.literal(""), clave]) })
    .safeParse({ id: usuarioId, ...cambios });
  if (!p.success) return { ok: false, error: p.error.issues[0].message };

  const admin = createAdminClient();
  const actual = await admin
    .from("profiles")
    .select("email")
    .eq("id", usuarioId)
    .single();
  if (actual.error) return { ok: false, error: "El usuario no existe." };

  const cambiaCorreo = actual.data.email !== p.data.email;
  const cambiaClave = p.data.clave !== "";
  if (!cambiaCorreo && !cambiaClave)
    return { ok: true, mensaje: "No hubo cambios." };

  const { error } = await admin.auth.admin.updateUserById(usuarioId, {
    ...(cambiaCorreo && { email: p.data.email, email_confirm: true }),
    ...(cambiaClave && { password: p.data.clave }),
  });
  if (error)
    return { ok: false, error: mensajeAuth(error.code, error.message) };
  if (cambiaCorreo) {
    await admin
      .from("profiles")
      .update({ email: p.data.email })
      .eq("id", usuarioId);
  }

  await registrarAuditoria({
    actorId: yo.id,
    accion: "usuario.editar",
    entidad: "usuario",
    entidadId: usuarioId,
    metadata: {
      ...(cambiaCorreo && {
        correo_anterior: actual.data.email,
        correo_nuevo: p.data.email,
      }),
      ...(cambiaClave && { contrasena: "restablecida" }),
    },
  });
  revalidatePath("/usuarios");
  const que = [
    cambiaCorreo && "el correo",
    cambiaClave && "la contraseña",
  ].filter(Boolean);
  return { ok: true, mensaje: `Se actualizó ${que.join(" y ")}.` };
}
