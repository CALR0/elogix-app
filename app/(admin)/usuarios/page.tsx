import type { Metadata } from "next";
import { Suspense } from "react";
import { GestionUsuarios } from "@/components/admin/gestion-usuarios";
import { requireAdmin } from "@/lib/auth";
import { listarUsuarios } from "@/lib/usuarios/datos";

export const metadata: Metadata = { title: "Usuarios" };

/** Gestión de usuarios con datos reales de Supabase. */
export default function UsuariosPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Usuarios
        </h1>
        <p className="text-muted-foreground text-sm">
          Administra las cuentas de acceso: crea usuarios, asigna roles,
          actualiza correos y contraseñas, y activa o desactiva cuentas.
        </p>
      </header>
      <Suspense fallback={<ListaCargando />}>
        <ListaUsuarios />
      </Suspense>
    </div>
  );
}

/** Lee la sesión y los datos: va dentro de <Suspense> (Cache Components). */
async function ListaUsuarios() {
  const yo = await requireAdmin();
  const usuarios = await listarUsuarios();
  return <GestionUsuarios usuarios={usuarios} yoId={yo.id} />;
}

function ListaCargando() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Cargando usuarios">
      <div className="flex justify-between">
        <div className="bg-card h-10 w-80 animate-pulse rounded-lg border" />
        <div className="bg-card h-10 w-36 animate-pulse rounded-lg border" />
      </div>
      <div className="bg-card h-80 animate-pulse rounded-2xl border" />
    </div>
  );
}
