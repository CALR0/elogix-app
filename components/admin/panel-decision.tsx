"use client";

import { useState, useTransition } from "react";
import {
  CircleCheck,
  CircleX,
  LoaderCircle,
  RefreshCcw,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { EstadoEstudio } from "@/lib/estudios/mock";
import { cx } from "@/lib/utils";

const espera = () => new Promise((r) => setTimeout(r, 700));

/**
 * Decisión del admin: aprobar o rechazar (rechazar pide confirmación y
 * comentario). MAQUETA: el cambio es local. En la Fase 3 actualiza
 * `solicitud_resultados.revision_estado` (el trigger registra quién y cuándo),
 * guarda el PDF en Storage y deja registro en `audit_logs`.
 */
export function PanelDecision({
  estadoInicial,
  comentarioInicial,
}: {
  estadoInicial: EstadoEstudio;
  comentarioInicial?: string;
}) {
  const [estado, setEstado] = useState(estadoInicial);
  const [comentario, setComentario] = useState(comentarioInicial ?? "");
  const [confirmarRechazo, setConfirmarRechazo] = useState(false);
  const [pendiente, startTransition] = useTransition();

  const decidido = estado === "aprobado" || estado === "rechazado";
  const bloqueado = estado === "procesando" || estado === "error_envio";

  function decidir(nuevo: "aprobado" | "rechazado") {
    startTransition(async () => {
      await espera();
      setEstado(nuevo);
      setConfirmarRechazo(false);
    });
  }

  if (decidido) {
    const aprobado = estado === "aprobado";
    return (
      <div
        className={cx(
          "rounded-2xl border p-5",
          aprobado
            ? "bg-primary/8 border-primary/25"
            : "bg-destructive/6 border-destructive/25",
        )}
      >
        <div
          className={cx(
            "flex items-center gap-2 font-semibold",
            aprobado ? "text-primary" : "text-destructive",
          )}
        >
          {aprobado ? (
            <CircleCheck className="size-5" aria-hidden />
          ) : (
            <CircleX className="size-5" aria-hidden />
          )}
          Estudio {aprobado ? "aprobado" : "rechazado"}
        </div>
        {comentario && (
          <p className="text-muted-foreground mt-2 text-sm">“{comentario}”</p>
        )}
        <button
          onClick={() => setEstado("por_revisar")}
          className="text-muted-foreground hover:text-foreground mt-4 inline-flex items-center gap-1.5 text-xs font-medium"
        >
          <Undo2 className="size-3.5" aria-hidden />
          Cambiar decisión
        </button>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border p-5">
      <h2 className="font-semibold">Decisión</h2>
      {bloqueado ? (
        <p className="text-muted-foreground mt-2 text-sm">
          {estado === "procesando"
            ? "La consulta aún está en proceso. Podrás decidir cuando termine."
            : "La solicitud no se envió a TusDatos. El usuario fue avisado para reintentar."}
        </p>
      ) : (
        <>
          {estado === "fuentes_error" && (
            <p className="mt-2 rounded-lg bg-[#d9822b]/10 px-3 py-2 text-xs text-[#9a5512] dark:text-[#f2b67a]">
              Hay fuentes con error: puedes decidir igual o esperar el
              reintento.
            </p>
          )}
          <label
            htmlFor="comentario"
            className="mt-4 block text-sm font-medium"
          >
            Comentario{" "}
            <span className="text-muted-foreground font-normal">
              {confirmarRechazo ? "(obligatorio al rechazar)" : "(opcional)"}
            </span>
          </label>
          <textarea
            id="comentario"
            rows={3}
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="Motivo de la decisión…"
            className="border-input bg-card focus-visible:border-primary mt-1.5 w-full resize-none rounded-lg border px-3 py-2 text-sm outline-none"
          />

          {confirmarRechazo ? (
            <div className="border-destructive/30 bg-destructive/5 mt-4 rounded-xl border p-3">
              <p className="text-sm font-medium">¿Rechazar este estudio?</p>
              <div className="mt-3 flex gap-2">
                <Button
                  variante="secundario"
                  className="flex-1"
                  onClick={() => setConfirmarRechazo(false)}
                >
                  Cancelar
                </Button>
                <button
                  disabled={!comentario.trim() || pendiente}
                  onClick={() => decidir("rechazado")}
                  className="bg-destructive text-destructive-foreground inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {pendiente && (
                    <LoaderCircle className="size-4 animate-spin" aria-hidden />
                  )}
                  Rechazar
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button
                variante="secundario"
                tamano="lg"
                onClick={() => setConfirmarRechazo(true)}
                className="hover:border-destructive/40 hover:text-destructive"
              >
                <CircleX className="size-4" aria-hidden />
                Rechazar
              </Button>
              <Button
                tamano="lg"
                disabled={pendiente}
                onClick={() => decidir("aprobado")}
              >
                {pendiente ? (
                  <LoaderCircle className="size-4 animate-spin" aria-hidden />
                ) : (
                  <CircleCheck className="size-4" aria-hidden />
                )}
                Aprobar
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** Reintento manual de fuentes con error (gratis en TusDatos: `GET /api/retry/{id}`). */
export function BotonReintentar({ reintentos }: { reintentos: number }) {
  const [estado, setEstado] = useState<"idle" | "enviando" | "enviado">("idle");
  return (
    <button
      disabled={estado !== "idle"}
      onClick={async () => {
        setEstado("enviando");
        await espera();
        setEstado("enviado");
      }}
      className="inline-flex h-9 items-center gap-2 rounded-lg border border-current/25 px-3 text-sm font-medium transition-colors hover:bg-current/5 disabled:opacity-70"
    >
      {estado === "enviando" ? (
        <LoaderCircle className="size-4 animate-spin" aria-hidden />
      ) : (
        <RefreshCcw className="size-4" aria-hidden />
      )}
      {estado === "enviado"
        ? "Reintento enviado"
        : `Reintentar ahora${reintentos ? ` (${reintentos}/3 automáticos)` : ""}`}
    </button>
  );
}
