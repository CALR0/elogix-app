import Link from "next/link";
import { CircleCheck, RotateCcw, TriangleAlert } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";

/** Pantalla tras un envío exitoso. El usuario NO ve resultados (§14.5). */
export function EnvioExitoso({
  referencia,
  onNueva,
}: {
  referencia: string;
  onNueva: () => void;
}) {
  return (
    <div className="bg-card rounded-2xl border px-6 py-10 text-center sm:px-10">
      <span className="bg-primary/10 text-primary mx-auto flex size-16 items-center justify-center rounded-full">
        <CircleCheck className="size-8" aria-hidden />
      </span>
      <h2 className="mt-5 text-xl font-semibold">Solicitud enviada</h2>
      <p className="text-muted-foreground mx-auto mt-2 max-w-sm text-sm leading-relaxed">
        La consulta quedó registrada y se está procesando. Puedes seguir su
        estado en Mis solicitudes.
      </p>
      <p className="bg-secondary mx-auto mt-6 inline-flex flex-col rounded-xl px-6 py-3">
        <span className="text-muted-foreground text-xs">Referencia</span>
        <span className="text-accent-foreground font-mono text-lg font-semibold tracking-wider">
          {referencia}
        </span>
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button variante="secundario" tamano="lg" onClick={onNueva}>
          Nueva consulta
        </Button>
        <ButtonLink href="/solicitudes" tamano="lg">
          Ver mis solicitudes
        </ButtonLink>
      </div>
    </div>
  );
}

/** Error al enviar: se conservan los datos para reintentar sin volver a escribir. */
export function EnvioError({
  mensaje,
  onReintentar,
}: {
  mensaje: string;
  onReintentar: () => void;
}) {
  return (
    <div className="bg-card rounded-2xl border px-6 py-10 text-center sm:px-10">
      <span className="bg-destructive/10 text-destructive mx-auto flex size-16 items-center justify-center rounded-full">
        <TriangleAlert className="size-8" aria-hidden />
      </span>
      <h2 className="mt-5 text-xl font-semibold">No se pudo enviar</h2>
      <p className="text-muted-foreground mx-auto mt-2 max-w-sm text-sm leading-relaxed">
        {mensaje}
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button tamano="lg" onClick={onReintentar}>
          <RotateCcw className="size-4" aria-hidden />
          Intentar de nuevo
        </Button>
        <Link
          href="/inicio"
          className="text-muted-foreground hover:text-foreground inline-flex h-12 items-center justify-center text-sm font-medium"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}

/**
 * MAQUETA: simula el envío. Si el documento termina en "000" responde con
 * error, para poder ver ese estado. Se reemplaza por la Server Function real.
 */
export async function simularEnvio(clave: string) {
  await new Promise((r) => setTimeout(r, 900));
  if (clave.endsWith("000")) {
    return {
      ok: false as const,
      mensaje:
        "El servicio de consultas no respondió a tiempo. Tus datos se conservaron; intenta de nuevo en unos segundos.",
    };
  }
  return { ok: true as const, numero: 149 };
}
