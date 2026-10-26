import type { Metadata } from "next";
import { GestionUsuarios } from "@/components/admin/gestion-usuarios";
import { USUARIOS_DEMO } from "@/lib/estudios/mock";

export const metadata: Metadata = { title: "Usuarios" };

/** Gestión de usuarios. MAQUETA con datos de ejemplo. */
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
      <GestionUsuarios usuarios={USUARIOS_DEMO} />
    </div>
  );
}
