import { LoaderCircle } from "lucide-react";

/**
 * Pantalla de carga a pantalla completa (iniciar / cerrar sesión). Fondo
 * sólido semitransparente, sin desenfoque: rápida en equipos lentos.
 */
export function PantallaCarga({ texto }: { texto: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-background/95 fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4"
    >
      <span className="bg-brand-deep flex size-14 items-center justify-center rounded-2xl text-white shadow-lg">
        <LoaderCircle className="size-7 animate-spin" aria-hidden />
      </span>
      <p className="text-accent-foreground text-sm font-medium">{texto}</p>
    </div>
  );
}
