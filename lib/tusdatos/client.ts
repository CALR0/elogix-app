import "server-only";
import type {
  Country,
  DocumentType,
  JobStatusResponse,
  LaunchCarInput,
  LaunchCarResponse,
  LaunchIndividualInput,
  LaunchIndividualResponse,
  PlansResponse,
  ReportFormat,
  ReportKind,
  RetryResponse,
  SourcesStatusResponse,
  WebhookConfigInput,
} from "./types";

/**
 * ELOGIX — Cliente tipado de TusDatos (solo servidor).
 *
 * Se crea con credenciales explícitas (útil en pruebas). En la app usa
 * `getTusDatos()` de `./index`, que toma la cuenta de Elogia de las variables de entorno.
 */

export type TusDatosCredentials =
  | { kind: "token"; token: string }
  | { kind: "basic"; email: string; password: string };

export interface TusDatosClientOptions {
  baseUrl: string;
  credentials: TusDatosCredentials;
  /** Tiempo máximo por petición. Por defecto 30 s. */
  timeoutMs?: number;
}

export class TusDatosError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: unknown,
  ) {
    super(message);
    this.name = "TusDatosError";
  }

  /** 403: sin créditos o consulta bloqueada por el titular */
  get isForbidden() {
    return this.status === 403;
  }

  /** 424: el batch aún no ha terminado */
  get isNotReady() {
    return this.status === 424;
  }

  get isRetryable() {
    return this.status === 429 || this.status >= 500;
  }
}

const REPORT_PATHS: Record<ReportKind, Record<ReportFormat, string>> = {
  persona: { html: "/api/v2/report", pdf: "/api/v2/report_pdf" },
  nit: { html: "/api/v2/report_nit", pdf: "/api/v2/report_nit_pdf" },
  vehiculo: { html: "/api/v2/report_car", pdf: "/api/v2/report_car_pdf" },
};

export function createTusDatosClient({
  baseUrl,
  credentials,
  timeoutMs = 30_000,
}: TusDatosClientOptions) {
  const authorization =
    credentials.kind === "token"
      ? `Bearer ${credentials.token}`
      : `Basic ${Buffer.from(`${credentials.email}:${credentials.password}`).toString("base64")}`;

  async function request(
    path: string,
    init: RequestInit = {},
  ): Promise<Response> {
    const res = await fetch(`${baseUrl}${path}`, {
      ...init,
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        Authorization: authorization,
        ...init.headers,
      },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      const detail =
        (body &&
          typeof body === "object" &&
          ("error" in body
            ? body.error
            : "detail" in body
              ? body.detail
              : null)) ||
        res.statusText;
      throw new TusDatosError(
        `TusDatos ${res.status} en ${path}: ${JSON.stringify(detail)}`,
        res.status,
        body,
      );
    }
    return res;
  }

  async function json<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await request(path, init);
    return (await res.json()) as T;
  }

  const enc = encodeURIComponent;

  return {
    /** POST /api/launch — lanza una consulta individual. Devuelve un jobid (vigencia 2 h). */
    launchIndividual(input: LaunchIndividualInput) {
      return json<LaunchIndividualResponse>("/api/launch", {
        method: "POST",
        body: JSON.stringify(input),
      });
    },

    /** POST /api/launch/car — consulta de vehículo + propietario */
    launchVehicle(input: LaunchCarInput) {
      return json<LaunchCarResponse>("/api/launch/car", {
        method: "POST",
        body: JSON.stringify(input),
      });
    },

    /** GET /api/results/{jobkey} — estado de una consulta en curso */
    getJobStatus(jobid: string) {
      return json<JobStatusResponse>(`/api/results/${enc(jobid)}`);
    },

    /** GET /api/retry/{id} (o /api/retry_nit/{id}) — relanza fuentes con error; devuelve un nuevo jobid */
    retry(reportId: string, typedoc: DocumentType) {
      const base = typedoc === "NIT" ? "/api/retry_nit" : "/api/retry";
      return json<RetryResponse>(
        `${base}/${enc(reportId)}?typedoc=${enc(typedoc)}`,
      );
    },

    /** GET /api/report_json/{id} — reporte completo estructurado */
    getReportJson(reportId: string) {
      return json<Record<string, unknown>>(`/api/report_json/${enc(reportId)}`);
    },

    /**
     * Descarga el reporte HTML o PDF. Los endpoints exigen las credenciales de
     * TusDatos, así que NUNCA se enlazan desde el navegador: un Route Handler
     * de ELOGIX verifica que el usuario sea admin y reenvía este Response.
     */
    fetchReport(reportId: string, kind: ReportKind, format: ReportFormat) {
      return request(`${REPORT_PATHS[kind][format]}/${enc(reportId)}`, {
        headers: { Accept: format === "pdf" ? "application/pdf" : "text/html" },
      });
    },

    /** GET /api/plans — créditos restantes */
    getPlans() {
      return json<PlansResponse>("/api/plans");
    },

    /** GET /api/v1/sources/status — estado operativo de las fuentes */
    getSourcesStatus(country?: Country) {
      return json<SourcesStatusResponse>(
        `/api/v1/sources/status${country ? `?country=${country}` : ""}`,
      );
    },

    /** GET /api/v1/webhook/info */
    getWebhookConfig() {
      return json<Record<string, unknown>>("/api/v1/webhook/info");
    },

    /** POST /api/v1/webhook/create o PUT /api/v1/webhook/update */
    saveWebhookConfig(config: WebhookConfigInput, mode: "create" | "update") {
      return json<Record<string, unknown>>(`/api/v1/webhook/${mode}`, {
        method: mode === "create" ? "POST" : "PUT",
        body: JSON.stringify(config),
      });
    },
  };
}

export type TusDatosClient = ReturnType<typeof createTusDatosClient>;
