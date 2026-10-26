"use client";

import { useState, useTransition } from "react";
import { CircleAlert, Container, LoaderCircle, Send } from "lucide-react";
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
  TIPOS_DOC_PROPIETARIO,
  TIPOS_DOC_REMOLQUE,
  consultaVehiculoSchema,
  erroresPorCampo,
  type TipoDocPropietario,
  type TipoDocRemolque,
} from "@/lib/solicitudes/schemas";
import { cx, referencia } from "@/lib/utils";

type Envio =
  | { estado: "formulario" }
  | { estado: "exito"; numero: number }
  | { estado: "error"; mensaje: string };

const VACIO = {
  placa: "",
  tipoPropietario: "CC" as TipoDocPropietario,
  documentoPropietario: "",
  incluirRemolque: false,
  placaRemolque: "",
  remolqueMismoPropietario: false,
  tipoPropietarioRemolque: "CC" as TipoDocRemolque,
  documentoPropietarioRemolque: "",
  autorizacion: false,
};

/** Campo de placa con aspecto de placa colombiana (amarilla, letras negras). */
function PlacaInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  ayuda,
  error,
  pequena,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  ayuda: string;
  error?: string;
  pequena?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div
        className={cx(
          "mx-auto mt-2 w-full rounded-xl border-[3px] border-[#1c1c1c] bg-[#f6c624] px-3 pt-2 pb-1.5 shadow-[inset_0_0_0_2px_#f6c624,inset_0_0_0_4px_#1c1c1c]",
          pequena ? "max-w-60" : "max-w-72",
          error && "ring-destructive ring-2 ring-offset-2",
        )}
      >
        <input
          id={id}
          value={value}
          onChange={(e) =>
            onChange(
              e.target.value
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, "")
                .slice(0, 6),
            )
          }
          placeholder={placeholder}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          aria-invalid={Boolean(error)}
          className={cx(
            "w-full bg-transparent text-center font-mono font-bold tracking-[0.18em] text-[#1c1c1c] outline-none placeholder:text-[#1c1c1c]/25",
            pequena ? "text-3xl" : "text-4xl",
          )}
        />
        <p className="text-center text-[10px] font-semibold tracking-[0.35em] text-[#1c1c1c]/70">
          COLOMBIA
        </p>
      </div>
      {error ? (
        <p className="text-destructive mt-2 flex items-center justify-center gap-1.5 text-xs">
          <CircleAlert className="size-3.5" aria-hidden />
          {error}
        </p>
      ) : (
        <p className="text-muted-foreground mt-2 text-center text-xs">
          {ayuda}
        </p>
      )}
    </div>
  );
}

