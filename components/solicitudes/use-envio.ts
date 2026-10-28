"use client";

import { useState, useTransition } from "react";
import {
  reintentarEnvio,
  type ResultadoEnvio,
} from "@/app/(usuario)/solicitudes/acciones";

export type Envio =
  | { estado: "formulario" }
  | { estado: "exito"; numero: number }
  | { estado: "error"; mensaje: string; solicitudId?: string };

/**
 * Estado del envío de una consulta (compartido por los dos formularios).
 * Si el envío falla después de registrar la solicitud, "Intentar de nuevo"
 * reintenta ESA solicitud en lugar de crear otra.
 */
export function useEnvioSolicitud() {
  const [envio, setEnvio] = useState<Envio>({ estado: "formulario" });
  const [enviando, startTransition] = useTransition();

  function aplicar(
    r: ResultadoEnvio,
    onErrores?: (e: Record<string, string>) => void,
  ) {
    if (r.ok) {
      setEnvio({ estado: "exito", numero: r.numero });
    } else if (r.errores && onErrores) {
      onErrores(r.errores);
    } else {
      setEnvio({
        estado: "error",
        mensaje: r.mensaje,
        solicitudId: r.solicitudId,
      });
    }
  }

  function enviar(
    accion: () => Promise<ResultadoEnvio>,
    onErrores: (e: Record<string, string>) => void,
  ) {
    startTransition(async () => {
      try {
        aplicar(await accion(), onErrores);
      } catch {
        setEnvio({
          estado: "error",
          mensaje:
            "No hubo conexión con el servidor. Revisa tu internet e intenta de nuevo.",
        });
      }
    });
  }

  function reintentar() {
    if (envio.estado !== "error" || !envio.solicitudId) {
      setEnvio({ estado: "formulario" });
      return;
    }
    const id = envio.solicitudId;
    startTransition(async () => {
      try {
        aplicar(await reintentarEnvio(id));
      } catch {
        setEnvio({
          estado: "error",
          mensaje: "No hubo conexión con el servidor.",
          solicitudId: id,
        });
      }
    });
  }

  return {
    envio,
    enviando,
    enviar,
    reintentar,
    reiniciar: () => setEnvio({ estado: "formulario" }),
  };
}
