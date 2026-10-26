import type { Metadata } from "next";
import { BandejaEstudios } from "@/components/admin/bandeja-estudios";
import { ESTUDIOS_DEMO } from "@/lib/estudios/mock";

export const metadata: Metadata = { title: "Estudios" };

/** Bandeja de estudios del admin. MAQUETA con datos de ejemplo. */
export default function EstudiosPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Estudios
        </h1>
        <p className="text-muted-foreground text-sm">
          Ordenados por riesgo: lo más grave primero.
        </p>
      </header>
      <BandejaEstudios estudios={ESTUDIOS_DEMO} />
    </div>
  );
}
