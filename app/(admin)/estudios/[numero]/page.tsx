import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CarFront,
  CircleCheck,
  CircleX,
  Download,
  ExternalLink,
  FileText,
  IdCard,
  TriangleAlert,
} from "lucide-react";
import {
  EstadoEstudioTexto,
  NIVELES_ORDEN,
  NivelBadge,
  nivelInfo,
} from "@/components/admin/badges";
import {
  BotonReintentar,
  PanelDecision,
} from "@/components/admin/panel-decision";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { obtenerEstudio } from "@/lib/estudios/datos";
import type { ResultadoFuente } from "@/lib/estudios/tipos";
import { cx, referencia, fechaCorta } from "@/lib/utils";

export const metadata: Metadata = { title: "Revisar estudio" };

const FUENTE: Record<
  ResultadoFuente,
  { label: string; icon: typeof CircleCheck; clase: string }
> = {
  ok: { label: "Sin hallazgo", icon: CircleCheck, clase: "text-hallazgo-sin" },
  hallazgo: {
    label: "Con hallazgo",
    icon: TriangleAlert,
    clase: "text-[#b9461f]",
  },
  error: { label: "Error", icon: CircleX, clase: "text-destructive" },
};

/**
 * Revisor de un estudio con datos reales (`obtenerEstudio`). Botones de reporte/PDF:
 * pendientes de la API real (contexto §16.3, paso 8).
 * El número se lee dentro de <Suspense> (Cache Components + Partial
 * Prefetching): el marco de la página se prerenderiza y el estudio llega en streaming.
 */
export default function EstudioPage({
  params,
}: PageProps<"/estudios/[numero]">) {
  return (
    <div className="space-y-6">
      <Link
        href="/estudios"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Estudios
      </Link>
      <Suspense fallback={<RevisorCargando />}>
        <Revisor params={params} />
      </Suspense>
    </div>
  );
}

function RevisorCargando() {
  return (
    <div
      className="animate-pulse space-y-6"
      aria-busy="true"
      aria-label="Cargando estudio"
    >
      <div className="bg-card h-32 rounded-2xl border" />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="bg-card h-80 rounded-2xl border" />
        <div className="bg-card h-56 rounded-2xl border" />
      </div>
    </div>
  );
}

