import { redirect } from "next/navigation";

// Pendiente (Fase 3): con sesión, enviar a homePathFor(user) (/solicitudes o /dashboard).
export default function Home() {
  redirect("/login");
}
