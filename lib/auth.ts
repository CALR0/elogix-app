import "server-only";
import { cache } from "react";
import { forbidden, redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

export type AppRole = "usuario" | "admin";

export interface CurrentUser {
  id: string;
  email: string;
  fullName: string | null;
  role: AppRole;
}

/**
 * Data Access Layer: única puerta para leer la sesión. Verifica el JWT y carga
 * el perfil activo. Devuelve null si no hay sesión o el usuario está inactivo.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  // Supabase compara la vigencia del token con Date.now(). Con Cache Components
  // la hora no se puede leer al prerenderizar: connection() hace que esto corra
  // solo cuando llega la petición del usuario.
  await connection();
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, active")
    .eq("id", userId)
    .single();

  if (!profile?.active) return null;

  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    role: profile.role,
  };
});

/** Exige sesión. Úsalo al inicio de cada página, Server Function y Route Handler protegidos. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Exige rol admin. */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== "admin") forbidden();
  return user;
}

/** Ruta de inicio según el rol. */
export function homePathFor(user: Pick<CurrentUser, "role">) {
  return user.role === "admin" ? "/dashboard" : "/inicio";
}
