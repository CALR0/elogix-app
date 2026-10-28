import { NavInferiorAdmin, NavLateral } from "@/components/admin/nav";
import { contarPorRevisar } from "@/lib/estudios/datos";

/** Estudios por revisar para el contador del menú (0 si algo falla: no debe romper el menú). */
async function conteo() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return 0;
  try {
    return await contarPorRevisar();
  } catch {
    return 0;
  }
}

/** Menús del admin con el contador real. Leen la sesión: van dentro de <Suspense>. */
export async function NavLateralConConteo() {
  return <NavLateral porRevisar={await conteo()} />;
}

export async function NavInferiorConConteo() {
  return <NavInferiorAdmin porRevisar={await conteo()} />;
}
