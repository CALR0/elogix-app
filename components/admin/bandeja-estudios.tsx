"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CarFront, CheckCheck, IdCard, Search } from "lucide-react";
import { EstadoEstudioTexto, NivelBadge } from "@/components/admin/badges";
import { Paginacion, usePaginacion } from "@/components/ui/paginacion";
import { inputClasses } from "@/components/ui/field";
import {
  PESO_NIVEL,
  type Estudio,
  type EstadoEstudio,
} from "@/lib/estudios/mock";
import { cx, referencia, fechaCorta } from "@/lib/utils";

const PESTANAS: Array<{
  valor: string;
  label: string;
  estados: EstadoEstudio[] | null;
}> = [
  { valor: "revisar", label: "Por revisar", estados: ["por_revisar"] },
  { valor: "proceso", label: "En proceso", estados: ["procesando"] },
  {
    valor: "error",
    label: "Con error",
    estados: ["fuentes_error", "error_envio"],
  },
  {
    valor: "revisados",
    label: "Revisados",
    estados: ["aprobado", "rechazado"],
  },
  { valor: "todos", label: "Todos", estados: null },
];

function IconoModulo({ modulo }: { modulo: Estudio["modulo"] }) {
  const Icon = modulo === "vehiculo" ? CarFront : IdCard;
  return (
    <span className="bg-secondary text-accent-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
      <Icon className="size-4" aria-hidden />
    </span>
  );
}

/**
 * Bandeja del admin: ordenada por riesgo (alto primero) y con aprobación en
 * lote de los "sin hallazgo" (contexto §14 P4). MAQUETA: los cambios son locales.
 */
