import {
  CircleAlert,
  CircleCheck,
  CircleX,
  Clock3,
  FileSearch,
  LoaderCircle,
  MessageSquareText,
} from "lucide-react";
import type { Decision, EstadoUsuario } from "@/lib/solicitudes/estados";
import { cx } from "@/lib/utils";

/**
 * Etapa que ve el USUARIO: Enviada → En proceso → En revisión → Aprobada /
 * Rechazada (o No enviada). Combina el estado del proceso con la decisión del
 * admin; nunca muestra hallazgos.
 */
export type Etapa =
  "enviada" | "procesando" | "revision" | "aprobada" | "rechazada" | "error";

export function etapaDe(estado: EstadoUsuario, decision: Decision): Etapa {
  if (estado !== "finalizada") return estado;
  if (decision === "aprobado") return "aprobada";
  if (decision === "rechazado") return "rechazada";
  return "revision";
}

const ETAPAS: Record<
  Etapa,
  { label: string; icon: typeof Clock3; clase: string }
> = {
  enviada: {
    label: "Enviada",
    icon: Clock3,
    clase: "bg-secondary text-accent-foreground",
  },
  procesando: {
    label: "En proceso",
    icon: LoaderCircle,
    clase: "bg-[#e8eef6] text-[#24557d] dark:bg-[#1c2a38] dark:text-[#9cc1e3]",
  },
  revision: {
    label: "En revisión",
    icon: FileSearch,
    clase: "bg-[#f6eedf] text-[#8a5a14] dark:bg-[#33281a] dark:text-[#f2c98a]",
  },
  aprobada: {
    label: "Aprobada",
    icon: CircleCheck,
    clase: "bg-primary/10 text-primary dark:bg-primary/15",
  },
  rechazada: {
    label: "Rechazada",
    icon: CircleX,
    clase: "bg-destructive/10 text-destructive",
  },
  error: {
    label: "No enviada",
    icon: CircleAlert,
    clase: "bg-destructive/10 text-destructive",
  },
};

/** Etapa de una solicitud: siempre icono + texto (nunca solo color). */
export function EstadoBadge({
  estado,
  decision = "pendiente",
}: {
  estado: EstadoUsuario;
  decision?: Decision;
}) {
  const { label, icon: Icon, clase } = ETAPAS[etapaDe(estado, decision)];
  return (
    <span
      className={cx(
        "inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium whitespace-nowrap",
        clase,
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {label}
    </span>
  );
}

/** Comentario del administrador al aprobar o rechazar. */
export function ComentarioAdmin({ texto }: { texto: string | null }) {
  if (!texto) return null;
  return (
    <p className="text-muted-foreground mt-1.5 flex items-start gap-1.5 text-xs">
      <MessageSquareText className="mt-px size-3.5 shrink-0" aria-hidden />
      <span>
        <span className="text-foreground font-medium">Comentario:</span> {texto}
      </span>
    </p>
  );
}
