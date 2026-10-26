# ELOGIX — Roadmap de Implementación

## Estado Actual
> Última actualización: 2026-10-25

**Dónde vamos:** Fase 2 (setup) casi completa. El código compila (`lint`, `type-check`, `build` OK)
y la migración de BD pasa las pruebas RLS (`npm run db:test`). **Bloqueante para Fase 3:** confirmar
con el experto de TusDatos las preguntas de `ELOGIX_CONTEXT.md` §15, porque definen si se aplica el
cambio de modelo **Estudio → Consultas** (§14.3).

**Siguiente paso recomendado (en orden):**
1. ~~git init~~ ✅ hecho — repo `CALR0/elogix-app`, rama `main`.
2. Con las respuestas de §15: reescribir `supabase/migrations/20261025000000_init.sql` al modelo
   Estudio → Consultas (aún no se ha aplicado en ningún entorno) y actualizar `npm run db:test`.
3. Crear proyecto Supabase, `.env.local`, `supabase link` + `db push`, `npm run db:types`.
4. shadcn/ui + Route Handlers (webhook, cron, reportes) + `vercel.json`.

### Bitácora de sesiones

| Fecha | Sesión | Qué se hizo |
|-------|--------|-------------|
| 2026-10-25 | Fase 1 | Análisis de TusDatos API, contexto, arquitectura inicial, Next.js creado en `apps/web` |
| 2026-10-25 | Fase 2 (a) | Revisión de arquitectura (13 correcciones, ver contexto §13). Monorepo aplanado a la raíz, `docs/`. Migración + RLS + pruebas PGlite. SDK TusDatos reescrito. `env.ts`, `auth.ts`, clientes Supabase, `proxy.ts`, tokens de diseño, headers de seguridad |
| 2026-10-25 | Fase 2 (b) | Definido el objetivo de negocio (contexto §14), propuesta Estudio → Consultas (§14.3), preguntas para el experto TusDatos (§15). `CLAUDE.md` de arranque. Prueba RLS movida al repo (`scripts/test-rls.mjs`) |
| 2026-10-25 | Fase 2 (c) | Flujo de trabajo: todo en la nube (local → Supabase nube → Vercel), sin Docker. Git inicializado (`CALR0/elogix-app`). **App solo para Elogia:** eliminada la multi-organización y `is_platform_admin`; tabla `configuracion` global; 22 pruebas RLS |
| 2026-10-25 | Fase 2 (d) | Preguntas enviadas a Keyner (§15; la 7 ya respondida: usuarios = coordinadores de Elogia). SDK: PDF asíncrono (HTTP 202) con `fetchReport`/`fetchReportWhenReady`. Documentado qué entrega TusDatos y la propuesta de copiar el PDF solo al decidir (§14.4) |
| 2026-10-25 | Fase 2 (e) | Nueva dirección de diseño (contexto §8): corporativo, verde ecológico de Elogia, ambientado en transporte, sin Framer Motion ni glassmorphism, rendimiento para PCs lentos y móvil. Tokens de `globals.css` aún azules (pendiente) |
| 2026-10-25 | Fase 2 (f) | Logo guardado en `public/brand/elogia-logo.png` (salvia `#95A495`). Paleta §8.2 rehecha desde el logo con contrastes WCAG verificados. Pendiente: logo en SVG y favicon |
| 2026-10-25 | Fase 2 (g) | Paleta salvia aplicada en `globals.css` (claro + `.dark`, foco visible, reduced-motion). Inicio con logo, revisado en escritorio y móvil. `proxy.ts` deja ver la UI en desarrollo sin `.env.local` (en producción responde 503). `.claude/launch.json` para `npm run dev` |
| 2026-10-25 | Fase 2 (h) | Logo vectorizado a SVG, ícono de pestaña (hoja), pantalla de login moderna (panel de marca en escritorio, formulario mobile-first, mostrar/ocultar contraseña). `/` redirige a `/login`. Al ingresar aún no pasa nada (falta Supabase) |

---

## Fase 1 — Análisis y Documentación ✅ COMPLETADA

### Entregables
- [x] Análisis exhaustivo de TusDatos API (openapi.json — 336 KB, ~40 endpoints)
- [x] Documentación de todos los endpoints por categoría
- [x] Esquemas de request/response con ejemplos reales
- [x] Límites operacionales identificados (batch 2000, 3 lotes, 10 tokens, etc.)
- [x] Códigos de error documentados
- [x] Catálogo de ~261 fuentes de hallazgos
- [x] Arquitectura propuesta (Next.js + Supabase + Vercel) — revisada en Fase 2
- [x] Diseño de base de datos con RLS (multi-tenant descartado en Fase 2: app solo para Elogia)
- [x] Variables de entorno definidas
- [x] Sistema de roles y permisos
- [x] Identidad visual ELOGIX (paleta, tipografía, principios)
- [x] Decisiones de arquitectura confirmadas con el cliente

### Archivos creados
- `ELOGIX_CONTEXT.md` — Contexto técnico completo
- `ELOGIX_ROADMAP.md` — Este archivo
- `.env.example` — Template de variables de entorno (raíz)
- `openapi.json` — Spec oficial TusDatos API (existente)

