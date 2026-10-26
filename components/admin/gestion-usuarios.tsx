"use client";

import { useMemo, useRef, useState } from "react";
import {
  CircleCheck,
  Eye,
  EyeOff,
  KeyRound,
  Pencil,
  Search,
  UserPlus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Field,
  Input,
  OpcionesPastilla,
  inputClasses,
} from "@/components/ui/field";
import { Paginacion, usePaginacion } from "@/components/ui/paginacion";
import type { UsuarioDemo } from "@/lib/estudios/mock";
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
}: {
  activo: boolean;
  onChange: () => void;
  etiqueta: string;
}) {
  return (
    <button
      role="switch"
      aria-checked={activo}
      aria-label={etiqueta}
      onClick={onChange}
      className={cx(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors",
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

/**
 * Gestión de usuarios. MAQUETA: cambios locales. En la Fase 3 la creación usa
 * `auth.admin.createUser()` con la secret key (app_metadata.role) y los
 * cambios de rol/estado pasan por una Server Function con `requireAdmin()`.
 */
export function GestionUsuarios({
  usuarios: iniciales_,
}: {
  usuarios: UsuarioDemo[];
}) {
  const [usuarios, setUsuarios] = useState(iniciales_);
  const dialogo = useRef<HTMLDialogElement>(null);
  const [nuevo, setNuevo] = useState({
    nombre: "",
    email: "",
    rol: "usuario" as UsuarioDemo["rol"],
  });

  const dialogoEditar = useRef<HTMLDialogElement>(null);
  const [edicion, setEdicion] = useState({
    id: "",
    nombre: "",
    email: "",
    clave: "",
    verClave: false,
    error: "",
  });
  const [aviso, setAviso] = useState("");
  const [q, setQ] = useState("");

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

  function actualizar(id: string, cambio: Partial<UsuarioDemo>) {
    setUsuarios((l) => l.map((u) => (u.id === id ? { ...u, ...cambio } : u)));
  }

  function abrirEdicion(u: UsuarioDemo) {
    setEdicion({
      id: u.id,
      nombre: u.nombre,
      email: u.email,
      clave: "",
      verClave: false,
      error: "",
    });
    dialogoEditar.current?.showModal();
  }

  /**
   * MAQUETA. En la Fase 3: Server Function con requireAdmin() que llama a
   * auth.admin.updateUserById(id, { email, password }) con la secret key y
   * registra "usuario.editar" en audit_logs (nunca se guarda la contraseña en logs).
   */
  function guardarEdicion(e: React.FormEvent) {
    e.preventDefault();
    if (edicion.clave && edicion.clave.length < 10) {
      setEdicion((s) => ({
        ...s,
        error: "La contraseña debe tener al menos 10 caracteres.",
      }));
      return;
    }
    const original = usuarios.find((u) => u.id === edicion.id);
    const cambios = [
      original?.email !== edicion.email && "correo",
      edicion.clave && "contraseña",
    ].filter(Boolean);
    actualizar(edicion.id, { email: edicion.email });
    setAviso(
      cambios.length
        ? `Se actualizó ${cambios.join(" y ")} de ${edicion.nombre}.`
        : "No hubo cambios.",
    );
    dialogoEditar.current?.close();
  }

  function crear(e: React.FormEvent) {
    e.preventDefault();
    setUsuarios((l) => [
      ...l,
      {
        id: crypto.randomUUID(),
        nombre: nuevo.nombre,
        email: nuevo.email,
        rol: nuevo.rol,
        activo: true,
        solicitudes: 0,
        ultimaActividad: new Date().toISOString(),
      },
    ]);
    setNuevo({ nombre: "", email: "", rol: "usuario" });
    dialogo.current?.close();
  }

  return (
    <div ref={ancla} className="scroll-mt-20 space-y-4">
      {aviso && (
        <div
          role="status"
          className="bg-primary/8 border-primary/25 text-accent-foreground flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm"
        >
          <span className="flex items-center gap-2">
            <CircleCheck className="text-primary size-4" aria-hidden />
            {aviso}
          </span>
          <button
            onClick={() => setAviso("")}
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
        <Button onClick={() => dialogo.current?.showModal()}>
          <UserPlus className="size-4" aria-hidden />
          Nuevo usuario
        </Button>
      </div>

      {filtrados.length === 0 && (
        <p className="bg-card text-muted-foreground rounded-2xl border px-6 py-12 text-center text-sm">
          Ningún usuario coincide con “{q}”.
        </p>
      )}

      <ul
        className={cx(
          "bg-card divide-y rounded-2xl border",
          filtrados.length === 0 && "hidden",
        )}
      >
        {visibles.map((u) => (
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
                <p className="truncate font-medium">{u.nombre}</p>
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
              <select
                value={u.rol}
                onChange={(e) =>
                  actualizar(u.id, {
                    rol: e.target.value as UsuarioDemo["rol"],
                  })
                }
                aria-label={`Rol de ${u.nombre}`}
                className="border-input bg-card h-9 rounded-lg border px-2 text-sm"
              >
                <option value="usuario">Usuario</option>
                <option value="admin">Administrador</option>
              </select>
              <button
                onClick={() => abrirEdicion(u)}
                aria-label={`Editar correo o contraseña de ${u.nombre}`}
                title="Editar correo o contraseña"
                className="text-muted-foreground hover:bg-secondary hover:text-foreground flex size-9 items-center justify-center rounded-lg border transition-colors"
              >
                <Pencil className="size-4" aria-hidden />
              </button>
              <label className="flex items-center gap-2 text-xs">
                <Interruptor
                  activo={u.activo}
                  onChange={() => actualizar(u.id, { activo: !u.activo })}
                  etiqueta={`${u.activo ? "Desactivar" : "Activar"} a ${u.nombre}`}
                />
                <span className="w-14">{u.activo ? "Activo" : "Inactivo"}</span>
              </label>
            </div>
          </li>
        ))}
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
                setNuevo((n) => ({ ...n, nombre: e.target.value }))
              }
            />
          </Field>
          <Field
            id="nuevo-email"
            label="Correo corporativo"
            hint="Recibirá un correo para crear su contraseña."
          >
            <Input
              id="nuevo-email"
              type="email"
              required
              placeholder="nombre@elogia.com"
              value={nuevo.email}
              onChange={(e) =>
                setNuevo((n) => ({ ...n, email: e.target.value }))
              }
            />
          </Field>
          <OpcionesPastilla
            name="rol"
            etiqueta="Rol"
            opciones={ROLES}
            valor={nuevo.rol}
            onChange={(rol) => setNuevo((n) => ({ ...n, rol }))}
          />
          <div className="flex justify-end gap-2 border-t pt-5">
            <Button
              type="button"
              variante="secundario"
              onClick={() => dialogo.current?.close()}
            >
              Cancelar
            </Button>
            <Button type="submit">Crear usuario</Button>
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
          <Field
            id="editar-email"
            label="Correo corporativo"
            hint="Si lo cambias, deberá confirmar el nuevo correo."
          >
            <Input
              id="editar-email"
              type="email"
              required
              value={edicion.email}
              onChange={(e) =>
                setEdicion((s) => ({ ...s, email: e.target.value }))
              }
            />
          </Field>
          <Field
            id="editar-clave"
            label="Nueva contraseña"
            hint="Déjala vacía para no cambiarla. Compártela por un canal seguro."
            error={edicion.error}
          >
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="editar-clave"
                  type={edicion.verClave ? "text" : "password"}
                  autoComplete="new-password"
                  value={edicion.clave}
                  onChange={(e) =>
                    setEdicion((s) => ({
                      ...s,
                      clave: e.target.value,
                      error: "",
                    }))
                  }
                  className="pr-10 font-mono"
                />
                <button
                  type="button"
                  onClick={() =>
                    setEdicion((s) => ({ ...s, verClave: !s.verClave }))
                  }
                  aria-label={
                    edicion.verClave
                      ? "Ocultar contraseña"
                      : "Mostrar contraseña"
                  }
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-1 flex size-9 -translate-y-1/2 items-center justify-center"
                >
                  {edicion.verClave ? (
                    <EyeOff className="size-4" aria-hidden />
                  ) : (
                    <Eye className="size-4" aria-hidden />
                  )}
                </button>
              </div>
              <Button
                type="button"
                variante="secundario"
                onClick={() =>
                  setEdicion((s) => ({
                    ...s,
                    clave: generarClave(),
                    verClave: true,
                    error: "",
                  }))
                }
              >
                <KeyRound className="size-4" aria-hidden />
                Generar
              </Button>
            </div>
          </Field>
          <div className="flex justify-end gap-2 border-t pt-5">
            <Button
              type="button"
              variante="secundario"
              onClick={() => dialogoEditar.current?.close()}
            >
              Cancelar
            </Button>
            <Button type="submit">Guardar cambios</Button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
