import { z } from "zod";

/**
 * Validación de los dos módulos del usuario (contexto §14.5). Se usa en el
 * formulario (mensajes inmediatos) y se reutilizará en la Server Function
 * antes de enviar a TusDatos.
 */

export const TIPOS_DOCUMENTO = [
  { valor: "CC", corto: "CC", largo: "Cédula de ciudadanía" },
  { valor: "CE", corto: "CE", largo: "Cédula de extranjería" },
  { valor: "PPT", corto: "PPT", largo: "Permiso por protección temporal" },
  { valor: "PP", corto: "Pasaporte", largo: "Pasaporte" },
  { valor: "NIT", corto: "NIT", largo: "NIT de empresa" },
] as const;

export const TIPOS_DOC_PROPIETARIO = [
  { valor: "CC", corto: "CC", largo: "Cédula de ciudadanía" },
  { valor: "CE", corto: "CE", largo: "Cédula de extranjería" },
  { valor: "NIT", corto: "NIT", largo: "NIT de empresa" },
  { valor: "TI", corto: "TI", largo: "Tarjeta de identidad" },
] as const;

export type TipoDocumento = (typeof TIPOS_DOCUMENTO)[number]["valor"];
export type TipoDocPropietario =
  (typeof TIPOS_DOC_PROPIETARIO)[number]["valor"];

const soloDigitos = z
  .string()
  .trim()
  .regex(
    /^\d{5,12}$/,
    "Escribe solo números, sin puntos ni espacios (5 a 12 dígitos).",
  );

const autorizacion = z.literal(true, {
  error: "Debes confirmar la autorización del titular.",
});

const fechaExpedicion = z.iso
  .date({ error: "Indica la fecha de expedición." })
  .refine((f) => new Date(f) <= new Date(), "La fecha no puede ser futura.");

export const consultaDocumentoSchema = z.discriminatedUnion("tipo", [
  z.object({ tipo: z.literal("CC"), documento: soloDigitos, autorizacion }),
  z.object({ tipo: z.literal("NIT"), documento: soloDigitos, autorizacion }),
  z.object({
    tipo: z.literal("CE"),
    documento: soloDigitos,
    fechaExpedicion,
    autorizacion,
  }),
  z.object({
    tipo: z.literal("PPT"),
    documento: soloDigitos,
    fechaExpedicion,
    autorizacion,
  }),
  z.object({
    tipo: z.literal("PP"),
    documento: z
      .string()
      .trim()
      .regex(
        /^[A-Za-z0-9]{5,15}$/,
        "Solo letras y números (5 a 15 caracteres).",
      ),
    nombre: z
      .string()
      .trim()
      .min(5, "Escribe el nombre completo (mínimo 5 letras)."),
    autorizacion,
  }),
]);

/** Placas colombianas: carro ABC123, moto ABC12D. */
export const PLACA_REGEX = /^[A-Z]{3}\d{3}$|^[A-Z]{3}\d{2}[A-Z]$/;

/** Remolque (R) o semirremolque (S) + 5 dígitos: R41130, S12345. */
export const PLACA_REMOLQUE_REGEX = /^[RS]\d{5}$/;

/** Tipos admitidos para el propietario del remolque (ComboTrailerEntity). */
export const TIPOS_DOC_REMOLQUE = [
  { valor: "CC", corto: "CC", largo: "Cédula de ciudadanía" },
  { valor: "CE", corto: "CE", largo: "Cédula de extranjería" },
  { valor: "NIT", corto: "NIT", largo: "NIT de empresa" },
  { valor: "PPT", corto: "PPT", largo: "Permiso por protección temporal" },
  { valor: "PP", corto: "Pasaporte", largo: "Pasaporte" },
] as const;

export type TipoDocRemolque = (typeof TIPOS_DOC_REMOLQUE)[number]["valor"];

/**
 * Vehículo: cabezote/vehículo + propietario y, opcionalmente, su remolque con
 * su propio propietario (puede ser otra persona o empresa). Con remolque se
 * usa la consulta combinada de TusDatos (contexto §14.6).
 */
export const consultaVehiculoSchema = z
  .object({
    placa: z
      .string()
      .trim()
      .toUpperCase()
      .regex(
        PLACA_REGEX,
        "Placa inválida. Formato ABC123 (carro) o ABC12D (moto).",
      ),
    tipoPropietario: z.enum(["CC", "CE", "NIT", "TI"]),
    documentoPropietario: soloDigitos,
    incluirRemolque: z.boolean(),
    placaRemolque: z.string().trim().toUpperCase(),
    remolqueMismoPropietario: z.boolean(),
    tipoPropietarioRemolque: z.enum(["CC", "CE", "NIT", "PPT", "PP"]),
    documentoPropietarioRemolque: z.string().trim(),
    autorizacion,
  })
  .superRefine((d, ctx) => {
    if (!d.incluirRemolque) return;
    if (!PLACA_REMOLQUE_REGEX.test(d.placaRemolque)) {
      ctx.addIssue({
        code: "custom",
        path: ["placaRemolque"],
        message: "Placa de remolque inválida. Formato R12345 o S12345.",
      });
    }
    if (d.remolqueMismoPropietario) return;
    const doc = d.documentoPropietarioRemolque;
    const valido =
      d.tipoPropietarioRemolque === "PP"
        ? /^[A-Za-z0-9]{5,15}$/.test(doc)
        : /^\d{5,12}$/.test(doc);
    if (!valido) {
      ctx.addIssue({
        code: "custom",
        path: ["documentoPropietarioRemolque"],
        message:
          d.tipoPropietarioRemolque === "PP"
            ? "Solo letras y números (5 a 15 caracteres)."
            : "Escribe solo números, sin puntos ni espacios (5 a 12 dígitos).",
      });
    }
  });

export type ConsultaDocumento = z.infer<typeof consultaDocumentoSchema>;
export type ConsultaVehiculo = z.infer<typeof consultaVehiculoSchema>;

/** Convierte los issues de Zod en { campo: mensaje } para el formulario. */
export function erroresPorCampo(error: z.ZodError) {
  const errores: Record<string, string> = {};
  for (const issue of error.issues) {
    const campo = String(issue.path[0] ?? "form");
    errores[campo] ??= issue.message;
  }
  return errores;
}
