import type { Metadata } from "next";
import Image from "next/image";
import { FileSearch, MapPin, ShieldCheck } from "lucide-react";
import logo from "@/public/brand/elogia-logo.svg";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Iniciar sesión" };

/** El recorrido de un estudio contado como un viaje: origen → en ruta → destino. */
const RECORRIDO = [
  {
    icon: MapPin,
    etapa: "Origen",
    titulo: "Solicitud",
    texto: "Se envían los datos del conductor o vehículo.",
  },
  {
    icon: FileSearch,
    etapa: "En ruta",
    titulo: "Verificación",
    texto: "Antecedentes, licencias, SOAT, multas y listas restrictivas.",
  },
  {
    icon: ShieldCheck,
    etapa: "Destino",
    titulo: "Decisión",
    texto: "Cada estudio queda revisado, aprobado y registrado.",
  },
];

export default function LoginPage() {
  return (
    <main className="lg:bg-brand-deep relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-10 sm:px-8 lg:px-16 xl:px-24">
      <RutasDecorativas />

      <div className="relative grid w-full max-w-6xl items-center gap-16 lg:grid-cols-[minmax(380px,430px)_1fr] xl:gap-24">
        {/* Formulario: tarjeta flotante sobre el fondo de marca en escritorio */}
        <section className="lg:bg-card mx-auto w-full max-w-sm lg:max-w-none lg:rounded-2xl lg:p-10 lg:shadow-2xl lg:shadow-black/30">
          <Image
            src={logo}
            alt="Elogia Soluciones Logísticas"
            priority
            className="mx-auto mb-10 h-auto w-48"
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
        </section>

        {/* Mensaje de marca: el recorrido del estudio como un itinerario de viaje */}
        <section className="hidden text-white lg:block">
          <p className="text-brand text-xs font-medium tracking-[0.25em] uppercase">
            Elogia · Soluciones logísticas
          </p>
          <h2 className="mt-5 max-w-xl text-4xl leading-[1.15] font-semibold tracking-tight xl:text-5xl">
            Cada conductor verificado antes de tomar la ruta.
          </h2>

          <ol className="relative mt-14 max-w-md space-y-9">
            <span
              className="absolute top-4 bottom-4 left-[19px] border-l-2 border-dashed border-white/20"
              aria-hidden
            />
            {RECORRIDO.map(({ icon: Icon, etapa, titulo, texto }) => (
              <li key={etapa} className="relative flex gap-5">
                <span className="bg-brand-deep flex size-10 shrink-0 items-center justify-center rounded-full ring-1 ring-white/25">
                  <Icon className="text-brand size-[18px]" aria-hidden />
                </span>
                <div className="pt-0.5">
                  <p className="text-[11px] font-medium tracking-[0.2em] text-white/50 uppercase">
                    {etapa}
                  </p>
                  <p className="mt-1 font-medium">{titulo}</p>
                  <p className="mt-0.5 text-sm text-white/65">{texto}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <p className="absolute right-8 bottom-6 hidden text-xs text-white/40 lg:block">
        © Elogia Soluciones Logísticas
      </p>
    </main>
  );
}

/** Líneas de ruta sutiles (SVG en línea, solo escritorio: sin peticiones ni animaciones). */
function RutasDecorativas() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 hidden h-full w-full lg:block"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
    >
      <g stroke="white" strokeOpacity="0.06" strokeWidth="1.5">
        <path d="M-60 760 C 260 640, 420 860, 720 720 S 1180 480, 1500 560" />
        <path d="M-60 820 C 280 720, 460 920, 760 790 S 1200 560, 1500 640" />
        <path d="M-60 140 C 240 250, 520 40, 820 150 S 1240 330, 1500 210" />
        <path d="M-60 200 C 260 300, 540 110, 840 210 S 1260 390, 1500 280" />
      </g>
      <path
        d="M-60 700 C 240 580, 400 800, 700 660 S 1160 420, 1500 500"
        stroke="#95A495"
        strokeOpacity="0.35"
        strokeWidth="2"
        strokeDasharray="10 14"
      />
      <g fill="#95A495" fillOpacity="0.5">
        <circle cx="700" cy="660" r="5" />
        <circle cx="1185" cy="452" r="5" />
      </g>
    </svg>
  );
}
