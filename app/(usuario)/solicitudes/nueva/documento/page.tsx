import type { Metadata } from "next";
import { IdCard } from "lucide-react";
import { EncabezadoModulo } from "@/components/solicitudes/encabezado-modulo";
import { FormularioDocumento } from "@/components/solicitudes/formulario-documento";

export const metadata: Metadata = { title: "Consulta por documento" };

export default function ConsultaDocumentoPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <EncabezadoModulo
        icon={IdCard}
        titulo="Consulta por documento"
        descripcion="Antecedentes de una persona o empresa."
      />
      <FormularioDocumento />
    </div>
  );
}
