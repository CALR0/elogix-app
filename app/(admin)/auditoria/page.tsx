import type { Metadata } from "next";
import { Lock } from "lucide-react";
import { VisorAuditoria } from "@/components/admin/visor-auditoria";
import { AUDITORIA_DEMO } from "@/lib/auditoria/mock";

export const metadata: Metadata = { title: "Auditoría" };

/** Registro de auditoría. MAQUETA con datos de ejemplo. */
export default function AuditoriaPage() {
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Auditoría
          </h1>
          <p className="text-muted-foreground text-sm">
            Toda la actividad de la plataforma: quién hizo qué, cuándo y desde
            dónde.
          </p>
        </div>
        <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
          <Lock className="size-3.5" aria-hidden />
          Los registros no se pueden editar ni borrar.
        </p>
      </header>
      <VisorAuditoria eventos={AUDITORIA_DEMO} />
    </div>
  );
}
