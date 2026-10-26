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
import {
  ACTIVIDAD_DEMO,
  ADMIN_DEMO,
  CREDITOS_DEMO,
  ESTUDIOS_DEMO,
  FUENTES_ESTADO_DEMO,
  PESO_NIVEL,
} from "@/lib/estudios/mock";
import { cx, referencia, fechaCorta } from "@/lib/utils";

export const metadata: Metadata = { title: "Panel" };

/** Hallazgos del mes (ejemplo). */
const HALLAZGOS_MES = {
  alto: 7,
  medio: 15,
  bajo: 22,
  info: 31,
  sin_hallazgo: 96,
};

/** Panel del admin. MAQUETA: gráficas en CSS puro (sin librerías) para que cargue rápido. */
export default function DashboardPage() {
  const porRevisar = ESTUDIOS_DEMO.filter((e) => e.estado === "por_revisar");
  const altos = porRevisar.filter((e) => e.nivel === "alto").length;
  const enProceso = ESTUDIOS_DEMO.filter(
    (e) => e.estado === "procesando",
  ).length;
  const conError = ESTUDIOS_DEMO.filter(
    (e) => e.estado === "fuentes_error" || e.estado === "error_envio",
  ).length;
  const atencion = ESTUDIOS_DEMO.filter((e) =>
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

  const pctCreditos = Math.round(
    (CREDITOS_DEMO.disponibles / CREDITOS_DEMO.comprados) * 100,
  );
  const maxActividad = Math.max(...ACTIVIDAD_DEMO);
  const totalMes = Object.values(HALLAZGOS_MES).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-sm">
            Buen día, {ADMIN_DEMO.nombre}
          </p>
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
          <p className="mt-3 text-2xl font-semibold tabular-nums sm:text-3xl">
            {CREDITOS_DEMO.disponibles}
            <span className="text-muted-foreground text-sm font-normal">
              {" "}
              / {CREDITOS_DEMO.comprados}
            </span>
          </p>
          <div className="bg-secondary mt-3 h-1.5 overflow-hidden rounded-full">
            <div
              className="bg-primary h-full rounded-full"
              style={{ width: `${pctCreditos}%` }}
            />
          </div>
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
              const valor = HALLAZGOS_MES[n];
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
              {ACTIVIDAD_DEMO.reduce((a, b) => a + b, 0)} en total
            </span>
          </div>
          <div
            className="mt-5 flex min-h-28 flex-1 items-end gap-1.5 sm:gap-2"
            role="img"
            aria-label="Consultas por día en los últimos 14 días"
          >
            {ACTIVIDAD_DEMO.map((v, i) => (
              <span
                key={i}
                title={`${v} consultas`}
                className={cx(
                  "flex-1 rounded-t-[3px]",
                  i === ACTIVIDAD_DEMO.length - 1
                    ? "bg-primary"
                    : "bg-brand/55",
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
                v: FUENTES_ESTADO_DEMO.operativas,
                l: "Operativas",
                c: "text-primary",
              },
              {
                v: FUENTES_ESTADO_DEMO.mantenimiento,
                l: "Mantenimiento",
                c: "text-[#9a5512]",
              },
              {
                v: FUENTES_ESTADO_DEMO.caidas,
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
            Las fuentes caídas pueden causar errores en las consultas.
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
