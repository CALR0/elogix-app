import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "ELOGIX", template: "%s · ELOGIX" },
  description: "Plataforma de validaciones de Elogia Soluciones Logísticas",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      {/* Extensiones (p. ej. antivirus) agregan atributos al <body> antes de que
          React cargue: se ignora solo esa diferencia, no la de los hijos. */}
      <body
        className="flex min-h-full flex-col font-sans"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