export function FormularioVehiculo() {
  const [datos, setDatos] = useState(VACIO);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [envio, setEnvio] = useState<Envio>({ estado: "formulario" });
  const [enviando, startTransition] = useTransition();

  function set<K extends keyof typeof VACIO>(
    campo: K,
    valor: (typeof VACIO)[K],
  ) {
    setDatos((d) => ({ ...d, [campo]: valor }));
    setErrores((e) => ({ ...e, [campo]: "" }));
  }

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    const parsed = consultaVehiculoSchema.safeParse(datos);
    if (!parsed.success) {
      setErrores(erroresPorCampo(parsed.error));
      return;
    }
    startTransition(async () => {
      const r = await simularEnvio(datos.documentoPropietario);
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

  const pideDocRemolque =
    datos.incluirRemolque && !datos.remolqueMismoPropietario;

  return (
    <form
      onSubmit={enviar}
      noValidate
      className="bg-card space-y-7 rounded-2xl border p-5 sm:p-8"
    >
      <PlacaInput
        id="placa"
        label={
          datos.incluirRemolque ? "Placa del cabezote" : "Placa del vehículo"
        }
        value={datos.placa}
        onChange={(v) => set("placa", v)}
        placeholder="ABC123"
        ayuda="Carro o cabezote: ABC123 · Moto: ABC12D"
        error={errores.placa}
      />

      <div className="space-y-5 border-t pt-6">
        <h2 className="text-sm font-semibold">
          Propietario {datos.incluirRemolque ? "del cabezote" : "del vehículo"}
        </h2>
        <OpcionesPastilla
          name="tipoPropietario"
          etiqueta="Tipo de documento"
          opciones={TIPOS_DOC_PROPIETARIO}
          valor={datos.tipoPropietario}
          onChange={(v) => set("tipoPropietario", v)}
        />
        <div className="sm:max-w-sm">
          <Field
            id="documentoPropietario"
            label="Número de documento"
            hint="Sin puntos ni espacios."
            error={errores.documentoPropietario}
          >
            <Input
              id="documentoPropietario"
              inputMode="numeric"
              autoComplete="off"
              value={datos.documentoPropietario}
              onChange={(e) =>
                set("documentoPropietario", e.target.value.replace(/\s/g, ""))
              }
              aria-invalid={Boolean(errores.documentoPropietario)}
              className="tabular-nums"
            />
          </Field>
        </div>
      </div>

      {/* Remolque / tráiler: placa y propietario propios */}
      <div
        className={cx(
          "rounded-xl border transition-colors",
          datos.incluirRemolque && "border-primary/40 bg-secondary/30",
        )}
      >
        <label className="flex cursor-pointer items-center gap-4 p-4">
          <span className="bg-brand-deep flex size-10 shrink-0 items-center justify-center rounded-lg text-white">
            <Container className="size-5" aria-hidden />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-medium">
              Lleva remolque o tráiler
            </span>
            <span className="text-muted-foreground block text-xs">
              El remolque tiene su propia placa y puede tener otro propietario.
            </span>
          </span>
          <input
            type="checkbox"
            checked={datos.incluirRemolque}
            onChange={(e) => set("incluirRemolque", e.target.checked)}
            className="accent-primary size-5 shrink-0"
          />
        </label>

        {datos.incluirRemolque && (
          <div className="space-y-6 border-t px-4 pt-5 pb-5 sm:px-6">
            <PlacaInput
              id="placaRemolque"
              label="Placa del remolque"
              value={datos.placaRemolque}
              onChange={(v) => set("placaRemolque", v)}
              placeholder="R12345"
              ayuda="Remolque: R12345 · Semirremolque: S12345"
              error={errores.placaRemolque}
              pequena
            />

            <label className="flex cursor-pointer items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={datos.remolqueMismoPropietario}
                onChange={(e) =>
                  set("remolqueMismoPropietario", e.target.checked)
                }
                className="accent-primary size-4"
              />
              El remolque es del mismo propietario del cabezote
            </label>

            {pideDocRemolque && (
              <div className="space-y-5">
                <h3 className="text-sm font-semibold">
                  Propietario del remolque
                </h3>
                <OpcionesPastilla
                  name="tipoPropietarioRemolque"
                  etiqueta="Tipo de documento"
                  opciones={TIPOS_DOC_REMOLQUE}
                  valor={datos.tipoPropietarioRemolque}
                  onChange={(v) => set("tipoPropietarioRemolque", v)}
                />
                <div className="sm:max-w-sm">
                  <Field
                    id="documentoPropietarioRemolque"
                    label="Número de documento"
                    hint="Sin puntos ni espacios."
                    error={errores.documentoPropietarioRemolque}
                  >
                    <Input
                      id="documentoPropietarioRemolque"
                      inputMode={
                        datos.tipoPropietarioRemolque === "PP"
                          ? "text"
                          : "numeric"
                      }
                      autoComplete="off"
                      value={datos.documentoPropietarioRemolque}
                      onChange={(e) =>
                        set(
                          "documentoPropietarioRemolque",
                          e.target.value.replace(/\s/g, ""),
                        )
                      }
                      aria-invalid={Boolean(
                        errores.documentoPropietarioRemolque,
                      )}
                      className="tabular-nums"
                    />
                  </Field>
                </div>
              </div>
            )}

            <p className="text-muted-foreground text-xs">
              Se hace una consulta combinada: cabezote, remolque y cada
              propietario consumen créditos por separado.
            </p>
          </div>
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
