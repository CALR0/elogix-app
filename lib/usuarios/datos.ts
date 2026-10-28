import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { UsuarioFila } from "./tipos";

/**
 * Lista de usuarios para el admin. Llamar SOLO después de `requireAdmin()`:
 * usa la secret key para leer `auth.users` (último inicio de sesión).
 * Volumen esperado bajo (personal de Elogia): se trae completa y se pagina
 * en el cliente. Si crece, paginar con `.range()`.
 */
export async function listarUsuarios(): Promise<UsuarioFila[]> {
  const admin = createAdminClient();
  const [perfiles, cuentas, solicitudes] = await Promise.all([
    admin
      .from("profiles")
      .select("id, email, full_name, role, active, created_at")
      .order("full_name", { ascending: true, nullsFirst: false }),
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    admin.from("solicitudes").select("created_by"),
  ]);

  if (perfiles.error) throw new Error(perfiles.error.message);

  const ultimoAcceso = new Map(
    (cuentas.data?.users ?? []).map((u) => [u.id, u.last_sign_in_at]),
  );
  const conteo = new Map<string, number>();
  for (const s of solicitudes.data ?? []) {
    conteo.set(s.created_by, (conteo.get(s.created_by) ?? 0) + 1);
  }

  return perfiles.data.map((p) => ({
    id: p.id,
    nombre: p.full_name ?? p.email,
    email: p.email,
    rol: p.role,
    activo: p.active,
    solicitudes: conteo.get(p.id) ?? 0,
    ultimaActividad: ultimoAcceso.get(p.id) ?? p.created_at,
  }));
}
