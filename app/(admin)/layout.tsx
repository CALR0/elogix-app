import Image from "next/image";
import Link from "next/link";
import logo from "@/public/brand/elogia-logo.svg";
import { Suspense } from "react";
import {
  NavInferiorAdminEstatico,
  NavLateralEstatico,
} from "@/components/admin/nav";
import {
  NavInferiorConConteo,
  NavLateralConConteo,
} from "@/components/admin/nav-con-conteo";
import {
  ChipSesion,
  ChipSesionCargando,
} from "@/components/sesion/chip-sesion";
import { RefrescoEnVivo } from "@/components/sesion/refresco-en-vivo";

// Cambios que refrescan las pantallas del admin en vivo
const TABLAS_ADMIN = ["solicitudes", "solicitud_resultados"] as const;

/**
 * Layout del rol admin. <ChipSesion> (dentro de Suspense) exige rol admin:
 * sin sesión redirige al login y un usuario normal ve la página 403.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh">
      <RefrescoEnVivo tablas={TABLAS_ADMIN} />
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
        <Suspense fallback={<NavLateralEstatico porRevisar={0} />}>
          <NavLateralConConteo />
        </Suspense>

        <div className="mt-auto">
          <Suspense fallback={<ChipSesionCargando variante="admin-lateral" />}>
            <ChipSesion variante="admin-lateral" />
          </Suspense>
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
          <Suspense fallback={<ChipSesionCargando variante="admin-movil" />}>
            <ChipSesion variante="admin-movil" />
          </Suspense>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-6 pb-28 sm:px-6 lg:px-10 lg:pt-10 lg:pb-12">
          {children}
        </main>
      </div>

      <Suspense fallback={<NavInferiorAdminEstatico porRevisar={0} />}>
        <NavInferiorConConteo />
      </Suspense>
    </div>
  );
}
