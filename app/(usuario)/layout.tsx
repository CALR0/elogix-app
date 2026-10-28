import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import logo from "@/public/brand/elogia-logo.svg";
import {
  ChipSesion,
  ChipSesionCargando,
} from "@/components/sesion/chip-sesion";
import { RefrescoEnVivo } from "@/components/sesion/refresco-en-vivo";
import { NavInferior, NavSuperior } from "@/components/usuario/nav";

// La decisión del admin se copia a "solicitudes": basta con escuchar esa tabla
const TABLAS_USUARIO = ["solicitudes"] as const;

/**
 * Layout del rol usuario. La sesión se lee en <ChipSesion> (dentro de
 * Suspense): sin sesión redirige al login. El marco se prerenderiza.
 */
export default function UsuarioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <RefrescoEnVivo tablas={TABLAS_USUARIO} />
      <header className="bg-card sticky top-0 z-20 border-b">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
          <Link href="/inicio" className="shrink-0">
            <Image
              src={logo}
              alt="Elogia Soluciones Logísticas"
              priority
              className="h-auto w-24"
            />
          </Link>

          <NavSuperior />

          <Suspense fallback={<ChipSesionCargando variante="usuario" />}>
            <ChipSesion variante="usuario" />
          </Suspense>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-28 sm:px-6 sm:pt-10 md:pb-16">
        {children}
      </main>

      <NavInferior />
    </div>
  );
}
