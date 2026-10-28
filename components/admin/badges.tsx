import {
  CircleAlert,
  CircleCheck,
  CircleX,
  Info,
  LoaderCircle,
  OctagonAlert,
  RefreshCcw,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import type { EstadoEstudio, NivelHallazgo } from "@/lib/estudios/tipos";
import { cx } from "@/lib/utils";

const NIVEL: Record<
  NivelHallazgo,
  { label: string; icon: LucideIcon; clase: string; punto: string }
> = {
  alto: {
    label: "Alto",
    icon: OctagonAlert,
    clase: "bg-hallazgo-alto/10 text-[#a62c23] dark:text-[#f0928a]",
    punto: "bg-hallazgo-alto",
  },
  medio: {
    label: "Medio",
    icon: TriangleAlert,
    clase: "bg-hallazgo-medio/12 text-[#9a5512] dark:text-[#f2b67a]",
    punto: "bg-hallazgo-medio",
  },
  bajo: {
    label: "Bajo",
    icon: CircleAlert,
    clase: "bg-hallazgo-bajo/15 text-[#7a6213] dark:text-[#e3cb7c]",
    punto: "bg-hallazgo-bajo",
  },
  info: {
    label: "Info",
    icon: Info,
    clase: "bg-hallazgo-info/10 text-[#24557d] dark:text-[#9cc1e3]",
    punto: "bg-hallazgo-info",
  },
  sin_hallazgo: {
    label: "Sin hallazgo",
    icon: CircleCheck,
    clase: "bg-hallazgo-sin/10 text-[#22683f] dark:text-[#8fd3a9]",
    punto: "bg-hallazgo-sin",
  },
};

export const NIVELES_ORDEN: NivelHallazgo[] = [
  "alto",
  "medio",
  "bajo",
  "info",
  "sin_hallazgo",
];

export function nivelInfo(nivel: NivelHallazgo) {
  return NIVEL[nivel];
}

/** Semáforo de hallazgo: icono + texto, nunca solo color. */
export function NivelBadge({
  nivel,
  grande,
}: {
  nivel: NivelHallazgo | null;
  grande?: boolean;
}) {
  if (!nivel) {
    return <span className="text-muted-foreground text-xs">—</span>;
  }
  const { label, icon: Icon, clase } = NIVEL[nivel];
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full font-semibold whitespace-nowrap",
        grande ? "h-9 px-4 text-sm" : "h-7 px-2.5 text-xs",
        clase,
      )}
    >
      <Icon className={grande ? "size-4" : "size-3.5"} aria-hidden />
      {label}
    </span>
  );
}

const ESTADO: Record<
  EstadoEstudio,
  { label: string; icon: LucideIcon; clase: string }
> = {
  por_revisar: {
    label: "Por revisar",
    icon: CircleAlert,
    clase: "text-accent-foreground",
  },
  procesando: {
    label: "En proceso",
    icon: LoaderCircle,
    clase: "text-muted-foreground",
  },
  fuentes_error: {
    label: "Fuentes con error",
    icon: RefreshCcw,
    clase: "text-[#9a5512] dark:text-[#f2b67a]",
  },
  error_envio: {
    label: "Error de envío",
    icon: CircleX,
    clase: "text-destructive",
  },
  aprobado: {
    label: "Aprobado",
    icon: CircleCheck,
    clase: "text-primary",
  },
  rechazado: {
    label: "Rechazado",
    icon: CircleX,
    clase: "text-destructive",
  },
};

export function EstadoEstudioTexto({ estado }: { estado: EstadoEstudio }) {
  const { label, icon: Icon, clase } = ESTADO[estado];
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap",
        clase,
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {label}
    </span>
  );
}
