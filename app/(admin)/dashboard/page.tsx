import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CarFront,
  CircleCheck,
  ClipboardCheck,
  IdCard,
  LoaderCircle,
  RefreshCcw,
  Wallet,
} from "lucide-react";
import {
  EstadoEstudioTexto,
  NIVELES_ORDEN,
  NivelBadge,
  nivelInfo,
} from "@/components/admin/badges";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { listarEstudios } from "@/lib/estudios/datos";
import {
  PESO_NIVEL,
  type Estudio,
  type NivelHallazgo,
} from "@/lib/estudios/tipos";
import { cx, referencia, fechaCorta } from "@/lib/utils";

export const metadata: Metadata = { title: "Panel" };

const HORA_MS = 3_600_000;
const DIA_MS = 24 * HORA_MS;
/** Día (número) en hora de Colombia, UTC−5. */
const diaBogota = (ms: number) => Math.floor((ms - 5 * HORA_MS) / DIA_MS);

/** Panel del admin con datos reales. Gráficas en CSS puro (sin librerías) para que cargue rápido. */
export default function DashboardPage() {
  return (
    <Suspense fallback={<PanelCargando />}>
      <Contenido />
    </Suspense>
  );
}

function PanelCargando() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Cargando panel">
      <div className="bg-secondary h-12 w-48 animate-pulse rounded-lg" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-card h-32 animate-pulse rounded-2xl border"
          />
        ))}
      </div>
      <div className="bg-card h-96 animate-pulse rounded-2xl border" />
    </div>
  );
}

/**
 * Consultas por día (últimos 14) y hallazgos del mes en curso, en hora de
 * Colombia. Fuera del componente: lee la hora actual (Date.now).
 */
function resumenTemporal(estudios: Estudio[]) {
  const ahora = Date.now();
  const hoy = diaBogota(ahora);
  const actividad = Array.from(
    { length: 14 },
    (_, i) =>
      estudios.filter(
        (e) => diaBogota(new Date(e.fecha).getTime()) === hoy - 13 + i,
      ).length,
  );
  const local = new Date(ahora - 5 * HORA_MS);
  const inicioMes =
    Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), 1) + 5 * HORA_MS;
  const hallazgosMes: Record<NivelHallazgo, number> = {
    alto: 0,
    medio: 0,
    bajo: 0,
    info: 0,
    sin_hallazgo: 0,
  };
  for (const e of estudios) {
    if (e.nivel && new Date(e.fecha).getTime() >= inicioMes)
      hallazgosMes[e.nivel]++;
  }
  return { actividad, hallazgosMes };
}

