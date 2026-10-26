"use server";

export type LoginState = { error?: string } | null;

/**
 * Inicio de sesión. Pendiente (Fase 3): validar con Zod y llamar a
 * supabase.auth.signInWithPassword(), luego redirect(homePathFor(user)).
 * Por ahora no hace nada.
 */
export async function iniciarSesion(): Promise<LoginState> {
  return null;
}
