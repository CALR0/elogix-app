"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardCheck,
  LayoutDashboard,
  ScrollText,
  Users,
} from "lucide-react";
import { cx } from "@/lib/utils";

const NAV_ADMIN = [
  { href: "/dashboard", label: "Panel", icon: LayoutDashboard },
  { href: "/estudios", label: "Estudios", icon: ClipboardCheck },
  { href: "/usuarios", label: "Usuarios", icon: Users },
  { href: "/auditoria", label: "Auditoría", icon: ScrollText },
] as const;

type Activo = (href: string) => boolean;
const ninguno: Activo = () => false;

function useActivo(): Activo {
  const pathname = usePathname();
  return (href) => pathname === href || pathname.startsWith(`${href}/`);
}

/*
 * usePathname() suspende en rutas con parámetros dinámicos (/estudios/[numero]),
 * así que el layout envuelve estos menús en <Suspense> y usa las versiones
 * "Estatico" (sin resaltar la página activa) como respaldo.
 */
export function NavLateral({ porRevisar }: { porRevisar: number }) {
  return <MenuLateral porRevisar={porRevisar} activo={useActivo()} />;
}

export function NavLateralEstatico({ porRevisar }: { porRevisar: number }) {
  return <MenuLateral porRevisar={porRevisar} activo={ninguno} />;
}

export function NavInferiorAdmin({ porRevisar }: { porRevisar: number }) {
  return <MenuInferior porRevisar={porRevisar} activo={useActivo()} />;
}

export function NavInferiorAdminEstatico({
  porRevisar,
}: {
  porRevisar: number;
}) {
  return <MenuInferior porRevisar={porRevisar} activo={ninguno} />;
}

/** Menú del panel lateral (escritorio), sobre fondo verde de marca. */
function MenuLateral({
  porRevisar,
  activo,
}: {
  porRevisar: number;
  activo: Activo;
}) {
  return (
    <nav aria-label="Principal" className="space-y-1">
      {NAV_ADMIN.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          aria-current={activo(href) ? "page" : undefined}
          className={cx(
            "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
            activo(href)
              ? "bg-white/12 text-white"
              : "text-white/65 hover:bg-white/6 hover:text-white",
          )}
        >
          <Icon className="size-[18px]" aria-hidden />
          <span className="flex-1">{label}</span>
          {href === "/estudios" && porRevisar > 0 && (
            <span className="bg-brand text-brand-deep rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums">
              {porRevisar}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}

/** Barra inferior (celular). */
function MenuInferior({
  porRevisar,
  activo,
}: {
  porRevisar: number;
  activo: Activo;
}) {
  return (
    <nav
      aria-label="Principal"
      className="bg-card fixed inset-x-0 bottom-0 z-20 border-t pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="grid grid-cols-4">
        {NAV_ADMIN.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={activo(href) ? "page" : undefined}
              className={cx(
                "relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium",
                activo(href) ? "text-primary" : "text-muted-foreground",
              )}
            >
              <span
                className={cx(
                  "relative flex h-7 w-12 items-center justify-center rounded-full",
                  activo(href) && "bg-secondary",
                )}
              >
                <Icon className="size-[18px]" aria-hidden />
                {href === "/estudios" && porRevisar > 0 && (
                  <span className="bg-primary text-primary-foreground absolute -top-1 right-0 rounded-full px-1.5 text-[10px] leading-4 font-semibold">
                    {porRevisar}
                  </span>
                )}
              </span>
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
