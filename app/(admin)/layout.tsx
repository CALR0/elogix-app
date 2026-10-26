import Image from "next/image";
import Link from "next/link";
import { LogOut } from "lucide-react";
import logo from "@/public/brand/elogia-logo.svg";
import { Suspense } from "react";
import {
  NavInferiorAdmin,
  NavInferiorAdminEstatico,
  NavLateral,
  NavLateralEstatico,
} from "@/components/admin/nav";
import { ADMIN_DEMO, ESTUDIOS_DEMO } from "@/lib/estudios/mock";

/**
 * Layout del rol admin. MAQUETA con datos de ejemplo.
 * Pendiente (Fase 3): requireAdmin() y conteos reales.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const porRevisar = ESTUDIOS_DEMO.filter(
    (e) => e.estado === "por_revisar",
  ).length;

  return (
    <div className="flex min-h-dvh">
      {/* Panel lateral (escritorio) */}
      <aside className="bg-brand-deep sticky top-0 hidden h-dvh w-64 shrink-0 flex-col px-4 py-6 text-white lg:flex">
        <Link href="/dashboard" className="mb-10 px-2">
          <Image
            src={logo}
            alt="Elogia Soluciones Logísticas"
            priority
            className="h-auto w-32 brightness-0 invert"
          />
        </Link>
        <p className="mb-2 px-3 text-[11px] font-medium tracking-[0.2em] text-white/40 uppercase">
          Administración
        </p>
        <Suspense fallback={<NavLateralEstatico porRevisar={porRevisar} />}>
          <NavLateral porRevisar={porRevisar} />
        </Suspense>

        <div className="mt-auto flex items-center gap-3 rounded-xl bg-white/6 p-3">
          <span className="bg-brand text-brand-deep flex size-9 items-center justify-center rounded-full text-xs font-semibold">
            {ADMIN_DEMO.iniciales}
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-medium">{ADMIN_DEMO.nombre}</p>
            <p className="text-xs text-white/50">Administrador</p>
          </div>
          <Link
            href="/login"
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            className="flex size-8 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <LogOut className="size-4" aria-hidden />
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Encabezado (celular / tablet) */}
        <header className="bg-brand-deep sticky top-0 z-20 flex h-14 items-center justify-between px-4 text-white lg:hidden">
          <Image
            src={logo}
            alt="Elogia Soluciones Logísticas"
            priority
            className="h-auto w-20 brightness-0 invert"
          />
          <span className="bg-brand text-brand-deep flex size-8 items-center justify-center rounded-full text-xs font-semibold">
            {ADMIN_DEMO.iniciales}
          </span>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-6 pb-28 sm:px-6 lg:px-10 lg:pt-10 lg:pb-12">
          {children}
        </main>
      </div>

      <Suspense fallback={<NavInferiorAdminEstatico porRevisar={porRevisar} />}>
        <NavInferiorAdmin porRevisar={porRevisar} />
      </Suspense>
    </div>
  );
}
