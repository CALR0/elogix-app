import { CircleAlert, CircleCheck, Clock3, LoaderCircle } from "lucide-react";
import { ESTADOS_USUARIO, type EstadoUsuario } from "@/lib/solicitudes/estados";
import { cx } from "@/lib/utils";

const ESTILO: Record<
  EstadoUsuario,
  { icon: typeof Clock3; clase: string; iconClase?: string }
> = {
  enviada: { icon: Clock3, clase: "bg-secondary text-accent-foreground" },
  procesando: {
    icon: LoaderCircle,
    clase: "bg-[#e8eef6] text-[#24557d] dark:bg-[#1c2a38] dark:text-[#9cc1e3]",
  },
  finalizada: {
    icon: CircleCheck,
    clase: "bg-primary/10 text-primary dark:bg-primary/15",
  },
  error: {
    icon: CircleAlert,
    clase: "bg-destructive/10 text-destructive",
  },
};

/** Estado de una solicitud: siempre icono + texto (nunca solo color). */
export function EstadoBadge({ estado }: { estado: EstadoUsuario }) {
  const { icon: Icon, clase } = ESTILO[estado];
  return (
    <span
      className={cx(
        "inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium whitespace-nowrap",
        clase,
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {ESTADOS_USUARIO[estado].etiqueta}
    </span>
  );
}
