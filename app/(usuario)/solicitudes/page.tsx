import type { Metadata } from "next";
import { ListaSolicitudes } from "@/components/solicitudes/lista-solicitudes";
import { SOLICITUDES_DEMO } from "@/lib/solicitudes/mock";

export const metadata: Metadata = { title: "Mis solicitudes" };

/** MAQUETA con datos de ejemplo. El usuario ve el estado, nunca resultados. */
export default function HistorialPage() {
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
      <ListaSolicitudes solicitudes={SOLICITUDES_DEMO} />
    </div>
  );
}