---

## Fase 2 — Setup del Proyecto 🔄 EN CURSO

### Objetivos
Inicializar la app con todas las herramientas configuradas y listas para desarrollar.
Incluye la revisión de arquitectura de Fase 1 (ver `ELOGIX_CONTEXT.md` §13).

### Tareas
- [x] Next.js 16 + TypeScript + Tailwind v4 + App Router (Cache Components activado)
- [x] ~~Turborepo~~ → **descartado**: una sola app en la raíz del repo
- [x] Revisión de arquitectura y corrección del diseño de BD/flujo (§13 del contexto)
- [x] Migración inicial `supabase/migrations/20261025000000_init.sql` (orgs, profiles, solicitudes, solicitud_resultados, lotes, webhook_events, audit_logs, Storage)
- [x] RLS + grants por columna, validados con pruebas (PGlite)
- [x] `supabase/config.toml` local (signup público deshabilitado) + `seed.sql`
- [x] SDK tipado de TusDatos (`lib/tusdatos/`): factory por credenciales, timeout, `TusDatosError`, proxy de reportes, webhooks
- [x] `lib/env.ts` (Zod), `lib/supabase/{client,server,admin,proxy}.ts`, `proxy.ts`, `lib/auth.ts` (DAL)
- [x] Prettier (+ plugin Tailwind), scripts `type-check`, `format`, `db:*`
- [x] Design tokens (paleta ELOGIX + semáforo de hallazgos, nombres compatibles con shadcn), Inter, `lang="es"`
- [x] Security headers en `next.config.ts`
- [x] Inicializar git + primer commit (repo: github.com/CALR0/elogix-app)
- [x] Paleta "Salvia Elogia" (§8.2) aplicada en `app/globals.css` + logo en la página de inicio
- [ ] Instalar shadcn/ui (`npx shadcn@latest init`) y personalizarlo con esos tokens
- [ ] **(Tú)** Crear proyecto en Supabase y llenar `.env.local`
- [x] Repo en GitHub creado y git listo (falta tu `git push`)
- [ ] **(Tú, guiado)** Aplicar migración: `npx supabase link` + `npm run db:push` (sin BD local: todo contra la nube)
- [ ] Generar tipos: `npm run db:types` → tipar los clientes de Supabase
- [ ] Route Handlers: `/api/webhooks/tusdatos`, `/api/cron/sincronizar`, `/api/reportes/[id]` + `vercel.json` (cron)
- [ ] Husky + lint-staged (opcional, cuando haya git)

### Tiempo estimado: 2-3 días

---

## Fase 3 — Core Features ⏳ PENDIENTE

### Objetivos
Funcionalidades esenciales para que ELOGIX sea usable con el modelo de 2 roles.
**Meta de negocio:** el admin deja de digitar datos; recibe estudios con resultados listos y solo
decide (ver contexto §14). Las tareas marcadas *(§14)* salen de esa propuesta y dependen de §15.

### Tareas
- [ ] **Modelo Estudio → Consultas** *(§14.3)* — formularios por tipo de estudio (p.ej. conductor = persona + vehículo + propietario)
- [ ] **Envío automático** a TusDatos + ajuste global `requiere_confirmacion_envio` con confirmación en lote *(§14 P1-P2)*
- [ ] **Control de créditos:** duplicados, límite diario por usuario, alerta de saldo bajo *(§14 P3)*
- [ ] **Bandeja por riesgo** + aprobación en lote de "sin hallazgo" *(§14 P4)*
- [ ] **Revisor del admin:** vista propia con `report_json` + reporte oficial embebido; copia del PDF en Storage al aprobar/rechazar *(§14.4 P8)*
- [ ] **Decisión sugerida** por reglas, si el experto define criterios *(§14 P6)*
- [ ] Usuario ve el resultado final (Aprobado / Rechazado / En revisión), nunca hallazgos *(§14 P7)*
- [ ] **Auth**
  - [x] Pantalla de Login (diseño): panel de marca + formulario, responsive — `app/(auth)/login`
  - [ ] Conectar el login a Supabase Auth (`iniciarSesion` en `actions.ts` hoy no hace nada)
  - [ ] proxy.ts (sesión) + `requireUser`/`requireAdmin` por ruta
  - [ ] Recuperación de contraseña
  - [ ] Redireccionamiento por rol al hacer login:
    - `usuario` → `/solicitudes`
    - `admin` → `/dashboard`
- [ ] **Layout del Usuario**
  - [ ] Sidebar mínimo: Nueva Solicitud + Mis Solicitudes + Perfil
  - [ ] Navbar con nombre y rol del usuario
- [ ] **Layout del Admin**
  - [ ] Sidebar completo: Dashboard, Estudios, Batch, Usuarios, Auditoría, Monitoreo, Config
  - [ ] Badge de hallazgo en items del sidebar
- [ ] **Vista Usuario — Formulario de Solicitud**
  - [ ] Selector de tipo de documento con campos dinámicos
  - [ ] Soporte: CC, CE, NIT, PP, PPT, INT, NOMBRE, Vehículo
  - [ ] Validación Zod por tipo de documento
  - [ ] Pantalla de confirmación: "✅ Solicitud enviada exitosamente" + número de referencia
