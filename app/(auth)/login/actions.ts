"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { homePathFor, type AppRole } from "@/lib/auth";
import { registrarAuditoria } from "@/lib/auditoria";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { error?: string } | null;

const credenciales = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1),
});

const DESACTIVADA = "Tu cuenta está desactivada. Contacta al administrador.";

/** Inicio de sesión con Supabase Auth y redirección según el rol. */
export async function iniciarSesion(
  _previo: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const p = credenciales.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!p.success) return { error: "Escribe tu correo y contraseña." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(p.data);

  if (error || !data.user) {
    // Mensaje genérico: no revelar si el correo existe
    await registrarAuditoria({
      actorId: null,
      accion: "sesion.fallida",
      metadata: { email: p.data.email },
    });
    return {
      error:
        error?.code === "user_banned"
          ? DESACTIVADA
          : "Correo o contraseña incorrectos.",
    };
  }

  // El perfil se lee con la sesión recién creada (RLS: cada quien ve el suyo)
  const { data: perfil } = await supabase
    .from("profiles")
    .select("role, active")
    .eq("id", data.user.id)
    .single();

  if (!perfil?.active) {
    await supabase.auth.signOut();
    return {
      error: perfil
        ? DESACTIVADA
        : "Tu cuenta no tiene perfil asignado. Contacta al administrador.",
    };
  }

  await registrarAuditoria({ actorId: data.user.id, accion: "sesion.iniciar" });
  redirect(homePathFor({ role: perfil.role as AppRole }));
}

/** Cierra la sesión y vuelve al login. */
export async function cerrarSesion() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (data?.claims?.sub) {
    await registrarAuditoria({
      actorId: data.claims.sub,
      accion: "sesion.cerrar",
    });
  }
  await supabase.auth.signOut();
  redirect("/login");
}
