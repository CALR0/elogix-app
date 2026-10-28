import "server-only";
import { z } from "zod";

/**
 * Variables de entorno del servidor, validadas en el primer uso (no al importar,
 * para que `next build` no falle en entornos sin secretos).
 * Las públicas (NEXT_PUBLIC_*) se leen directamente donde se usan.
 */
/** En .env.local una variable vacía ("X=") llega como "": se trata como no definida. */
const opcional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((v) => (v === "" ? undefined : v), schema.optional());

const serverEnvSchema = z
  .object({
    NEXT_PUBLIC_SUPABASE_URL: z.url(),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
    SUPABASE_SECRET_KEY: z.string().min(1),

    /**
     * "simulado" (por defecto): las consultas NO salen a TusDatos ni gastan
     * créditos; el sistema genera resultados de prueba y marca la solicitud
     * con `simulada = true`. "real": usa la API con las credenciales.
     */
    TUSDATOS_MODO: z.enum(["simulado", "real"]).default("simulado"),
    TUSDATOS_BASE_URL: z.url().default("https://dash-board.tusdatos.co"),
    TUSDATOS_EMAIL: opcional(z.email()),
    TUSDATOS_PASSWORD: opcional(z.string().min(1)),
    TUSDATOS_API_TOKEN: opcional(z.string().min(1)),

    TUSDATOS_WEBHOOK_TOKEN: opcional(z.string().min(32)),
    CRON_SECRET: opcional(z.string().min(32)),
  })
  .superRefine((env, ctx) => {
    if (env.TUSDATOS_MODO !== "real") return;
    if (
      !env.TUSDATOS_API_TOKEN &&
      !(env.TUSDATOS_EMAIL && env.TUSDATOS_PASSWORD)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["TUSDATOS_API_TOKEN"],
        message:
          "Modo real: define TUSDATOS_API_TOKEN o TUSDATOS_EMAIL + TUSDATOS_PASSWORD",
      });
    }
    for (const clave of ["TUSDATOS_WEBHOOK_TOKEN", "CRON_SECRET"] as const) {
      if (!env[clave]) {
        ctx.addIssue({
          code: "custom",
          path: [clave],
          message: "Obligatoria en modo real (mínimo 32 caracteres).",
        });
      }
    }
  });

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | undefined;

export function serverEnv(): ServerEnv {
  if (!cached) {
    const parsed = serverEnvSchema.safeParse(process.env);
    if (!parsed.success) {
      throw new Error(
        `Variables de entorno inválidas:\n${z.prettifyError(parsed.error)}`,
      );
    }
    cached = parsed.data;
  }
  return cached;
}
