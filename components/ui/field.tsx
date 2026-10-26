import type { ComponentProps, ReactNode } from "react";
import { CircleAlert } from "lucide-react";
import { cx } from "@/lib/utils";

/** Campo con etiqueta, ayuda opcional y mensaje de error accesible. */
export function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {error ? (
        <p
          id={`${id}-error`}
          className="text-destructive flex items-center gap-1.5 text-xs"
        >
          <CircleAlert className="size-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      ) : (
        hint && <p className="text-muted-foreground text-xs">{hint}</p>
      )}
    </div>
  );
}

export const inputClasses =
  "h-11 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-primary aria-invalid:border-destructive";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cx(inputClasses, className)} {...props} />;
}

/**
 * Selector tipo "pastillas" (radio group). Más rápido de usar que un <select>
 * cuando hay pocas opciones, y accesible con teclado (flechas).
 */
export function OpcionesPastilla<T extends string>({
  name,
  opciones,
  valor,
  onChange,
  etiqueta,
}: {
  name: string;
  opciones: ReadonlyArray<{ valor: T; corto: string; largo: string }>;
  valor: T;
  onChange: (valor: T) => void;
  etiqueta: string;
}) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-medium">{etiqueta}</legend>
      <div className="flex flex-wrap gap-2">
        {opciones.map((o) => (
          <label
            key={o.valor}
            title={o.largo}
            className={cx(
              "has-[:focus-visible]:ring-ring flex h-10 cursor-pointer items-center rounded-lg border px-3.5 text-sm font-medium transition-colors has-[:focus-visible]:ring-2",
              valor === o.valor
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-card hover:bg-secondary",
            )}
          >
            <input
              type="radio"
              name={name}
              value={o.valor}
              checked={valor === o.valor}
              onChange={() => onChange(o.valor)}
              className="sr-only"
            />
            {o.corto}
          </label>
        ))}
      </div>
      <p className="text-muted-foreground mt-1.5 text-xs">
        {opciones.find((o) => o.valor === valor)?.largo}
      </p>
    </fieldset>
  );
}

/** Casilla de autorización del titular (Ley 1581 de 2012). */
export function Autorizacion({
  checked,
  onChange,
  error,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  error?: string;
}) {
  return (
    <div>
      <label
        className={cx(
          "flex cursor-pointer gap-3 rounded-lg border p-4 text-sm transition-colors",
          checked ? "border-primary/40 bg-secondary/60" : "bg-card",
          error && "border-destructive",
        )}
      >
        <input
          type="checkbox"
          name="autorizacion"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="accent-primary mt-0.5 size-4 shrink-0"
        />
        <span className="text-muted-foreground leading-relaxed">
          Confirmo que cuento con la{" "}
          <strong className="text-foreground font-medium">
            autorización del titular
          </strong>{" "}
          para consultar sus antecedentes, según la Ley 1581 de 2012.
        </span>
      </label>
      {error && (
        <p className="text-destructive mt-1.5 flex items-center gap-1.5 text-xs">
          <CircleAlert className="size-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      )}
    </div>
  );
}