export function BandejaEstudios({
  estudios: iniciales,
}: {
  estudios: Estudio[];
}) {
  const [estudios, setEstudios] = useState(iniciales);
  const [pestana, setPestana] = useState("revisar");
  const [q, setQ] = useState("");
  const [seleccion, setSeleccion] = useState<Set<number>>(new Set());

  const conteo = (estados: EstadoEstudio[] | null) =>
    estados
      ? estudios.filter((e) => estados.includes(e.estado)).length
      : estudios.length;

  const filtradas = useMemo(() => {
    const estados = PESTANAS.find((p) => p.valor === pestana)?.estados;
    const texto = q.trim().toLowerCase().replace(/\./g, "");
    return estudios
      .filter((e) => !estados || estados.includes(e.estado))
      .filter(
        (e) =>
          !texto ||
          [
            e.descripcion,
            e.nombreConsultado,
            e.solicitante,
            referencia(e.numero),
          ]
            .join(" ")
            .toLowerCase()
            .replace(/\./g, "")
            .includes(texto),
      )
      .sort(
        (a, b) =>
          PESO_NIVEL[a.nivel ?? "sin_hallazgo"] -
            PESO_NIVEL[b.nivel ?? "sin_hallazgo"] ||
          b.fecha.localeCompare(a.fecha),
      );
  }, [estudios, pestana, q]);

  const { ancla, visibles, reiniciar, props } = usePaginacion(filtradas);

  const seleccionables = filtradas.filter(
    (e) => e.estado === "por_revisar" && e.nivel === "sin_hallazgo",
  );

  function alternar(numero: number) {
    setSeleccion((s) => {
      const n = new Set(s);
      if (n.has(numero)) n.delete(numero);
      else n.add(numero);
      return n;
    });
  }

  function aprobarSeleccion() {
    setEstudios((lista) =>
      lista.map((e) =>
        seleccion.has(e.numero) ? { ...e, estado: "aprobado" } : e,
      ),
    );
    setSeleccion(new Set());
  }

  return (
    <div ref={ancla} className="scroll-mt-20 space-y-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div
          className="-mx-4 flex [scrollbar-width:none] gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
          role="tablist"
        >
          {PESTANAS.map((p) => (
            <button
              key={p.valor}
              role="tab"
              aria-selected={pestana === p.valor}
              onClick={() => {
                setPestana(p.valor);
                reiniciar();
                setSeleccion(new Set());
              }}
              className={cx(
                "flex h-9 shrink-0 items-center gap-2 rounded-lg px-3.5 text-sm font-medium transition-colors",
                pestana === p.valor
                  ? "bg-brand-deep text-white"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              {p.label}
              <span
                className={cx(
                  "rounded-full px-1.5 text-[11px] tabular-nums",
                  pestana === p.valor ? "bg-white/15" : "bg-secondary",
                )}
              >
                {conteo(p.estados)}
              </span>
            </button>
          ))}
        </div>
        <div className="relative xl:w-80">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden
          />
          <input
            type="search"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              reiniciar();
            }}
            placeholder="Documento, placa, nombre o SOL-…"
            aria-label="Buscar estudios"
            className={cx(inputClasses, "h-10 pl-9")}
          />
        </div>
      </div>

      {/* Aprobación en lote */}
      {pestana === "revisar" && seleccionables.length > 0 && (
        <div className="bg-secondary/60 flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm">
            <strong className="font-semibold">{seleccionables.length}</strong>{" "}
            estudios sin hallazgos. Selecciónalos para aprobarlos juntos.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() =>
                setSeleccion(new Set(seleccionables.map((e) => e.numero)))
              }
              className="hover:bg-card h-9 rounded-lg border px-3 text-sm font-medium transition-colors"
            >
              Seleccionar todos
            </button>
            <button
              onClick={aprobarSeleccion}
              disabled={seleccion.size === 0}
              className="bg-primary text-primary-foreground hover:bg-primary-hover inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors disabled:opacity-50"
            >
              <CheckCheck className="size-4" aria-hidden />
              Aprobar ({seleccion.size})
            </button>
          </div>
        </div>
      )}

      {filtradas.length === 0 ? (
        <p className="bg-card text-muted-foreground rounded-2xl border px-6 py-14 text-center text-sm">
          No hay estudios en esta bandeja.
        </p>
      ) : (
        <>
          {/* Escritorio */}
          <div className="bg-card hidden overflow-hidden rounded-2xl border md:block">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-muted-foreground text-left text-xs">
                <tr>
                  <th className="w-10 py-3 pl-5" />
                  <th className="px-4 py-3 font-medium">Riesgo</th>
                  <th className="px-4 py-3 font-medium">Consulta</th>
                  <th className="px-4 py-3 font-medium">Solicitante</th>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {visibles.map((e) => {
                  const puedeSeleccionar =
                    e.estado === "por_revisar" && e.nivel === "sin_hallazgo";
                  return (
                    <tr
                      key={e.numero}
                      className="group hover:bg-secondary/30 relative"
                    >
                      <td className="py-3 pl-5">
                        {puedeSeleccionar && (
                          <input
                            type="checkbox"
                            checked={seleccion.has(e.numero)}
                            onChange={() => alternar(e.numero)}
                            aria-label={`Seleccionar ${referencia(e.numero)}`}
                            className="accent-primary relative z-10 size-4"
                          />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <NivelBadge nivel={e.nivel} />
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/estudios/${e.numero}`}
                          className="flex items-center gap-3 after:absolute after:inset-0"
                        >
                          <IconoModulo modulo={e.modulo} />
                          <span className="min-w-0">
                            <span className="block font-medium group-hover:underline">
                              {e.descripcion}
                            </span>
                            <span className="text-muted-foreground block truncate text-xs">
                              {e.nombreConsultado} · {referencia(e.numero)}
                            </span>
                          </span>
                        </Link>
                      </td>
                      <td className="text-muted-foreground px-4 py-3">
                        {e.solicitante}
                      </td>
                      <td className="text-muted-foreground px-4 py-3 whitespace-nowrap tabular-nums">
                        {fechaCorta(e.fecha)}
                      </td>
                      <td className="px-4 py-3">
                        <EstadoEstudioTexto estado={e.estado} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Celular */}
          <ul className="space-y-3 md:hidden">
            {visibles.map((e) => (
              <li key={e.numero}>
                <Link
                  href={`/estudios/${e.numero}`}
                  className="bg-card block rounded-xl border p-4"
                >
                  <div className="flex items-start gap-3">
                    <IconoModulo modulo={e.modulo} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {e.descripcion}
                      </p>
                      <p className="text-muted-foreground truncate text-xs">
                        {e.nombreConsultado}
                      </p>
                      <p className="text-muted-foreground text-xs tabular-nums">
                        {referencia(e.numero)} · {e.solicitante} ·{" "}
                        {fechaCorta(e.fecha)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <NivelBadge nivel={e.nivel} />
                    <EstadoEstudioTexto estado={e.estado} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <Paginacion {...props} etiqueta="estudios" singular="estudio" />
        </>
      )}
    </div>
  );
}
