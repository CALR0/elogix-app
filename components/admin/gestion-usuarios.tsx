"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import {
  CircleAlert,
  CircleCheck,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  Pencil,
  Search,
  UserPlus,
  X,
} from "lucide-react";
import {
  cambiarEstado,
  cambiarRol,
  crearUsuario,
  editarAcceso,
  type Resultado,
} from "@/app/(admin)/usuarios/acciones";
import { Button } from "@/components/ui/button";
import {
  Field,
  Input,
  OpcionesPastilla,
  inputClasses,
} from "@/components/ui/field";
import { Paginacion, usePaginacion } from "@/components/ui/paginacion";
import type { UsuarioFila } from "@/lib/usuarios/tipos";
import { cx, fechaCorta } from "@/lib/utils";

const ROLES = [
  {
    valor: "usuario",
    corto: "Usuario",
    largo: "Envía consultas y ve solo su estado.",
  },
  {
    valor: "admin",
    corto: "Administrador",
    largo: "Revisa resultados, decide y gestiona usuarios.",
  },
] as const;

/** Contraseña temporal de 14 caracteres sin caracteres ambiguos (0/O, 1/l). */
function generarClave() {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
  const bytes = crypto.getRandomValues(new Uint32Array(14));
  return Array.from(bytes, (b) => abc[b % abc.length]).join("");
}

