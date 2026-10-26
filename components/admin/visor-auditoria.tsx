"use client";

import { useMemo, useState } from "react";
import {
  ClipboardCheck,
  Cpu,
  Download,
  FileInput,
  LogIn,
  Search,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";
import { inputClasses } from "@/components/ui/field";
import { Paginacion, usePaginacion } from "@/components/ui/paginacion";
import type { CategoriaAuditoria, EventoAuditoria } from "@/lib/auditoria/mock";
import { cx, fechaHora } from "@/lib/utils";

const POR_PAGINA = 10;

const CATEGORIAS: Record<
  CategoriaAuditoria,
  { label: string; icon: LucideIcon }
> = {
  sesion: { label: "Sesiones", icon: LogIn },
  solicitud: { label: "Solicitudes", icon: FileInput },
  estudio: { label: "Estudios", icon: ClipboardCheck },
  usuario: { label: "Usuarios", icon: Users },
  configuracion: { label: "Configuración", icon: Settings },
  sistema: { label: "Sistema", icon: Cpu },
};

/** Exporta lo filtrado a CSV (lo descarga el navegador; no sale de la máquina). */
function exportarCsv(eventos: EventoAuditoria[]) {
  const celda = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const filas = [
    [
      "Fecha",
      "Usuario",
      "Rol",
      "Categoría",
      "Acción",
      "Detalle",
      "Referencia",
      "IP",
      "Resultado",
    ],
    ...eventos.map((e) => [
      e.fecha,
      e.actor.nombre,
      e.actor.rol,
      CATEGORIAS[e.categoria].label,
      e.accion,
      e.detalle,
      e.referencia ?? "",
      e.ip ?? "",
      e.resultado,
    ]),
  ];
  const csv = "﻿" + filas.map((f) => f.map(celda).join(";")).join("\n");
  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8" }),
  );
  const a = Object.assign(document.createElement("a"), {
    href: url,
    download: "auditoria-elogix.csv",
  });
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Registro de auditoría. MAQUETA: filtra y pagina en el cliente. En la Fase 3
 * los filtros y la página van en la URL y la consulta a `audit_logs` se pagina
 * en el servidor (índice por fecha).
 */
export function VisorAuditoria({ eventos }: { eventos: EventoAuditoria[] }) {
  const [categoria, setCategoria] = useState<CategoriaAuditoria | "todas">(
    "todas",
  );
  const [actor, setActor] = useState("todos");
  const [soloErrores, setSoloErrores] = useState(false);
  const [q, setQ] = useState("");

  const actores = useMemo(
    () => [...new Set(eventos.map((e) => e.actor.nombre))].sort(),
    [eventos],
  );

  const filtrados = useMemo(() => {
    const texto = q.trim().toLowerCase();
    return eventos.filter(
      (e) =>
        (categoria === "todas" || e.categoria === categoria) &&
        (actor === "todos" || e.actor.nombre === actor) &&
        (!soloErrores || e.resultado === "error") &&
        (!texto ||
          [e.detalle, e.accion, e.referencia ?? "", e.ip ?? ""]
            .join(" ")
            .toLowerCase()
            .includes(texto)),
    );
  }, [eventos, categoria, actor, soloErrores, q]);

  const { ancla, visibles, reiniciar, props } = usePaginacion(
    filtrados,
    POR_PAGINA,
  );

  function filtrar(cambio: () => void) {
    cambio();
    reiniciar();
  }

  return (
    <div ref={ancla} className="scroll-mt-20 space-y-4">
      {/* Categorías */}
      <div
        className="-mx-4 flex [scrollbar-width:none] gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
        role="tablist"
      >
        {(
          ["todas", ...Object.keys(CATEGORIAS)] as Array<
            CategoriaAuditoria | "todas"
          >
        ).map((c) => {
          const Icon = c === "todas" ? null : CATEGORIAS[c].icon;
          return (
            <button
              key={c}
              role="tab"
              aria-selected={categoria === c}
              onClick={() => filtrar(() => setCategoria(c))}
              className={cx(
                "flex h-9 shrink-0 items-center gap-2 rounded-lg px-3.5 text-sm font-medium transition-colors",
                categoria === c
                  ? "bg-brand-deep text-white"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              {Icon && <Icon className="size-4" aria-hidden />}
              {c === "todas" ? "Todo" : CATEGORIAS[c].label}
            </button>
          );
        })}
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden
          />
          <input
            type="search"
            value={q}
            onChange={(e) => filtrar(() => setQ(e.target.value))}
            placeholder="Buscar detalle, acción, SOL-… o IP"
            aria-label="Buscar en la auditoría"
            className={cx(inputClasses, "h-10 pl-9")}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={actor}
            onChange={(e) => filtrar(() => setActor(e.target.value))}
            aria-label="Filtrar por usuario"
            className="border-input bg-card h-10 rounded-lg border px-3 text-sm"
          >
            <option value="todos">Todos los usuarios</option>
            {actores.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <label className="bg-card flex h-10 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm">
            <input
              type="checkbox"
              checked={soloErrores}
              onChange={(e) => filtrar(() => setSoloErrores(e.target.checked))}
              className="accent-primary size-4"
            />
            Solo errores
          </label>
          <button
            onClick={() => exportarCsv(filtrados)}
            disabled={filtrados.length === 0}
            className="hover:bg-secondary bg-card flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Download className="size-4" aria-hidden />
            Exportar CSV
          </button>
        </div>
      </div>

      {filtrados.length === 0 ? (
        <p className="bg-card text-muted-foreground rounded-2xl border px-6 py-14 text-center text-sm">
          No hay eventos con estos filtros.
        </p>
      ) : (
        <>
          {/* Escritorio */}
          <div className="bg-card hidden overflow-hidden rounded-2xl border md:block">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-muted-foreground text-left text-xs">
                <tr>
                  <th className="px-5 py-3 font-medium">Fecha y hora</th>
                  <th className="px-4 py-3 font-medium">Usuario</th>
                  <th className="px-4 py-3 font-medium">Acción</th>
                  <th className="px-4 py-3 font-medium">Detalle</th>
                  <th className="px-5 py-3 text-right font-medium">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {visibles.map((e) => {
                  const { icon: Icon } = CATEGORIAS[e.categoria];
                  return (
                    <tr key={e.id} className="hover:bg-secondary/30 align-top">
                      <td className="text-muted-foreground px-5 py-3 font-mono text-xs whitespace-nowrap">
                        {fechaHora(e.fecha)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="font-medium">{e.actor.nombre}</p>
                        <p className="text-muted-foreground text-xs capitalize">
                          {e.actor.rol}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cx(
                            "inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-[11px] whitespace-nowrap",
                            e.resultado === "error"
                              ? "bg-destructive/10 text-destructive"
                              : "bg-secondary text-accent-foreground",
                          )}
                        >
                          <Icon className="size-3.5" aria-hidden />
                          {e.accion}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {e.detalle}
                        {e.referencia && (
                          <span className="text-muted-foreground ml-2 font-mono text-xs">
                            {e.referencia}
                          </span>
                        )}
                      </td>
                      <td className="text-muted-foreground px-5 py-3 text-right font-mono text-xs">
                        {e.ip ?? "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Celular */}
          <ul className="space-y-3 md:hidden">
            {visibles.map((e) => {
              const { icon: Icon } = CATEGORIAS[e.categoria];
              return (
                <li key={e.id} className="bg-card rounded-xl border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={cx(
                        "inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-[11px]",
                        e.resultado === "error"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-secondary text-accent-foreground",
                      )}
                    >
                      <Icon className="size-3.5" aria-hidden />
                      {e.accion}
                    </span>
                    <span className="text-muted-foreground font-mono text-[11px]">
                      {fechaHora(e.fecha)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm">{e.detalle}</p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {e.actor.nombre}
                    {e.referencia && ` · ${e.referencia}`}
                    {e.ip && ` · ${e.ip}`}
                  </p>
                </li>
              );
            })}
          </ul>

          <Paginacion {...props} etiqueta="eventos" singular="evento" />
        </>
      )}
    </div>
  );
}
