# ELOGIX — Plataforma de Validaciones
> Elogia Soluciones Logísticas · Powered by TusDatos API

## Stack
- **Next.js 16** (App Router, Cache Components, `proxy.ts`) + TypeScript
- **Supabase** (Auth, PostgreSQL + RLS, Realtime, Storage)
- **Tailwind CSS v4** + shadcn/ui
- **Vercel** (Deploy + Cron)

## Estructura
```
app/                → Rutas (App Router)
lib/                → env, auth (DAL), clientes Supabase, SDK TusDatos
proxy.ts            → Refresco de sesión y redirect a /login
supabase/           → config local, migraciones (esquema + RLS) y seed
docs/               → ELOGIX_CONTEXT.md, ELOGIX_ROADMAP.md, openapi.json
.env.example        → Variables de entorno requeridas
```

## Inicio rápido

```bash
npm install
cp .env.example .env.local   # completar credenciales
npm run dev
```

Base de datos (proyecto Supabase en la nube):

```bash
npx supabase link --project-ref <ref>
npx supabase db push
```

## Scripts
| Script | Uso |
|--------|-----|
| `npm run dev` / `build` / `start` | Next.js |
| `npm run lint` · `type-check` · `format` | Calidad |
| `npm run db:test` | Chequeo rápido de permisos (RLS) antes de subir una migración. No toca la nube |
| `npm run db:push` | Aplica las migraciones al proyecto Supabase enlazado |
| `npm run db:types` | Genera tipos TypeScript desde el Supabase enlazado |

## Flujo de trabajo
No hay base de datos local ni Docker. El frontend corre local (`npm run dev`) y apunta al proyecto
Supabase en la nube vía `.env.local`; luego se despliega en Vercel con las mismas variables.
Las consultas a TusDatos son reales y **consumen créditos**.

## Continuar en otro computador
1. Copia la carpeta **sin** `node_modules/` ni `.next/` (o, mejor, usa git).
2. `npm install`, luego `npm run db:test` y `npm run build` para comprobar que todo está bien.
3. Abre Claude Code en la carpeta: `CLAUDE.md` le indica qué leer y dónde va el proyecto.

## Roles
- **`usuario`** — Ingresa solicitudes de validación, ve solo el estado
- **`admin`** — Revisa resultados, hallazgos, reportes; gestiona usuarios y configuración
- **`is_platform_admin`** — Equipo Elogia, administra todas las organizaciones

## Documentación
- [`docs/ELOGIX_CONTEXT.md`](./docs/ELOGIX_CONTEXT.md) — documentación técnica (§13: revisión de arquitectura de Fase 2)
- [`docs/ELOGIX_ROADMAP.md`](./docs/ELOGIX_ROADMAP.md) — roadmap por fases
