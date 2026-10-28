import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, CarFront, IdCard } from "lucide-react";
import {
  ComentarioAdmin,
  EstadoBadge,
  etapaDe,
} from "@/components/solicitudes/estado-badge";
import { requireUser } from "@/lib/auth";
import { listarMisSolicitudes } from "@/lib/solicitudes/datos";
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

/** Inicio del usuario. Los módulos son estáticos; saludo y datos llegan con la sesión. */
export default function InicioUsuarioPage() {
  return (
    <div className="space-y-10">
      <header className="space-y-1">
        <Suspense
          fallback={
            <p className="bg-secondary h-5 w-24 animate-pulse rounded" />
          }
        >
          <Saludo />
        </Suspense>
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

      <Suspense fallback={<ResumenCargando />}>
        <ResumenYRecientes />
      </Suspense>
    </div>
  );
}

async function Saludo() {
  const yo = await requireUser();
  const nombre = (yo.fullName || yo.email).split(/[\s@]/)[0];
  return <p className="text-muted-foreground text-sm">Hola, {nombre}</p>;
}

async function ResumenYRecientes() {
  const yo = await requireUser();
  const solicitudes = await listarMisSolicitudes(yo.id);
  const recientes = solicitudes.slice(0, 5);
  const etapas = solicitudes.map((s) => etapaDe(s.estado, s.decision));
  const contar = (...e: string[]) => etapas.filter((x) => e.includes(x)).length;
  const conteo = [
    { valor: contar("enviada", "procesando", "revision"), label: "En curso" },
    { valor: contar("aprobada"), label: "Aprobadas" },
    { valor: contar("rechazada"), label: "Rechazadas" },
    { valor: contar("error"), label: "Por reintentar" },
  ];

  return (
    <>
      {/* Resumen */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {conteo.map(({ valor, label }) => (
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
          {solicitudes.length > 0 && (
            <Link
              href="/solicitudes"
              className="text-primary text-sm font-medium hover:underline"
            >
              Ver todas
            </Link>
          )}
        </div>
        {recientes.length === 0 ? (
          <p className="bg-card text-muted-foreground rounded-2xl border px-6 py-10 text-center text-sm">
            Aún no has enviado consultas. Empieza con uno de los módulos de
            arriba.
          </p>
        ) : (
          <ul className="bg-card divide-y rounded-2xl border">
            {recientes.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between gap-4 px-4 py-3.5 sm:px-5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {s.descripcion}
                  </p>
                  <p className="text-muted-foreground text-xs tabular-nums">
                    {referencia(s.numero)} · {fechaCorta(s.fecha)}
                  </p>
                  <ComentarioAdmin texto={s.comentario} />
                </div>
                <EstadoBadge estado={s.estado} decision={s.decision} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function ResumenCargando() {
  return (
    <div
      className="space-y-10"
      aria-busy="true"
      aria-label="Cargando solicitudes"
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-card h-20 animate-pulse rounded-xl border"
          />
        ))}
      </div>
      <div className="bg-card h-64 animate-pulse rounded-2xl border" />
    </div>
  );
}
