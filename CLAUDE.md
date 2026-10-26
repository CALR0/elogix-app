@AGENTS.md

# ELOGIX — Guía de arranque para Claude

Plataforma web **de uso exclusivo de Elogia** Soluciones Logísticas (no es multi-empresa) para
estudios de antecedentes (conductores, vehículos, personas, empresas) sobre la API de TusDatos.
Roles: `usuario` (envía la información) y `admin` (la persona de Elogia que revisa y decide). El usuario y el equipo hablan español:
responde, comenta el código y escribe la documentación en español.

## Lee primero
1. `docs/ELOGIX_ROADMAP.md` → "Estado Actual": dónde vamos, siguiente paso y bitácora de sesiones.
2. `docs/ELOGIX_CONTEXT.md` §14 (objetivo de negocio), §15 (preguntas abiertas con el experto de
   TusDatos), §13 (qué se corrigió del diseño original), §3 (BD y RLS).
3. `docs/openapi.json` es la spec oficial de TusDatos: verifica ahí cualquier endpoint o esquema
   antes de usarlo; no lo inventes.

## Al terminar una sesión
Actualiza "Estado Actual" y la bitácora en `docs/ELOGIX_ROADMAP.md`, y el contexto si cambió una
decisión. El proyecto se trabaja desde varios computadores: esos documentos son la memoria compartida.

## Stack y comandos
- Next.js 16 (App Router, Cache Components, `proxy.ts` en lugar de middleware) + React 19 + TS.
  Es distinto de Next 15: consulta `node_modules/next/dist/docs/` antes de usar una API.
- Supabase (Auth, Postgres + RLS, Realtime, Storage) · Tailwind v4 · Vercel. Gestor: **npm**.
- `npm run dev` · `lint` · `type-check` · `build` · `format`
- `npm run db:test` — chequeo rápido: aplica la migración en Postgres embebido (PGlite) y prueba RLS.
  Corre antes de `db:push` para no subir permisos rotos a la nube.
- `npm run db:push` / `db:types` — migraciones y tipos contra el Supabase en la nube (`supabase link` previo).

## Flujo de trabajo (decidido por el usuario)
- **Todo en la nube, sin Docker ni BD local.** El frontend corre local (`npm run dev`) apuntando
  al proyecto Supabase del usuario vía `.env.local`; después se conecta Vercel. Guía al usuario
  paso a paso en la configuración de Supabase y Vercel.
- Las pruebas se hacen con datos reales: cada consulta a TusDatos **gasta créditos**. Avisa antes
  de cualquier acción que lance consultas.
- El usuario crea el repo en GitHub y hace el push él mismo.

## Reglas que no se negocian
- El rol `usuario` **nunca** ve hallazgos ni reportes. Se garantiza en la BD: los resultados viven
  en una tabla con RLS solo-admin. RLS filtra filas, no columnas: nunca pongas datos de resultado en
  una tabla que el usuario pueda leer.
- Credenciales de TusDatos y `SUPABASE_SECRET_KEY` solo en servidor (`import "server-only"`).
  El navegador nunca llama a TusDatos; los reportes HTML/PDF pasan por un Route Handler que verifica admin.
- Autorización en tres capas: `proxy.ts` (optimista) → `lib/auth.ts` (`requireUser`/`requireAdmin`
  en cada página, Server Function y Route Handler) → RLS.
- Nada de polling en background: estados por webhook (`webhook_reference` = id propio) + cron de reconciliación.
- La aprobación final de un estudio es siempre humana (admin).
- Si cambias la migración, actualiza y corre `npm run db:test`.

## Diseño UI/UX (ver contexto §8)
- Corporativo, serio y elegante; gama **verde ecológica de Elogia**, ambientado en transporte/logística.
  Nada genérico (no el look por defecto de shadcn) ni infantil; sin emojis en la interfaz.
- Rápido en PCs lentos y móvil: Server Components por defecto, sin Framer Motion ni glassmorphism,
  transiciones CSS cortas, gráficas con carga diferida, paginación en servidor. Mobile-first.
- El semáforo de hallazgos siempre lleva icono + texto, nunca solo color.
- Logo: `public/brand/elogia-logo.svg` (y `.png`), salvia `#95A495`; ícono en `app/icon.svg`. El salvia no sirve para texto/botones
  sobre blanco: usar los tonos oscuros de la paleta §8.2 (`#517051` primario).

## Mapa del código
- `lib/env.ts` — variables de servidor validadas con Zod (perezoso, no rompe el build).
- `lib/auth.ts` — Data Access Layer (`getCurrentUser`, `requireUser`, `requireAdmin`, `homePathFor`).
- `lib/supabase/` — `client.ts` (navegador), `server.ts` (RSC/acciones), `admin.ts` (ignora RLS), `proxy.ts`.
- `lib/tusdatos/` — SDK tipado; `createTusDatosClient(credenciales)` o `getTusDatos()` (cuenta Elogia).
- `supabase/migrations/` — esquema + RLS. Aún no aplicada en ningún entorno: se puede reescribir.
- `scripts/test-rls.mjs` — pruebas de RLS.
- `lib/solicitudes/` — `schemas.ts` (Zod de los dos módulos, se reutiliza en servidor), `estados.ts`
  (estados que ve el usuario), `mock.ts` (datos de ejemplo de las maquetas: reemplazar por Supabase).
- `components/ui/` — componentes propios livianos (botón, campos, pastillas). `components/solicitudes/`
  y `components/usuario/` — piezas de la sección del usuario.
- `lib/estudios/mock.ts`, `lib/auditoria/mock.ts` — datos de ejemplo del admin (estudios, usuarios, auditoría).
- `components/ui/paginacion.tsx` — paginación (5 por página por defecto). Hoy en el cliente; con Supabase, en servidor con `?pagina=`.
- `lib/demo.ts` — `MODO_DEMO`: accesos de prueba en el login. Quitar al conectar Supabase Auth.
- Rutas: usuario `/inicio`, `/solicitudes`, `/solicitudes/nueva/{documento,vehiculo}`; admin `/dashboard`, `/estudios`, `/estudios/[numero]`, `/usuarios`, `/auditoria`.
- `components/admin/` — piezas del admin (badges del semáforo, menú, bandeja, decisión, usuarios).
- `app/(auth)/login`, `app/(usuario)/**` y `app/(admin)/**` — hoy son **maquetas** (sin Supabase).
- Fechas: usar `fechaCorta` de `lib/utils.ts` (no `Intl`: rompe la hidratación). Rutas con parámetros
  dinámicos leen `params` dentro de `<Suspense>`; componentes con `usePathname` en layouts, también.
