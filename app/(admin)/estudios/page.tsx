import type { Metadata } from "next";
import { Suspense } from "react";
import { BandejaEstudios } from "@/components/admin/bandeja-estudios";
import { requireAdmin } from "@/lib/auth";
import { listarEstudios } from "@/lib/estudios/datos";

export const metadata: Metadata = { title: "Estudios" };

/** Bandeja de estudios del admin con datos reales. */
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
      <Suspense
        fallback={
          <div
            className="bg-card h-96 animate-pulse rounded-2xl border"
            aria-busy="true"
            aria-label="Cargando estudios"
          />
        }
      >
        <Bandeja />
      </Suspense>
    </div>
  );
}

async function Bandeja() {
  await requireAdmin();
  return <BandejaEstudios estudios={await listarEstudios()} />;
}
