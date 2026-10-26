import Image from "next/image";
import Link from "next/link";
import { LogOut } from "lucide-react";
import logo from "@/public/brand/elogia-logo.svg";
import { NavInferior, NavSuperior } from "@/components/usuario/nav";
import { USUARIO_DEMO } from "@/lib/solicitudes/mock";

/**
 * Layout del rol usuario. MAQUETA: el usuario es de ejemplo.
 * Pendiente (Fase 3): requireUser() y datos reales del perfil.
 */
export default function UsuarioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
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

          <div className="flex items-center gap-3">
            <div className="hidden text-right leading-tight lg:block">
              <p className="text-sm font-medium">{USUARIO_DEMO.nombre}</p>
              <p className="text-muted-foreground text-xs">Usuario</p>
            </div>
            <span
              className="bg-brand-deep flex size-9 items-center justify-center rounded-full text-xs font-semibold text-white"
              aria-hidden
            >
              {USUARIO_DEMO.iniciales}
            </span>
            <Link
              href="/login"
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              className="text-muted-foreground hover:bg-secondary hover:text-foreground flex size-9 items-center justify-center rounded-lg transition-colors"
            >
              <LogOut className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-28 sm:px-6 sm:pt-10 md:pb-16">
        {children}
      </main>

      <NavInferior />
    </div>
  );
}
