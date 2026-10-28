import "server-only";
import { serverEnv } from "@/lib/env";
import { createTusDatosClient, type TusDatosClient } from "./client";

export * from "./client";
export type * from "./types";

let defaultClient: TusDatosClient | undefined;

/** Cliente TusDatos con la cuenta por defecto de Elogia (variables de entorno). */
export function getTusDatos(): TusDatosClient {
  if (!defaultClient) {
    const env = serverEnv();
    if (env.TUSDATOS_MODO !== "real") {
      // Protección: en modo simulado nada debe llamar a la API (ni gastar créditos)
      throw new Error(
        "TUSDATOS_MODO=simulado: no se permite llamar a la API real de TusDatos.",
      );
    }
    defaultClient = createTusDatosClient({
      baseUrl: env.TUSDATOS_BASE_URL,
      credentials: env.TUSDATOS_API_TOKEN
        ? { kind: "token", token: env.TUSDATOS_API_TOKEN }
        : {
            kind: "basic",
            email: env.TUSDATOS_EMAIL!,
            password: env.TUSDATOS_PASSWORD!,
          },
    });
  }
  return defaultClient;
}
