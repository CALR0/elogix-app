import type { Metadata } from "next";
import { Suspense } from "react";
import { Lock, Radio } from "lucide-react";
import { VisorAuditoria } from "@/components/admin/visor-auditoria";
import { RefrescoEnVivo } from "@/components/sesion/refresco-en-vivo";
import { requireAdmin } from "@/lib/auth";
import { listarAuditoria } from "@/lib/auditoria/datos";

export const metadata: Metadata = { title: "Auditoría" };

/** Los eventos nuevos llegan en vivo (Supabase Realtime, solo para admin). */
const TABLAS_AUDITORIA = ["audit_logs"] as const;

/** Registro de auditoría real (`audit_logs`), en tiempo real. */
export default function AuditoriaPage() {
  return (
    <div className="space-y-6">
      <RefrescoEnVivo tablas={TABLAS_AUDITORIA} />
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
        <div className="text-muted-foreground flex flex-col items-end gap-1 text-xs">
          <span className="flex items-center gap-1.5">
            <Radio className="text-primary size-3.5" aria-hidden />
            Se actualiza en tiempo real
          </span>
          <span className="flex items-center gap-1.5">
            <Lock className="size-3.5" aria-hidden />
            Los registros no se pueden editar ni borrar
          </span>
        </div>
      </header>
      <Suspense
        fallback={
          <div
            className="bg-card h-96 animate-pulse rounded-2xl border"
            aria-busy="true"
            aria-label="Cargando auditoría"
          />
        }
      >
        <Registro />
      </Suspense>
    </div>
  );
}

async function Registro() {
  await requireAdmin();
  return <VisorAuditoria eventos={await listarAuditoria()} />;
}
