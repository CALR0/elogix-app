"use client";

import { useState, useTransition } from "react";
import { LoaderCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Autorizacion,
  Field,
  Input,
  OpcionesPastilla,
} from "@/components/ui/field";
import {
  EnvioError,
  EnvioExitoso,
  simularEnvio,
} from "@/components/solicitudes/resultado-envio";
import {
  TIPOS_DOCUMENTO,
  consultaDocumentoSchema,
  erroresPorCampo,
  type TipoDocumento,
} from "@/lib/solicitudes/schemas";
import { referencia } from "@/lib/utils";

type Envio =
  | { estado: "formulario" }
  | { estado: "exito"; numero: number }
  | { estado: "error"; mensaje: string };

const VACIO = {
  tipo: "CC" as TipoDocumento,
  documento: "",
  fechaExpedicion: "",
  nombre: "",
  autorizacion: false,
};

export function FormularioDocumento() {
  const [datos, setDatos] = useState(VACIO);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [envio, setEnvio] = useState<Envio>({ estado: "formulario" });
  const [enviando, startTransition] = useTransition();

  const pideFecha = datos.tipo === "CE" || datos.tipo === "PPT";
  const pideNombre = datos.tipo === "PP";

  function set<K extends keyof typeof VACIO>(
    campo: K,
    valor: (typeof VACIO)[K],
  ) {
    setDatos((d) => ({ ...d, [campo]: valor }));
    setErrores((e) => ({ ...e, [campo]: "" }));
  }

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    const parsed = consultaDocumentoSchema.safeParse(datos);
    if (!parsed.success) {
      setErrores(erroresPorCampo(parsed.error));
      return;
    }
    startTransition(async () => {
      const r = await simularEnvio(datos.documento);
      setEnvio(
        r.ok
          ? { estado: "exito", numero: r.numero }
          : { estado: "error", mensaje: r.mensaje },
      );
    });
  }

  if (envio.estado === "exito") {
    return (
      <EnvioExitoso
        referencia={referencia(envio.numero)}
        onNueva={() => {
          setDatos(VACIO);
          setEnvio({ estado: "formulario" });
        }}
      />
    );
  }
  if (envio.estado === "error") {
    return (
      <EnvioError
        mensaje={envio.mensaje}
        onReintentar={() => setEnvio({ estado: "formulario" })}
      />
    );
  }

  return (
    <form
      onSubmit={enviar}
      noValidate
      className="bg-card space-y-6 rounded-2xl border p-5 sm:p-8"
    >
      <OpcionesPastilla
        name="tipo"
        etiqueta="Tipo de documento"
        opciones={TIPOS_DOCUMENTO}
        valor={datos.tipo}
        onChange={(v) => set("tipo", v)}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          id="documento"
          label={datos.tipo === "NIT" ? "Número de NIT" : "Número de documento"}
          hint={
            datos.tipo === "NIT"
              ? "Sin dígito de verificación."
              : "Sin puntos ni espacios."
          }
          error={errores.documento}
        >
          <Input
            id="documento"
            inputMode={pideNombre ? "text" : "numeric"}
            autoComplete="off"
            value={datos.documento}
            onChange={(e) =>
              set("documento", e.target.value.replace(/\s/g, ""))
            }
            aria-invalid={Boolean(errores.documento)}
            aria-describedby={errores.documento ? "documento-error" : undefined}
            className="tabular-nums"
          />
        </Field>

        {pideFecha && (
          <Field
            id="fechaExpedicion"
            label="Fecha de expedición"
            hint="Obligatoria para CE y PPT."
            error={errores.fechaExpedicion}
          >
            <Input
              id="fechaExpedicion"
              type="date"
              value={datos.fechaExpedicion}
              onChange={(e) => set("fechaExpedicion", e.target.value)}
              aria-invalid={Boolean(errores.fechaExpedicion)}
            />
          </Field>
        )}

        {pideNombre && (
          <Field
            id="nombre"
            label="Nombre completo"
            hint="Como aparece en el pasaporte."
            error={errores.nombre}
          >
            <Input
              id="nombre"
              autoComplete="off"
              value={datos.nombre}
              onChange={(e) => set("nombre", e.target.value)}
              aria-invalid={Boolean(errores.nombre)}
            />
          </Field>
        )}
      </div>

      <Autorizacion
        checked={datos.autorizacion}
        onChange={(v) => set("autorizacion", v)}
        error={errores.autorizacion}
      />

      <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-xs">
          La consulta se envía de inmediato. Tarda alrededor de un minuto.
        </p>
        <Button
          type="submit"
          tamano="lg"
          disabled={enviando}
          className="sm:min-w-44"
        >
          {enviando ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden />
          ) : (
            <Send className="size-4" aria-hidden />
          )}
          {enviando ? "Enviando…" : "Enviar consulta"}
        </Button>
      </div>
    </form>
  );
}