function iniciales(nombre: string) {
  return nombre
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

/** Interruptor accesible (role="switch"). */
function Interruptor({
  activo,
  onChange,
  etiqueta,
  deshabilitado,
}: {
  activo: boolean;
  onChange: () => void;
  etiqueta: string;
  deshabilitado?: boolean;
}) {
  return (
    <button
      role="switch"
      aria-checked={activo}
      aria-label={etiqueta}
      onClick={onChange}
      disabled={deshabilitado}
      className={cx(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        activo ? "bg-primary" : "bg-input",
      )}
    >
      <span
        className={cx(
          "absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-sm transition-transform",
          activo && "translate-x-5",
        )}
      />
    </button>
  );
}

/** Contraseña con mostrar/ocultar y generador de contraseñas temporales. */
function CampoClave({
  id,
  label,
  hint,
  valor,
  onChange,
  error,
  requerida,
}: {
  id: string;
  label: string;
  hint: string;
  valor: string;
  onChange: (v: string) => void;
  error?: string;
  requerida?: boolean;
}) {
  const [ver, setVer] = useState(false);
  return (
    <Field id={id} label={label} hint={hint} error={error}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            id={id}
            type={ver ? "text" : "password"}
            autoComplete="new-password"
            required={requerida}
            value={valor}
            onChange={(e) => onChange(e.target.value)}
            className="pr-10 font-mono"
          />
          <button
            type="button"
            onClick={() => setVer((v) => !v)}
            aria-label={ver ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-1 flex size-9 -translate-y-1/2 items-center justify-center"
          >
            {ver ? (
              <EyeOff className="size-4" aria-hidden />
            ) : (
              <Eye className="size-4" aria-hidden />
            )}
          </button>
        </div>
        <Button
          type="button"
          variante="secundario"
          onClick={() => {
            onChange(generarClave());
            setVer(true);
          }}
        >
          <KeyRound className="size-4" aria-hidden />
          Generar
        </Button>
      </div>
    </Field>
  );
}

type Aviso = { tipo: "ok" | "error"; texto: string } | null;

const NUEVO_VACIO = {
  nombre: "",
  email: "",
  rol: "usuario" as UsuarioFila["rol"],
  clave: "",
  error: "",
};

/**
 * Gestión de usuarios del admin. Cada cambio llama a una Server Function
 * (`app/(admin)/usuarios/acciones.ts`) que verifica el rol, aplica el cambio en
 * Supabase Auth y lo registra en auditoría. `yoId` evita que el admin se
 * desactive o se quite el rol a sí mismo (el servidor también lo impide).
 */
export function GestionUsuarios({
  usuarios: iniciales_,
  yoId,
}: {
  usuarios: UsuarioFila[];
  yoId: string;
}) {
  const [usuarios, setUsuarios] = useState(iniciales_);
  const [aviso, setAviso] = useState<Aviso>(null);
  const [q, setQ] = useState("");
  const [pendiente, startTransition] = useTransition();
  const [ocupado, setOcupado] = useState<string | null>(null);

  const dialogo = useRef<HTMLDialogElement>(null);
  const [nuevo, setNuevo] = useState(NUEVO_VACIO);

  const dialogoEditar = useRef<HTMLDialogElement>(null);
  const [edicion, setEdicion] = useState({
    id: "",
    nombre: "",
    email: "",
    clave: "",
    error: "",
  });

  const filtrados = useMemo(() => {
    const texto = q.trim().toLowerCase();
    return usuarios.filter(
      (u) =>
        !texto ||
        u.nombre.toLowerCase().includes(texto) ||
        u.email.toLowerCase().includes(texto),
    );
  }, [usuarios, q]);
  const { ancla, visibles, reiniciar, props } = usePaginacion(filtrados);

  function actualizar(id: string, cambio: Partial<UsuarioFila>) {
    setUsuarios((l) => l.map((u) => (u.id === id ? { ...u, ...cambio } : u)));
  }

  /** Ejecuta una acción del servidor sobre una fila y muestra el resultado. */
  function ejecutar(
    id: string,
    accion: () => Promise<Resultado>,
    alConfirmar: () => void,
  ) {
    setOcupado(id);
    startTransition(async () => {
      const r = await accion();
      if (r.ok) alConfirmar();
      setAviso(
        r.ok
          ? { tipo: "ok", texto: r.mensaje }
          : { tipo: "error", texto: r.error },
      );
      setOcupado(null);
    });
  }

  function crear(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const r = await crearUsuario(nuevo);
      if (!r.ok) {
        setNuevo((n) => ({ ...n, error: r.error }));
        return;
      }
      if (r.dato) setUsuarios((l) => [r.dato!, ...l]);
      setAviso({
        tipo: "ok",
        texto: `${r.mensaje} Comparte la contraseña por un canal seguro.`,
      });
      setNuevo(NUEVO_VACIO);
      dialogo.current?.close();
    });
  }

  function guardarEdicion(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const r = await editarAcceso(edicion.id, {
        email: edicion.email,
        clave: edicion.clave,
      });
      if (!r.ok) {
        setEdicion((s) => ({ ...s, error: r.error }));
        return;
      }
      actualizar(edicion.id, { email: edicion.email.trim().toLowerCase() });
      setAviso({
        tipo: "ok",
        texto: `${r.mensaje.replace(/\.$/, "")} de ${edicion.nombre}.`,
      });
      dialogoEditar.current?.close();
    });
  }

  return (
    <div ref={ancla} className="scroll-mt-20 space-y-4">
      {aviso && (
        <div
          role={aviso.tipo === "error" ? "alert" : "status"}
          className={cx(
            "flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm",
            aviso.tipo === "ok"
              ? "bg-primary/8 border-primary/25 text-accent-foreground"
              : "border-destructive/30 bg-destructive/5 text-destructive",
          )}
        >
          <span className="flex items-center gap-2">
            {aviso.tipo === "ok" ? (
              <CircleCheck
                className="text-primary size-4 shrink-0"
                aria-hidden
              />
            ) : (
              <CircleAlert className="size-4 shrink-0" aria-hidden />
            )}
            {aviso.texto}
          </span>
          <button
            onClick={() => setAviso(null)}
            aria-label="Cerrar aviso"
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:w-80">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden
          />
          <input
            type="search"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              reiniciar();
            }}
            placeholder="Buscar por nombre o correo"
            aria-label="Buscar usuarios"
            className={cx(inputClasses, "h-10 pl-9")}
          />
        </div>
        <Button
          onClick={() => {
            setNuevo(NUEVO_VACIO);
            dialogo.current?.showModal();
          }}
        >
          <UserPlus className="size-4" aria-hidden />
          Nuevo usuario
        </Button>
      </div>

      {filtrados.length === 0 && (
        <p className="bg-card text-muted-foreground rounded-2xl border px-6 py-12 text-center text-sm">
          {q ? `Ningún usuario coincide con “${q}”.` : "Aún no hay usuarios."}
        </p>
      )}

      <ul
        className={cx(
          "bg-card divide-y rounded-2xl border",
          filtrados.length === 0 && "hidden",
        )}
      >
        {visibles.map((u) => {
          const soyYo = u.id === yoId;
          const cargando = ocupado === u.id && pendiente;
          return (
            <li
              key={u.id}
              className={cx(
                "flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center",
                !u.activo && "opacity-60",
              )}
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span
                  className={cx(
                    "flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                    u.rol === "admin"
                      ? "bg-brand-deep text-white"
                      : "bg-secondary text-accent-foreground",
                  )}
                  aria-hidden
                >
                  {iniciales(u.nombre)}
                </span>
                <div className="min-w-0">
                  <p className="flex items-center gap-2 truncate font-medium">
                    {u.nombre}
                    {soyYo && (
                      <span className="bg-secondary text-accent-foreground rounded-full px-2 py-0.5 text-[10px] font-semibold">
                        Tú
                      </span>
                    )}
                  </p>
                  <p className="text-muted-foreground truncate text-xs">
                    {u.email}
                  </p>
                </div>
              </div>

              <div className="text-muted-foreground flex gap-6 text-xs sm:w-56">
                <div>
                  <p className="text-foreground text-sm font-medium tabular-nums">
                    {u.solicitudes}
                  </p>
                  solicitudes
                </div>
                <div>
                  <p className="text-foreground text-sm font-medium tabular-nums">
                    {fechaCorta(u.ultimaActividad)}
                  </p>
                  última actividad
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 sm:justify-end">
                {cargando && (
                  <LoaderCircle
                    className="text-muted-foreground size-4 animate-spin"
                    aria-label="Guardando"
                  />
                )}
                <select
                  value={u.rol}
                  disabled={soyYo || cargando}
                  title={soyYo ? "No puedes cambiar tu propio rol" : undefined}
                  onChange={(e) => {
                    const rol = e.target.value as UsuarioFila["rol"];
                    ejecutar(
                      u.id,
                      () => cambiarRol(u.id, rol),
                      () => actualizar(u.id, { rol }),
                    );
                  }}
                  aria-label={`Rol de ${u.nombre}`}
                  className="border-input bg-card h-9 rounded-lg border px-2 text-sm disabled:opacity-60"
                >
                  <option value="usuario">Usuario</option>
                  <option value="admin">Administrador</option>
                </select>
                <button
                  onClick={() => {
                    setEdicion({
                      id: u.id,
                      nombre: u.nombre,
                      email: u.email,
                      clave: "",
                      error: "",
                    });
                    dialogoEditar.current?.showModal();
                  }}
                  aria-label={`Editar correo o contraseña de ${u.nombre}`}
                  title="Editar correo o contraseña"
                  className="text-muted-foreground hover:bg-secondary hover:text-foreground flex size-9 items-center justify-center rounded-lg border transition-colors"
                >
                  <Pencil className="size-4" aria-hidden />
                </button>
                <label className="flex items-center gap-2 text-xs">
                  <Interruptor
                    activo={u.activo}
                    deshabilitado={soyYo || cargando}
                    onChange={() =>
                      ejecutar(
                        u.id,
                        () => cambiarEstado(u.id, !u.activo),
                        () => actualizar(u.id, { activo: !u.activo }),
                      )
                    }
                    etiqueta={`${u.activo ? "Desactivar" : "Activar"} a ${u.nombre}`}
                  />
                  <span className="w-14">
                    {u.activo ? "Activo" : "Inactivo"}
                  </span>
                </label>
              </div>
            </li>
          );
        })}
      </ul>
      <Paginacion {...props} etiqueta="usuarios" singular="usuario" />

      <dialog
        ref={dialogo}
        className="bg-card text-foreground m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border p-0 shadow-2xl backdrop:bg-black/40"
      >
        <form onSubmit={crear} className="space-y-5 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Nuevo usuario</h2>
            <button
              type="button"
              onClick={() => dialogo.current?.close()}
              aria-label="Cerrar"
              className="text-muted-foreground hover:bg-secondary flex size-8 items-center justify-center rounded-lg"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
          <Field id="nuevo-nombre" label="Nombre completo">
            <Input
              id="nuevo-nombre"
              required
              value={nuevo.nombre}
              onChange={(e) =>
                setNuevo((n) => ({ ...n, nombre: e.target.value, error: "" }))
              }
            />
          </Field>
          <Field id="nuevo-email" label="Correo corporativo">
            <Input
              id="nuevo-email"
              type="email"
              required
              placeholder="nombre@elogia.com"
              value={nuevo.email}
              onChange={(e) =>
                setNuevo((n) => ({ ...n, email: e.target.value, error: "" }))
              }
            />
          </Field>
          <CampoClave
            id="nuevo-clave"
            label="Contraseña inicial"
            hint="Mínimo 10 caracteres. Compártela por un canal seguro."
            valor={nuevo.clave}
            onChange={(clave) => setNuevo((n) => ({ ...n, clave, error: "" }))}
            requerida
          />
          <OpcionesPastilla
            name="rol"
            etiqueta="Rol"
            opciones={ROLES}
            valor={nuevo.rol}
            onChange={(rol) => setNuevo((n) => ({ ...n, rol }))}
          />
          {nuevo.error && (
            <p
              role="alert"
              className="text-destructive flex items-center gap-1.5 text-sm"
            >
              <CircleAlert className="size-4 shrink-0" aria-hidden />
              {nuevo.error}
            </p>
          )}
          <div className="flex justify-end gap-2 border-t pt-5">
            <Button
              type="button"
              variante="secundario"
              onClick={() => dialogo.current?.close()}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={pendiente}>
              {pendiente && (
                <LoaderCircle className="size-4 animate-spin" aria-hidden />
              )}
              Crear usuario
            </Button>
          </div>
        </form>
      </dialog>

      <dialog
        ref={dialogoEditar}
        className="bg-card text-foreground m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border p-0 shadow-2xl backdrop:bg-black/40"
      >
        <form onSubmit={guardarEdicion} className="space-y-5 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Editar acceso</h2>
              <p className="text-muted-foreground text-sm">{edicion.nombre}</p>
            </div>
            <button
              type="button"
              onClick={() => dialogoEditar.current?.close()}
              aria-label="Cerrar"
              className="text-muted-foreground hover:bg-secondary flex size-8 items-center justify-center rounded-lg"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
          <Field id="editar-email" label="Correo corporativo">
            <Input
              id="editar-email"
              type="email"
              required
              value={edicion.email}
              onChange={(e) =>
                setEdicion((s) => ({ ...s, email: e.target.value, error: "" }))
              }
            />
          </Field>
          <CampoClave
            id="editar-clave"
            label="Nueva contraseña"
            hint="Déjala vacía para no cambiarla. Compártela por un canal seguro."
            valor={edicion.clave}
            onChange={(clave) =>
              setEdicion((s) => ({ ...s, clave, error: "" }))
            }
            error={edicion.error}
          />
          <div className="flex justify-end gap-2 border-t pt-5">
            <Button
              type="button"
              variante="secundario"
              onClick={() => dialogoEditar.current?.close()}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={pendiente}>
              {pendiente && (
                <LoaderCircle className="size-4 animate-spin" aria-hidden />
              )}
              Guardar cambios
            </Button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
