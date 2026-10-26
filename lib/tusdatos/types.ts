/**
 * Tipos de la API de TusDatos (ver docs/openapi.json).
 * Solo se incluyen los esquemas que ELOGIX consume.
 */

export type DocumentType =
  "CC" | "CE" | "NIT" | "PP" | "PPT" | "INT" | "NOMBRE" | "CI" | "RUC";

export type VehicleOwnerDocType = "CC" | "CE" | "NIT" | "TI";

export type Country = "CO" | "EC";

/** Hallazgo de mayor categoría. Cadena vacía = sin hallazgo. */
export type HallazgoNivel = "alto" | "medio" | "bajo" | "info" | "";

export type EstadoConsulta = "procesando" | "finalizado" | "error";

export type WebhookFunction =
  | "batch"
  | "individualRetry"
  | "batchQueryRetry"
  | "listAndPepsMonitoring"
  | "individualCompleted"
  | "reportApprovalChanged";

// ─── Requests ────────────────────────────────────────────────────────────────

/** POST /api/launch — LaunchIn */
export interface LaunchIndividualInput {
  typedoc: DocumentType;
  doc?: string | number;
  /** Nombre para PP e INT (mín. 5 caracteres) */
  name?: string;
  /** Nombre para búsquedas typedoc=NOMBRE (mín. 5 caracteres) */
  nombre?: string;
  /** dd/mm/yyyy — obligatorio para CE y PPT */
  fechaE?: string;
  force?: boolean;
  resolve_name?: boolean;
  /** Máx. 250 caracteres. ELOGIX envía el id de la solicitud para correlacionar el webhook. */
  webhook_reference?: string;
}

/** POST /api/launch/car — LaunchCarIn */
export interface LaunchCarInput {
  doc: number;
  tdoc: VehicleOwnerDocType;
  /** Exactamente 6 caracteres */
  placa: string;
}

/** POST /api/v1/webhook/create | PUT /api/v1/webhook/update — WebhookConfigPydantic */
export type WebhookConfigInput = {
  webhook_url: string;
  enabled_functions: WebhookFunction[];
} & (
  | { auth_type: "NoAuth"; auth_details: Record<string, never> }
  | {
      auth_type: "BasicAuth";
      auth_details: { username: string; password: string };
    }
  | { auth_type: "BearerAuth"; auth_details: { token: string } }
);

// ─── Responses ───────────────────────────────────────────────────────────────

/** LaunchOut */
export interface LaunchIndividualResponse {
  email: string;
  doc?: number;
  /** UUID — vigencia 2 horas */
  jobid: string;
  nombre?: string;
  typedoc: string;
  validado?: boolean;
}

/** LaunchCarOut */
export interface LaunchCarResponse {
  jobid: string;
  placa: string;
  typedoc: string;
}

/** JobStatus — GET /api/results/{jobkey} */
export interface JobStatusResponse {
  cedula?: number;
  error: boolean;
  errores?: string[];
  estado: EstadoConsulta;
  hallazgo: boolean;
  hallazgos: HallazgoNivel;
  /** Id del reporte: se usa para /api/v2/report*, /api/report_json y /api/retry */
  id: string;
  nombre?: string;
  /** true = hallazgo en la fuente, false = sin hallazgo, "Error" = la fuente falló */
  results?: Record<string, boolean | "Error">;
  time?: number;
  typedoc?: string;
  validado?: boolean;
}

/** RetryOut — el reintento devuelve un nuevo jobid para hacer polling */
export interface RetryResponse {
  doc?: number;
  jobid: string;
}

/** PlansOut */
export interface PlansResponse {
  /** Créditos restantes */
  amount: number;
  /** Créditos comprados */
  purchase_amount: number;
  purchase_date: string;
  user: string;
}

export interface SourceStatusItem {
  name: string;
  status: "operational" | "maintenance" | "down";
  country?: string;
}

export interface SourcesStatusResponse {
  summary: {
    total: number;
    operational: number;
    maintenance: number;
    down: number;
  };
  sources: SourceStatusItem[];
  message: string;
  code: string;
  status: number;
}

// ─── Webhooks entrantes ──────────────────────────────────────────────────────

/** IndividualCompletedWebhookIn */
export interface IndividualCompletedEvent {
  event_name: "individualCompleted";
  /** Email de la cuenta TusDatos que lanzó la consulta */
  user: string;
  reportId: string;
  finished_at: string;
  webhook_reference?: string;
}

export type ReportKind = "persona" | "nit" | "vehiculo";
export type ReportFormat = "html" | "pdf";

/** Resultado de descargar un reporte: el PDF puede estar aún en generación (HTTP 202). */
export type ReportResult =
  | { status: "ready"; response: Response }
  | { status: "processing"; retryAfterSeconds: number };
