// Clases completas para que Tailwind las detecte
const NIVELES = {
  alto: "bg-hallazgo-alto",
  medio: "bg-hallazgo-medio",
  bajo: "bg-hallazgo-bajo",
  info: "bg-hallazgo-info",
  "sin hallazgo": "bg-hallazgo-sin",
};

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">
        E<span className="text-primary">LOGIX</span>
      </h1>
      <p className="text-muted-foreground max-w-md">
        Plataforma de validaciones de Elogia Soluciones Logísticas.
      </p>
      <div className="flex gap-2 text-xs">
        {Object.entries(NIVELES).map(([nivel, color]) => (
          <span
            key={nivel}
            className={`text-background rounded-full px-3 py-1 font-medium ${color}`}
          >
            {nivel}
          </span>
        ))}
      </div>
    </main>
  );
}
