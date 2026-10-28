import type { Metadata } from "next";
import { Suspense } from "react";
import { ListaSolicitudes } from "@/components/solicitudes/lista-solicitudes";
import { requireUser } from "@/lib/auth";
import { listarMisSolicitudes } from "@/lib/solicitudes/datos";

export const metadata: Metadata = { title: "Mis solicitudes" };

/** El usuario ve el estado de sus solicitudes, nunca resultados. */
export default function MisSolicitudesPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Mis solicitudes
        </h1>
        <p className="text-muted-foreground text-sm">
          Estado de las consultas que has enviado. Los resultados los revisa el
          administrador.
        </p>
      </header>
      <Suspense
        fallback={
          <div
            className="bg-card h-96 animate-pulse rounded-2xl border"
            aria-busy="true"
            aria-label="Cargando solicitudes"
          />
        }
      >
        <Lista />
      </Suspense>
    </div>
  );
}

async function Lista() {
  const yo = await requireUser();
  return <ListaSolicitudes solicitudes={await listarMisSolicitudes(yo.id)} />;
}
