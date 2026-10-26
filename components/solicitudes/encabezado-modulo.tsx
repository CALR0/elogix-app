import Link from "next/link";
import { ArrowLeft, type LucideIcon } from "lucide-react";

export function EncabezadoModulo({
  icon: Icon,
  titulo,
  descripcion,
}: {
  icon: LucideIcon;
  titulo: string;
  descripcion: string;
}) {
  return (
    <header className="mb-6 sm:mb-8">
      <Link
        href="/inicio"
        className="text-muted-foreground hover:text-foreground mb-5 inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Inicio
      </Link>
      <div className="flex items-start gap-4">
        <span className="bg-brand-deep flex size-11 shrink-0 items-center justify-center rounded-xl text-white">
          <Icon className="size-5" aria-hidden />
        </span>
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            {titulo}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">{descripcion}</p>
        </div>
      </div>
    </header>
  );
}
