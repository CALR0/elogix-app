import type { Metadata } from "next";
import Image from "next/image";
import { FileSearch, Route, ShieldCheck } from "lucide-react";
import logo from "@/public/brand/elogia-logo.svg";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Iniciar sesión" };

const BENEFICIOS = [
  {
    icon: Route,
    titulo: "Solicitudes en minutos",
    texto: "Envía los datos del conductor o vehículo desde cualquier lugar.",
  },
  {
    icon: FileSearch,
    titulo: "Verificación en fuentes oficiales",
    texto: "Antecedentes, licencias, SOAT, multas y listas restrictivas.",
  },
  {
    icon: ShieldCheck,
    titulo: "Decisiones con trazabilidad",
    texto: "Cada estudio queda revisado, aprobado y registrado.",
  },
];

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      {/* Panel de marca (solo escritorio) */}
      <section className="bg-brand-deep relative hidden overflow-hidden text-white lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        <RutasDecorativas />

        <Image
          src={logo}
          alt="Elogia Soluciones Logísticas"
          priority
          className="relative h-auto w-44 brightness-0 invert"
        />

        <div className="relative max-w-md space-y-10">
          <h2 className="text-3xl leading-tight font-semibold tracking-tight xl:text-4xl">
            Estudios de seguridad para una operación logística confiable.
          </h2>
          <ul className="space-y-6">
            {BENEFICIOS.map(({ icon: Icon, titulo, texto }) => (
              <li key={titulo} className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <Icon className="size-5" aria-hidden />
                </span>
                <div>
                  <p className="font-medium">{titulo}</p>
                  <p className="text-sm text-white/70">{texto}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/50">
          © Elogia Soluciones Logísticas
        </p>
      </section>

      {/* Formulario */}
      <section className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-sm">
          <Image
            src={logo}
            alt="Elogia Soluciones Logísticas"
            priority
            className="mx-auto mb-10 h-auto w-48 lg:hidden"
          />

          <div className="mb-8 flex flex-col items-center gap-3">
            <h1 className="text-accent-foreground text-[1.625rem] font-semibold tracking-tight">
              Iniciar sesión
            </h1>
            <span className="bg-brand h-1 w-10 rounded-full" aria-hidden />
          </div>

          <LoginForm />

          <p className="text-muted-foreground mt-8 text-center text-xs">
            ¿No tienes acceso? Solicítalo al administrador de la plataforma.
          </p>
        </div>
      </section>
    </main>
  );
}

/** Líneas de ruta sutiles (SVG en línea: sin peticiones extra ni costo de render). */
function RutasDecorativas() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 600 800"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
    >
      <g stroke="white" strokeOpacity="0.07" strokeWidth="1.5">
        <path d="M-40 640 C 120 560, 180 700, 320 600 S 520 420, 660 480" />
        <path d="M-40 700 C 140 620, 220 760, 360 660 S 540 500, 660 560" />
        <path d="M-40 160 C 100 240, 260 80, 380 180 S 560 320, 660 240" />
      </g>
      <path
        d="M-40 580 C 100 500, 160 640, 300 540 S 500 360, 660 420"
        stroke="white"
        strokeOpacity="0.16"
        strokeWidth="2"
        strokeDasharray="10 12"
      />
      <g fill="white" fillOpacity="0.22">
        <circle cx="300" cy="540" r="4" />
        <circle cx="516" cy="393" r="4" />
      </g>
    </svg>
  );
}
