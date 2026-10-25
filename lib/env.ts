import "server-only";
import { z } from "zod";

/**
 * Variables de entorno del servidor, validadas en el primer uso (no al importar,
 * para que `next build` no falle en entornos sin secretos).
 * Las públicas (NEXT_PUBLIC_*) se leen directamente donde se usan.
 */
const serverEnvSchema = z
  .object({
    NEXT_PUBLIC_SUPABASE_URL: z.url(),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
    SUPABASE_SECRET_KEY: z.string().min(1),

    TUSDATOS_BASE_URL: z.url().default("https://dash-board.tusdatos.co"),
    TUSDATOS_EMAIL: z.email().optional(),
    TUSDATOS_PASSWORD: z.string().min(1).optional(),
    TUSDATOS_API_TOKEN: z.string().min(1).optional(),

    TUSDATOS_WEBHOOK_TOKEN: z.string().min(32),
    CRON_SECRET: z.string().min(32),
  })
  .refine(
    (env) =>
      env.TUSDATOS_API_TOKEN || (env.TUSDATOS_EMAIL && env.TUSDATOS_PASSWORD),
    {
      message: "Define TUSDATOS_API_TOKEN o TUSDATOS_EMAIL + TUSDATOS_PASSWORD",
    },
  );

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
