"use client";

import { useFormStatus } from "react-dom";
import { LogOut } from "lucide-react";
import { PantallaCarga } from "@/components/ui/pantalla-carga";

/**
 * Botón de cerrar sesión. Va DENTRO del <form action={cerrarSesion}> del
 * servidor: useFormStatus sabe cuándo se está enviando y muestra la pantalla
 * de carga hasta llegar al login.
 */
export function BotonCerrarSesion({ className }: { className: string }) {
  const { pending } = useFormStatus();
  return (
    <>
      {pending && <PantallaCarga texto="Cerrando sesión…" />}
      <button
        type="submit"
        disabled={pending}
        aria-label="Cerrar sesión"
        title="Cerrar sesión"
        className={className}
      >
        <LogOut className="size-4" aria-hidden />
      </button>
    </>
  );
}
