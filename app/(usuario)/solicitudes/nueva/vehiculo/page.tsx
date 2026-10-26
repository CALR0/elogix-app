import type { Metadata } from "next";
import { CarFront } from "lucide-react";
import { EncabezadoModulo } from "@/components/solicitudes/encabezado-modulo";
import { FormularioVehiculo } from "@/components/solicitudes/formulario-vehiculo";

export const metadata: Metadata = { title: "Consulta por vehículo" };

export default function ConsultaVehiculoPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <EncabezadoModulo
        icon={CarFront}
        titulo="Consulta por vehículo"
        descripcion="Placa del vehículo y documento de su propietario."
      />
      <FormularioVehiculo />
    </div>
  );
}
