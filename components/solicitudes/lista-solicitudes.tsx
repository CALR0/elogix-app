"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CarFront, IdCard, RotateCcw, Search } from "lucide-react";
import { reintentarEnvio } from "@/app/(usuario)/solicitudes/acciones";
import {
  ComentarioAdmin,
  EstadoBadge,
  etapaDe,
  type Etapa,
} from "@/components/solicitudes/estado-badge";
import { Paginacion, usePaginacion } from "@/components/ui/paginacion";
import { inputClasses } from "@/components/ui/field";
import type { SolicitudResumen } from "@/lib/solicitudes/estados";
import { cx, referencia, fechaCorta } from "@/lib/utils";

const FILTROS: Array<{ valor: "todas" | "curso" | Etapa; label: string }> = [
  { valor: "todas", label: "Todas" },
  { valor: "curso", label: "En curso" },
  { valor: "aprobada", label: "Aprobadas" },
  { valor: "rechazada", label: "Rechazadas" },
  { valor: "error", label: "No enviadas" },
];

/** En curso: todavía sin decisión (enviada, en proceso o en revisión). */
const EN_CURSO: Etapa[] = ["enviada", "procesando", "revision"];

function Modulo({ modulo }: { modulo: SolicitudResumen["modulo"] }) {
  const Icon = modulo === "vehiculo" ? CarFront : IdCard;
  return (
    <span className="bg-secondary text-accent-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
      <Icon className="size-4" aria-hidden />
      <span className="sr-only">
        {modulo === "vehiculo"
          ? "Consulta por vehículo"
          : "Consulta por documento"}
      </span>
    </span>
  );
}

/** Reintenta el envío de la MISMA solicitud (no crea otra). */
function Reintentar({ s }: { s: SolicitudResumen }) {
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();
  const [error, setError] = useState("");
  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        disabled={pendiente}
        onClick={() =>
          startTransition(async () => {
            const r = await reintentarEnvio(s.id);
            setError(r.ok ? "" : r.mensaje);
            router.refresh();
          })
        }
        className="text-primary inline-flex items-center gap-1.5 text-xs font-medium hover:underline disabled:opacity-60"
      >
        <RotateCcw
          className={cx("size-3.5", pendiente && "animate-spin")}
          aria-hidden
        />
        {pendiente ? "Reintentando…" : "Reintentar"}
      </button>
      {error && (
        <span
          role="alert"
          className="text-destructive max-w-48 text-right text-[11px]"
        >
          No se pudo: intenta en unos segundos.
        </span>
      )}
    </span>
  );
}

/** Lista filtrable de las solicitudes del usuario. Paginación en servidor en la Fase 3. */
export function ListaSolicitudes({
  solicitudes,
}: {
  solicitudes: SolicitudResumen[];
}) {
  const [filtro, setFiltro] =
    useState<(typeof FILTROS)[number]["valor"]>("todas");
  const [q, setQ] = useState("");

  const filtradas = useMemo(() => {
    const texto = q.trim().toLowerCase().replace(/\./g, "");
    return solicitudes.filter((s) => {
      const etapa = etapaDe(s.estado, s.decision);
      const pasaFiltro =
        filtro === "todas" ||
        (filtro === "curso" ? EN_CURSO.includes(etapa) : etapa === filtro);
      const pasaTexto =
        !texto ||
        s.descripcion.toLowerCase().replace(/\./g, "").includes(texto) ||
        referencia(s.numero).toLowerCase().includes(texto);
      return pasaFiltro && pasaTexto;
    });
  }, [solicitudes, filtro, q]);

  const { ancla, visibles, reiniciar, props } = usePaginacion(filtradas);

  return (
    <div ref={ancla} className="scroll-mt-24 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          className="-mx-4 flex [scrollbar-width:none] gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
          role="tablist"
        >
          {FILTROS.map((f) => (
            <button
              key={f.valor}
              role="tab"
              aria-selected={filtro === f.valor}
              onClick={() => {
                setFiltro(f.valor);
                reiniciar();
              }}
              className={cx(
                "h-9 shrink-0 rounded-full border px-4 text-sm font-medium transition-colors",
                filtro === f.valor
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative sm:w-72">
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
            placeholder="Buscar documento, placa o SOL-…"
            aria-label="Buscar solicitudes"
            className={cx(inputClasses, "h-10 pl-9")}
          />
        </div>
      </div>

      {filtradas.length === 0 ? (
        <p className="bg-card text-muted-foreground rounded-2xl border px-6 py-12 text-center text-sm">
          No hay solicitudes que coincidan.
        </p>
      ) : (
        <>
          {/* Escritorio: tabla */}
          <div className="bg-card hidden overflow-hidden rounded-2xl border md:block">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-muted-foreground text-left text-xs">
                <tr>
                  <th className="px-5 py-3 font-medium">Consulta</th>
                  <th className="px-5 py-3 font-medium">Referencia</th>
                  <th className="px-5 py-3 font-medium">Fecha</th>
                  <th className="px-5 py-3 font-medium">Estado</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {visibles.map((s) => (
                  <tr key={s.id} className="hover:bg-secondary/30">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Modulo modulo={s.modulo} />
                        <div className="min-w-0">
                          <span className="font-medium">{s.descripcion}</span>
                          <ComentarioAdmin texto={s.comentario} />
                        </div>
                      </div>
                    </td>
                    <td className="text-muted-foreground px-5 py-3 font-mono text-xs">
                      {referencia(s.numero)}
                    </td>
                    <td className="text-muted-foreground px-5 py-3 tabular-nums">
                      {fechaCorta(s.fecha)}
                    </td>
                    <td className="px-5 py-3">
                      <EstadoBadge estado={s.estado} decision={s.decision} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      {s.estado === "error" && <Reintentar s={s} />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Celular: tarjetas */}
          <ul className="space-y-3 md:hidden">
            {visibles.map((s) => (
              <li key={s.id} className="bg-card rounded-xl border p-4">
                <div className="flex items-start gap-3">
                  <Modulo modulo={s.modulo} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {s.descripcion}
                    </p>
                    <p className="text-muted-foreground text-xs tabular-nums">
                      {referencia(s.numero)} · {fechaCorta(s.fecha)}
                    </p>
                    <ComentarioAdmin texto={s.comentario} />
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <EstadoBadge estado={s.estado} decision={s.decision} />
                  {s.estado === "error" && <Reintentar s={s} />}
                </div>
              </li>
            ))}
          </ul>
          <Paginacion {...props} etiqueta="solicitudes" singular="solicitud" />
        </>
      )}
    </div>
  );
}