- [ ] **Vista Usuario — Mis Solicitudes**
  - [ ] Lista de solicitudes propias con estado (Enviada / En proceso / Finalizada)
  - [ ] SIN mostrar hallazgos ni resultados
- [ ] **Vista Admin — Dashboard**
  - [ ] KPIs: solicitudes, créditos, hallazgos por nivel
  - [ ] Gráfica de actividad (Recharts)
  - [ ] Feed de solicitudes recientes con badge de hallazgo
- [ ] **Vista Admin — Bandeja de Estudios**
  - [ ] Tabla con todos los estudios + filtros
  - [ ] Badge visual de hallazgo (🔴 Alto / 🟠 Medio / 🟡 Bajo / 🔵 Info / 🟢 Sin hallazgo)
- [ ] **Vista Admin — Revisor de Estudio**
  - [ ] Vista HTML embebida del reporte TusDatos
  - [ ] Descarga PDF
  - [ ] Botones Aprobar / Rechazar el estudio

### Tiempo estimado: 6-8 días

---

## Fase 4 — Features Avanzados ⏳ PENDIENTE

### Tareas
- [ ] **Batch Processing**
  - [ ] Template CSV/Excel descargable
  - [ ] Upload con validación del archivo
  - [ ] Preview antes de enviar
  - [ ] Monitor de progreso en tiempo real
  - [ ] Exportar resultados a Excel
  - [ ] Historial de lotes
- [ ] **Webhooks**
  - [ ] Receptor de webhooks TusDatos (`/api/webhooks/tusdatos`)
  - [ ] Procesador de eventos (individualCompleted, batch, pepsMonitoring, reportApprovalChanged)
  - [ ] Configuración de webhook propio (UI + API)
  - [ ] Log de eventos recibidos
- [ ] **Historial Completo**
  - [ ] Tabla con TanStack Table (ordenamiento, filtros, paginación)
  - [ ] Filtros: fecha, tipo doc, usuario, hallazgo, estado
  - [ ] Búsqueda por documento o nombre
  - [ ] Exportar selección a CSV/Excel
- [ ] **Monitoreo de Fuentes**
  - [ ] Estado operativo en tiempo real (GET /api/v1/sources/status)
  - [ ] Alertas de PEPs monitoring
  - [ ] Log de webhooks recibidos

### Tiempo estimado: 7-10 días

---

## Fase 5 — Gestión de Usuarios y Configuración ⏳ PENDIENTE

> Multi-tenant y super-admin **descartados**: ELOGIX es solo para Elogia.

### Tareas
- [ ] Vista de uso y créditos de la cuenta TusDatos
- [ ] Gestión de usuarios (admin)
  - [ ] Invitar usuarios por email
  - [ ] Asignar/cambiar roles
  - [ ] Desactivar usuarios
- [ ] Alertas de créditos bajos

### Tiempo estimado: 4-5 días

---

## Fase 6 — Polish & Deploy ⏳ PENDIENTE

### Tareas
- [ ] Testing
  - [ ] Unit tests con Vitest
  - [ ] E2E con Playwright (flujo principal de validación)
- [ ] Performance
  - [ ] Optimización de imágenes (Next.js Image)
  - [ ] Lazy loading de componentes pesados
  - [ ] Caché de respuestas TusDatos frecuentes
- [ ] Deploy
  - [ ] Configurar proyecto en Vercel
  - [ ] Variables de entorno en Vercel
  - [ ] Dominio personalizado
  - [ ] Preview deployments automáticos
- [ ] Documentación
  - [ ] README del proyecto
  - [ ] Guía de uso para usuarios y admin
  - [ ] Documentación de API interna

### Tiempo estimado: 3-4 días

---

## Resumen de Timeline

| Fase | Descripción | Estado | Tiempo |
|------|-------------|--------|--------|
| 1 | Análisis y Documentación | ✅ Completada | 1 día |
| 2 | Setup del Proyecto | 🔄 En curso | 2-3 días |
| 3 | Core Features (formulario usuario + revisor admin) | ⏳ Pendiente | 6-8 días |
| 4 | Gestión de usuarios + Auditoría + Batch + Webhooks | ⏳ Pendiente | 8-10 días |
| 5 | Gestión de usuarios y configuración | ⏳ Pendiente | 2-3 días |
| 6 | Polish y Deploy | ⏳ Pendiente | 3-4 días |
| **Total** | | | **~24-31 días** |

---

## Dependencias Externas Requeridas

| Servicio | Propósito | Acción requerida |
|----------|-----------|------------------|
| **Supabase** | BD, Auth, Realtime | Crear proyecto en supabase.com |
| **Vercel** | Deploy | Conectar repositorio |
| **TusDatos** | API de validaciones | Proporcionar credenciales (email + password o API token) |
| **Google Fonts** | Tipografía Inter | Configurado automáticamente |

---

*Roadmap actualizado: 2026-10-25 | Versión: 1.2 — Fase 2: revisión de arquitectura y setup base*
