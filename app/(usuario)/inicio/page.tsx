import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CarFront, IdCard } from "lucide-react";
import { EstadoBadge } from "@/components/solicitudes/estado-badge";
import { SOLICITUDES_DEMO, USUARIO_DEMO } from "@/lib/solicitudes/mock";
import { referencia, fechaCorta } from "@/lib/utils";

export const metadata: Metadata = { title: "Inicio" };

const MODULOS = [
  {
    href: "/solicitudes/nueva/documento",
    icon: IdCard,
    titulo: "Consulta por documento",
    texto:
      "Antecedentes de una persona o empresa con su cédula, PPT, pasaporte o NIT.",
    etiqueta: "CC · CE · PPT · PP · NIT",
  },
  {
    href: "/solicitudes/nueva/vehiculo",
    icon: CarFront,
    titulo: "Consulta por vehículo",
    texto:
      "Placa del vehículo y documento del propietario: RUNT, SOAT, multas y más.",
    etiqueta: "Placa + propietario",
  },
];

/** Inicio del usuario. MAQUETA con datos de ejemplo. */
export default function InicioUsuarioPage() {
  const recientes = SOLICITUDES_DEMO.slice(0, 5);
  const conteo = {
    enCurso: SOLICITUDES_DEMO.filter(
      (s) => s.estado === "enviada" || s.estado === "procesando",
    ).length,
    finalizadas: SOLICITUDES_DEMO.filter((s) => s.estado === "finalizada")
      .length,
    error: SOLICITUDES_DEMO.filter((s) => s.estado === "error").length,
  };

  return (
    <div className="space-y-10">
      <header className="space-y-1">
        <p className="text-muted-foreground text-sm">
          Hola, {USUARIO_DEMO.nombre.split(" ")[0]}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          ¿Qué deseas consultar hoy?
        </h1>
      </header>

      {/* Módulos */}
      <section className="grid gap-4 sm:grid-cols-2">
        {MODULOS.map(({ href, icon: Icon, titulo, texto, etiqueta }) => (
          <Link
            key={href}
            href={href}
            className="group bg-card hover:border-primary/50 relative flex flex-col overflow-hidden rounded-2xl border p-6 transition-colors sm:p-7"
          >
            <span className="bg-brand-deep flex size-12 items-center justify-center rounded-xl text-white">
              <Icon className="size-6" aria-hidden />
            </span>
            <h2 className="mt-5 text-lg font-semibold">{titulo}</h2>
            <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
              {texto}
            </p>
            <div className="mt-6 flex items-center justify-between">
              <span className="text-muted-foreground text-xs font-medium tracking-wide">
                {etiqueta}
              </span>
              <span className="text-primary flex items-center gap-1.5 text-sm font-medium">
                Iniciar
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </span>
            </div>
            {/* Línea de ruta decorativa */}
            <span
              className="border-brand/40 pointer-events-none absolute -top-10 -right-10 size-40 rounded-full border border-dashed"
              aria-hidden
            />
          </Link>
        ))}
      </section>

      {/* Resumen */}
      <section className="grid grid-cols-3 gap-3">
        {[
          { valor: conteo.enCurso, label: "En curso" },
          { valor: conteo.finalizadas, label: "Finalizadas" },
          { valor: conteo.error, label: "Por reintentar" },
        ].map(({ valor, label }) => (
          <div key={label} className="bg-card rounded-xl border px-4 py-3.5">
            <p className="text-2xl font-semibold tabular-nums">{valor}</p>
            <p className="text-muted-foreground text-xs">{label}</p>
          </div>
        ))}
      </section>

      {/* Recientes */}
      <section className="space-y-3">
        <div className="flex items-end justify-between">
          <h2 className="font-semibold">Solicitudes recientes</h2>
          <Link
            href="/solicitudes"
            className="text-primary text-sm font-medium hover:underline"
          >
            Ver todas
          </Link>
        </div>
        <ul className="bg-card divide-y rounded-2xl border">
          {recientes.map((s) => (
            <li
              key={s.numero}
              className="flex items-center justify-between gap-4 px-4 py-3.5 sm:px-5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{s.descripcion}</p>
                <p className="text-muted-foreground text-xs tabular-nums">
                  {referencia(s.numero)} · {fechaCorta(s.fecha)}
                </p>
              </div>
              <EstadoBadge estado={s.estado} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