async function Revisor({
  params,
}: Pick<PageProps<"/estudios/[numero]">, "params">) {
  await requireAdmin();
  const { numero } = await params;
  const estudio = await obtenerEstudio(Number(numero));
  if (!estudio) notFound();

  const Icon = estudio.modulo === "vehiculo" ? CarFront : IdCard;
  const fuentes = Object.entries(estudio.fuentes);
  const conError = fuentes.filter(([, r]) => r === "error").map(([f]) => f);
  const terminado = fuentes.length > 0;

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <header className="bg-card flex flex-col gap-5 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-4">
          <span className="bg-brand-deep flex size-12 shrink-0 items-center justify-center rounded-xl text-white">
            <Icon className="size-6" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-muted-foreground flex items-center gap-2 font-mono text-xs">
              {referencia(estudio.numero)}
              {estudio.simulada && (
                <span className="bg-secondary rounded px-1.5 py-0.5 font-sans text-[10px] font-medium">
                  Consulta simulada · no salió a TusDatos
                </span>
              )}
            </p>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              {estudio.descripcion}
            </h1>
            <p className="text-muted-foreground mt-0.5 text-sm">
              {estudio.nombreConsultado}
            </p>
            <p className="text-muted-foreground mt-2 text-xs">
              Solicitado por{" "}
              <span className="text-foreground font-medium">
                {estudio.solicitante}
              </span>{" "}
              · {fechaCorta(estudio.fecha)}
            </p>
          </div>
        </div>
        <div className="flex flex-row items-center gap-3 sm:flex-col sm:items-end">
          <NivelBadge nivel={estudio.nivel} grande />
          <EstadoEstudioTexto estado={estudio.estado} />
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-6">
          {/* Fuentes con error */}
          {conError.length > 0 && (
            <section className="flex flex-col gap-3 rounded-2xl border border-[#d9822b]/30 bg-[#d9822b]/8 p-4 text-[#9a5512] sm:flex-row sm:items-center sm:justify-between dark:text-[#f2b67a]">
              <div className="flex gap-3">
                <TriangleAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
                <div>
                  <p className="text-sm font-semibold">
                    {conError.length} fuente{conError.length > 1 && "s"} con
                    error
                  </p>
                  <p className="text-xs opacity-80">
                    {conError.join(", ")}. El reintento no consume créditos.
                  </p>
                </div>
              </div>
              <BotonReintentar
                solicitudId={estudio.id}
                reintentos={estudio.reintentos}
              />
            </section>
          )}

          {/* Hallazgos */}
          <section className="bg-card rounded-2xl border">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="font-semibold">Hallazgos</h2>
              <span className="text-muted-foreground text-xs">
                {estudio.hallazgos.length} encontrados
              </span>
            </div>
            {!terminado ? (
              <p className="text-muted-foreground px-5 py-10 text-center text-sm">
                Aún no hay resultados para este estudio.
              </p>
            ) : estudio.hallazgos.length === 0 ? (
              <div className="flex flex-col items-center px-5 py-10 text-center">
                <span className="bg-hallazgo-sin/10 text-hallazgo-sin flex size-12 items-center justify-center rounded-full">
                  <CircleCheck className="size-6" aria-hidden />
                </span>
                <p className="mt-3 font-medium">Sin hallazgos</p>
                <p className="text-muted-foreground text-sm">
                  Ninguna fuente reportó información relevante.
                </p>
              </div>
            ) : (
              <ul className="divide-y">
                {NIVELES_ORDEN.flatMap((n) =>
                  estudio.hallazgos
                    .filter((h) => h.nivel === n)
                    .map((h) => (
                      <li
                        key={h.codigo}
                        className="relative flex gap-4 px-5 py-4"
                      >
                        <span
                          className={cx(
                            "absolute inset-y-3 left-0 w-1 rounded-r-full",
                            nivelInfo(h.nivel).punto,
                          )}
                          aria-hidden
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium">{h.titulo}</p>
                            <NivelBadge nivel={h.nivel} />
                          </div>
                          <p className="text-muted-foreground mt-1 text-sm">
                            {h.descripcion}
                          </p>
                          <p className="text-muted-foreground mt-2 text-xs">
                            {h.fuente} ·{" "}
                            <span className="font-mono">{h.codigo}</span>
                          </p>
                        </div>
                      </li>
                    )),
                )}
              </ul>
            )}
          </section>

          {/* Fuentes consultadas */}
          {terminado && (
            <section className="bg-card rounded-2xl border p-5">
              <h2 className="font-semibold">Fuentes consultadas</h2>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {fuentes.map(([nombre, resultado]) => {
                  const { label, icon: FIcon, clase } = FUENTE[resultado];
                  return (
                    <li
                      key={nombre}
                      className="bg-secondary/40 flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm"
                    >
                      <span className="truncate">{nombre}</span>
                      <span
                        className={cx(
                          "flex shrink-0 items-center gap-1 text-xs font-medium",
                          clase,
                        )}
                      >
                        <FIcon className="size-3.5" aria-hidden />
                        {label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>

        {/* Columna lateral */}
        <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <PanelDecision
            key={estudio.estado}
            solicitudId={estudio.id}
            estadoInicial={estudio.estado}
            comentarioInicial={estudio.comentario}
          />

          {terminado && (
            <section className="bg-card rounded-2xl border p-5">
              <h2 className="font-semibold">Reporte oficial</h2>
              <p className="text-muted-foreground mt-1 text-xs">
                Generado por TusDatos. Se abre a través de ELOGIX (requiere rol
                admin).
              </p>
              <div className="mt-4 space-y-2">
                <span className="hover:bg-secondary flex h-10 cursor-not-allowed items-center gap-3 rounded-lg border px-3 text-sm opacity-80">
                  <FileText
                    className="text-muted-foreground size-4"
                    aria-hidden
                  />
                  <span className="flex-1">Ver reporte</span>
                  <ExternalLink
                    className="text-muted-foreground size-3.5"
                    aria-hidden
                  />
                </span>
                <span className="hover:bg-secondary flex h-10 cursor-not-allowed items-center gap-3 rounded-lg border px-3 text-sm opacity-80">
                  <Download
                    className="text-muted-foreground size-4"
                    aria-hidden
                  />
                  <span className="flex-1">Descargar PDF</span>
                </span>
              </div>
            </section>
          )}

          {/* Historial */}
          <section className="bg-card rounded-2xl border p-5">
            <h2 className="font-semibold">Historial</h2>
            <ol className="mt-4 space-y-4">
              {estudio.eventos.map((ev, i) => (
                <li key={i} className="relative flex gap-3 pl-1">
                  {i < estudio.eventos.length - 1 && (
                    <span
                      className="bg-border absolute top-4 bottom-[-1.25rem] left-[7px] w-px"
                      aria-hidden
                    />
                  )}
                  <span
                    className={cx(
                      "border-card relative mt-1 size-3 shrink-0 rounded-full border-2 ring-1",
                      ev.tipo === "error"
                        ? "bg-destructive ring-destructive/40"
                        : ev.tipo === "ok"
                          ? "bg-primary ring-primary/40"
                          : "bg-brand ring-brand/40",
                    )}
                    aria-hidden
                  />
                  <div>
                    <p className="text-sm">{ev.texto}</p>
                    <p className="text-muted-foreground text-xs tabular-nums">
                      {fechaCorta(ev.fecha)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
    </div>
  );
}