async function Contenido() {
  const yo = await requireAdmin();
  const estudios: Estudio[] = await listarEstudios();
  const nombre = (yo.fullName || yo.email).split(/[s@]/)[0];

  const porRevisar = estudios.filter((e) => e.estado === "por_revisar");
  const altos = porRevisar.filter((e) => e.nivel === "alto").length;
  const enProceso = estudios.filter((e) => e.estado === "procesando").length;
  const conError = estudios.filter(
    (e) => e.estado === "fuentes_error" || e.estado === "error_envio",
  ).length;
  const atencion = estudios
    .filter((e) =>
      ["por_revisar", "fuentes_error", "error_envio"].includes(e.estado),
    )
    .sort(
      (a, b) =>
        (a.estado === "por_revisar" ? 0 : 1) -
          (b.estado === "por_revisar" ? 0 : 1) ||
        PESO_NIVEL[a.nivel ?? "sin_hallazgo"] -
          PESO_NIVEL[b.nivel ?? "sin_hallazgo"],
    )
    .slice(0, 5);

  const { actividad, hallazgosMes } = resumenTemporal(estudios);
  const maxActividad = Math.max(1, ...actividad);
  const totalMes = Object.values(hallazgosMes).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-sm">Buen día, {nombre}</p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Panel
          </h1>
        </div>
        <Link
          href="/estudios"
          className="bg-primary text-primary-foreground hover:bg-primary-hover inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors"
        >
          <ClipboardCheck className="size-4" aria-hidden />
          Revisar estudios
        </Link>
      </header>

      {/* KPIs */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <Kpi
          icon={ClipboardCheck}
          valor={porRevisar.length}
          label="Por revisar"
          detalle={altos > 0 ? `${altos} con riesgo alto` : "Sin riesgo alto"}
          destacado
        />
        <Kpi
          icon={LoaderCircle}
          valor={enProceso}
          label="En proceso"
          detalle="Consultando fuentes"
        />
        <Kpi
          icon={RefreshCcw}
          valor={conError}
          label="Con error"
          detalle="Reintento automático activo"
        />
        <div className="bg-card rounded-2xl border p-4 sm:p-5">
          <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium">
            <Wallet className="size-4" aria-hidden />
            Créditos TusDatos
          </div>
          <p className="mt-3 text-2xl font-semibold sm:text-3xl">Simulado</p>
          <p className="text-muted-foreground mt-1 text-xs">
            Sin API key: las consultas no gastan créditos.
          </p>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {/* Requieren atención */}
        <section className="bg-card min-w-0 rounded-2xl border md:col-span-2">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <h2 className="font-semibold">Requieren atención</h2>
            <Link
              href="/estudios"
              className="text-primary text-sm font-medium hover:underline"
            >
              Ver bandeja
            </Link>
          </div>
          {atencion.length === 0 && (
            <p className="text-muted-foreground px-5 py-12 text-center text-sm">
              Nada pendiente. Los estudios nuevos aparecerán aquí.
            </p>
          )}
          <ul className="divide-y">
            {atencion.map((e) => {
              const Icon = e.modulo === "vehiculo" ? CarFront : IdCard;
              return (
                <li key={e.numero}>
                  <Link
                    href={`/estudios/${e.numero}`}
                    className="hover:bg-secondary/40 flex items-center gap-4 px-5 py-3 transition-colors"
                  >
                    <span className="bg-secondary text-accent-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {e.descripcion}
                      </p>
                      <p className="text-muted-foreground truncate text-xs">
                        {referencia(e.numero)} · {e.solicitante} ·{" "}
                        {fechaCorta(e.fecha)}
                      </p>
                    </div>
                    <div className="hidden sm:block">
                      {e.estado === "por_revisar" ? (
                        <NivelBadge nivel={e.nivel} />
                      ) : (
                        <EstadoEstudioTexto estado={e.estado} />
                      )}
                    </div>
                    <ArrowRight
                      className="text-muted-foreground size-4 shrink-0"
                      aria-hidden
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Hallazgos del mes */}
        <section className="bg-card flex flex-col rounded-2xl border p-5">
          <h2 className="font-semibold">Hallazgos del mes</h2>
          <p className="text-muted-foreground text-xs">
            {totalMes} consultas finalizadas
          </p>
          <ul className="mt-4 flex flex-1 flex-col justify-around gap-3">
            {NIVELES_ORDEN.map((n) => {
              const valor = hallazgosMes[n];
              return (
                <li
                  key={n}
                  className="grid grid-cols-[6.5rem_1fr_2rem] items-center gap-3 text-sm"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={cx("size-2 rounded-full", nivelInfo(n).punto)}
                      aria-hidden
                    />
                    {nivelInfo(n).label}
                  </span>
                  <span className="bg-secondary h-2 overflow-hidden rounded-full">
                    <span
                      className={cx(
                        "block h-full rounded-full",
                        nivelInfo(n).punto,
                      )}
                      style={{ width: `${(valor / totalMes) * 100}%` }}
                    />
                  </span>
                  <span className="text-right tabular-nums">{valor}</span>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Actividad */}
        <section className="bg-card flex flex-col rounded-2xl border p-5 xl:col-span-2">
          <div className="flex items-baseline justify-between">
            <h2 className="font-semibold">Consultas · 14 días</h2>
            <span className="text-muted-foreground text-xs tabular-nums">
              {actividad.reduce((a, b) => a + b, 0)} en total
            </span>
          </div>
          <div
            className="mt-5 flex min-h-28 flex-1 items-end gap-1.5 sm:gap-2"
            role="img"
            aria-label="Consultas por día en los últimos 14 días"
          >
            {actividad.map((v, i) => (
              <span
                key={i}
                title={`${v} consultas`}
                className={cx(
                  "flex-1 rounded-t-[3px]",
                  i === actividad.length - 1 ? "bg-primary" : "bg-brand/55",
                )}
                style={{ height: `${(v / maxActividad) * 100}%` }}
              />
            ))}
          </div>
        </section>

        {/* Estado de fuentes */}
        <section className="bg-card flex flex-col rounded-2xl border p-5 md:col-span-2 xl:col-span-1">
          <h2 className="font-semibold">Fuentes de TusDatos</h2>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            {[
              {
                v: "—",
                l: "Operativas",
                c: "text-primary",
              },
              {
                v: "—",
                l: "Mantenimiento",
                c: "text-[#9a5512]",
              },
              {
                v: "—",
                l: "Caídas",
                c: "text-destructive",
              },
            ].map(({ v, l, c }) => (
              <div key={l} className="bg-secondary/50 rounded-xl py-3">
                <p className={cx("text-xl font-semibold tabular-nums", c)}>
                  {v}
                </p>
                <p className="text-muted-foreground text-[11px]">{l}</p>
              </div>
            ))}
          </div>
          <p className="text-muted-foreground mt-auto flex items-center gap-1.5 pt-3 text-xs">
            <CircleCheck className="size-3.5" aria-hidden />
            Modo simulado: con la API se mostrará el estado real de cada fuente.
          </p>
        </section>
      </div>
    </div>
  );
}

function Kpi({
  icon: Icon,
  valor,
  label,
  detalle,
  destacado,
}: {
  icon: typeof Wallet;
  valor: number;
  label: string;
  detalle: string;
  destacado?: boolean;
}) {
  return (
    <div
      className={cx(
        "rounded-2xl border p-4 sm:p-5",
        destacado ? "bg-brand-deep border-transparent text-white" : "bg-card",
      )}
    >
      <div
        className={cx(
          "flex items-center gap-2 text-xs font-medium",
          destacado ? "text-white/70" : "text-muted-foreground",
        )}
      >
        <Icon className="size-4" aria-hidden />
        {label}
      </div>
      <p className="mt-3 text-2xl font-semibold tabular-nums sm:text-3xl">
        {valor}
      </p>
      <p
        className={cx(
          "mt-1 text-xs",
          destacado ? "text-white/60" : "text-muted-foreground",
        )}
      >
        {detalle}
      </p>
    </div>
  );
}
