import Link from "next/link";

export default function Forbidden() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-2xl font-semibold">Acceso restringido</h1>
      <p className="text-muted-foreground">
        Tu rol no tiene permiso para ver esta sección.
      </p>
      <Link href="/" className="text-primary underline underline-offset-4">
        Volver al inicio
      </Link>
    </main>
  );
}
