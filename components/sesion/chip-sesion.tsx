import { cerrarSesion } from "@/app/(auth)/login/actions";
import { BotonCerrarSesion } from "@/components/sesion/boton-cerrar-sesion";
import { requireAdmin, requireUser, type CurrentUser } from "@/lib/auth";
import { cx } from "@/lib/utils";

type Variante = "usuario" | "admin-lateral" | "admin-movil";

function iniciales(nombre: string) {
  return nombre
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

/** Sin Supabase configurado (maquetas en desarrollo) se muestra un usuario de ejemplo. */
const SIN_SUPABASE = !process.env.NEXT_PUBLIC_SUPABASE_URL;

/**
 * Nombre del usuario y botón de cerrar sesión. Además es la verificación de
 * rol del layout: si no hay sesión redirige al login, y en el admin, si el
 * rol no es admin, muestra la página 403. Lee la sesión, así que siempre va
 * dentro de <Suspense>.
 */
export async function ChipSesion({ variante }: { variante: Variante }) {
  const usuario: Pick<CurrentUser, "fullName" | "email" | "role"> = SIN_SUPABASE
    ? {
        fullName:
          variante === "usuario"
            ? "Usuario de prueba"
            : "Administrador de prueba",
        email: "",
        role: variante === "usuario" ? "usuario" : "admin",
      }
    : variante === "usuario"
      ? await requireUser()
      : await requireAdmin();

  const nombre = usuario.fullName || usuario.email;
  const rol = usuario.role === "admin" ? "Administrador" : "Usuario";

  const salir = (
    <form action={cerrarSesion}>
      <BotonCerrarSesion
        className={cx(
          "flex items-center justify-center rounded-lg transition-colors disabled:opacity-60",
          variante === "usuario"
            ? "text-muted-foreground hover:bg-secondary hover:text-foreground size-9"
            : "size-8 text-white/60 hover:bg-white/10 hover:text-white",
        )}
      />
    </form>
  );

  if (variante === "admin-lateral") {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-white/6 p-3">
        <span className="bg-brand text-brand-deep flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
          {iniciales(nombre)}
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-sm font-medium">{nombre}</p>
          <p className="text-xs text-white/50">{rol}</p>
        </div>
        {salir}
      </div>
    );
  }

  if (variante === "admin-movil") {
    return (
      <div className="flex items-center gap-2">
        <span
          title={nombre}
          className="bg-brand text-brand-deep flex size-8 items-center justify-center rounded-full text-xs font-semibold"
        >
          {iniciales(nombre)}
        </span>
        {salir}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="hidden text-right leading-tight lg:block">
        <p className="text-sm font-medium">{nombre}</p>
        <p className="text-muted-foreground text-xs">{rol}</p>
      </div>
      <span
        className="bg-brand-deep flex size-9 items-center justify-center rounded-full text-xs font-semibold text-white"
        aria-hidden
      >
        {iniciales(nombre)}
      </span>
      {salir}
    </div>
  );
}

/** Marcador mientras se lee la sesión. */
export function ChipSesionCargando({ variante }: { variante: Variante }) {
  return (
    <span
      aria-hidden
      className={cx(
        "block animate-pulse rounded-full",
        variante === "usuario" ? "bg-secondary size-9" : "size-9 bg-white/10",
        variante === "admin-lateral" && "h-15 w-full rounded-xl",
      )}
    />
  );
}
