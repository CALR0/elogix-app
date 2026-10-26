"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CarFront, House, IdCard, ListChecks } from "lucide-react";
import { cx } from "@/lib/utils";

export const NAV_USUARIO = [
  { href: "/inicio", label: "Inicio", icon: House },
  { href: "/solicitudes/nueva/documento", label: "Documento", icon: IdCard },
  { href: "/solicitudes/nueva/vehiculo", label: "Vehículo", icon: CarFront },
  {
    href: "/solicitudes",
    label: "Mis solicitudes",
    icon: ListChecks,
  },
] as const;

function useActivo() {
  const pathname = usePathname();
  return (href: string) =>
    href === "/solicitudes" ? pathname === href : pathname.startsWith(href);
}

/** Navegación horizontal (escritorio / tablet). */
export function NavSuperior() {
  const activo = useActivo();
  return (
    <nav aria-label="Principal" className="hidden items-center gap-1 md:flex">
      {NAV_USUARIO.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          aria-current={activo(href) ? "page" : undefined}
          className={cx(
            "flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium whitespace-nowrap transition-colors",
            activo(href)
              ? "bg-secondary text-accent-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Icon className="size-4" aria-hidden />
          {label}
        </Link>
      ))}
    </nav>
  );
}

/** Barra inferior fija (celular): al alcance del pulgar. */
export function NavInferior() {
  const activo = useActivo();
  return (
    <nav
      aria-label="Principal"
      className="bg-card fixed inset-x-0 bottom-0 z-20 border-t pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="grid grid-cols-4">
        {NAV_USUARIO.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={activo(href) ? "page" : undefined}
              className={cx(
                "flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                activo(href) ? "text-primary" : "text-muted-foreground",
              )}
            >
              <span
                className={cx(
                  "flex h-7 w-12 items-center justify-center rounded-full transition-colors",
                  activo(href) && "bg-secondary",
                )}
              >
                <Icon className="size-[18px]" aria-hidden />
              </span>
              {label === "Mis solicitudes" ? "Solicitudes" : label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
