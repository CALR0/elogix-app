# ELOGIX — Roadmap de Implementación

## Estado Actual
> Última actualización: 2026-10-28

**Dónde vamos:** la app **funciona de punta a punta con Supabase real en modo simulado**
(`TUSDATOS_MODO=simulado`: nada sale a TusDatos ni gasta créditos). Probado por el usuario: login por rol,
gestión de usuarios, consultas del usuario (documento y vehículo con remolque), revisión y decisión del
admin, decisión + comentario visibles para el usuario, tiempo real y auditoría real.
**Lo que falta es conectar la API real de TusDatos** (no hay API key todavía) y validarlo con consultas
reales: está detallado archivo por archivo en **`ELOGIX_CONTEXT.md` §16**.

**Supabase:** proyecto `skdrzcxknnjpylwhllgi`, sin terminal (las migraciones se pegan en el SQL Editor).
Migraciones aplicadas: `init`, `detalle_resultados`, `decision_visible_usuario`. **Pendiente de confirmar:**
`20261028010000_auditoria_tiempo_real.sql` (sin ella la Auditoría funciona, pero no se actualiza sola).

**Siguiente paso recomendado (en orden):**
1. Confirmar que se pegó la migración `auditoria_tiempo_real` y probar Auditoría en vivo con dos sesiones.
2. Respuestas pendientes de Keyner (contexto §15: preguntas 2, 3, 4, 5, 9, 10, 11): datos/adjuntos de
   entrada, criterios de decisión, costo de reconsultas, aprobación dentro de TusDatos, permisos del
   usuario, tipos INT/NOMBRE, conductor/tenedor en la consulta combinada.
3. **Con API key** (generarla con `POST /api/v1/auth/token`, ver la respuesta de cómo hacerlo en Postman):
   implementar el modo real siguiendo §16.3 en este orden: lanzar (paso 2) → cola de 5 s (3) → mapear
   el resultado real (4) → webhook (5) → cron (6) → reintento real (7) → ver reporte/PDF (8) →
   copia del PDF al decidir (9) → evidencias y adjuntos (10) → créditos y fuentes en el panel (11).
   ⚠️ Cada prueba gasta créditos: avisar al usuario antes y probar con muy pocas consultas.
4. Validar con consultas reales los puntos de §16.2 (formato de respuestas, nombres de fuentes, webhook,
   consulta combinada, reporte/PDF con 202, evidencias, créditos).
5. Antes de producción (§16.3 pasos 12-13): borrar solicitudes simuladas, rotar la secret key,
   desplegar en Vercel con sus variables y el Site URL de Auth, `NEXT_PUBLIC_MODO_DEMO=false`.
6. Fase 4 (lotes desde Excel, monitoreo de fuentes/PEPs, alertas de créditos) y Fase 6 (pruebas
   automáticas, rendimiento, guía de uso).

**Ya no son maqueta:** ninguna pantalla. Todas leen Supabase. Solo es simulado el procesamiento de TusDatos
(`lib/tusdatos/simulador.ts`) y las tarjetas de créditos/fuentes del panel.

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
| 2026-10-25 | Fase 2 (i) | Login de escritorio rediseñado: fondo verde de marca con líneas de ruta, tarjeta del formulario a la izquierda y a la derecha el recorrido del estudio como itinerario de viaje (Origen → En ruta → Destino). Título "Iniciar sesión" centrado, sin subtítulo. Revisado en 1440, 1024 y móvil |
| 2026-10-26 | Fase 3 (a) | Keyner confirmó: **dos módulos** (documento → `/api/launch`, vehículo → `/api/launch/car`, verificado en la spec), envío automático, usuario sin resultados, reintento gratis de fuentes con error (`/api/retry`), 5 s entre lanzamientos (contexto §14.5). Descartado Estudio → Consultas. **Maquetas del usuario**: layout (barra superior/inferior), inicio con los dos módulos, formularios con Zod y estados de éxito/error, placa estilo colombiano, Mis solicitudes con filtros. Componentes propios livianos en `components/ui` |
| 2026-10-26 | Fase 3 (b) | **Maquetas del admin**: layout con menú lateral de marca, panel (KPIs y gráficas en CSS puro), bandeja ordenada por riesgo con aprobación en lote, revisor de estudio (hallazgos, fuentes, reintento, decisión con comentario obligatorio al rechazar, historial), usuarios (crear, rol, activar). Corregido error de hidratación en fechas (`fechaCorta` ahora en `lib/utils.ts`, sin `Intl`). Revisor lee `params` dentro de `<Suspense>` y los menús con `usePathname` también (Cache Components + Partial Prefetching) |
| 2026-10-26 | Fase 3 (c) | Accesos de prueba en el login. Inicio del usuario en `/inicio` y Mis solicitudes en `/solicitudes`. Paginación reutilizable (`components/ui/paginacion.tsx`, 5 por página) en Mis solicitudes y bandeja de estudios; máx. 5 en recientes y en "Requieren atención". Usuarios: editar correo y contraseña. Nueva pantalla **Auditoría** (`/auditoria`) con filtros, paginación de 10 y exportar CSV |
| 2026-10-26 | Fase 3 (d) | Keyner: cabezote y remolque tienen placas y propietarios distintos → TusDatos lo cubre con la **consulta combinada** (`/api/v1/batches/launch/vehicle_combo`), documentado en contexto §14.6. Maqueta: opción "Lleva remolque o tráiler" en consulta por vehículo. Panel admin reorganizado en filas balanceadas ("Requieren atención" ya no se estira; ~670 → 363 px) |
| 2026-10-26 | Fase 3 (e) | Usuarios: buscador + paginación de 5 y nuevo texto descriptivo. Login: quitado el rótulo superior; pie "[año] © Elogia Soluciones Logísticas" visible en todos los tamaños, con el año calculado por `"use cache"` + `cacheLife("days")` (Cache Components no permite `new Date()` en el prerender). Paginación con singular/plural |
| 2026-10-27 | Fase 3 (f) | Inicio de la integración. Migración: columnas del remolque (`placa_remolque`, `tipo_doc_propietario_remolque`, `documento_propietario_remolque`), `tusdatos_batch_id` y `simulada`; 6 pruebas RLS nuevas (28 en total). `lib/env.ts`: `TUSDATOS_MODO` (`simulado` por defecto; credenciales, webhook y cron solo obligatorios en `real`), variables vacías tratadas como no definidas. `getTusDatos()` bloquea llamadas reales en modo simulado. Guía de creación de Supabase entregada al usuario |
| 2026-10-27 | Fase 3 (g) | **Integración 1: auth y usuarios.** Login real con Supabase Auth (`signInWithPassword`, mensaje genérico, cuentas desactivadas bloqueadas), cerrar sesión, redirección por rol. `<ChipSesion>` en los layouts (dentro de Suspense) exige sesión / rol admin (403). Usuarios: datos reales (`lib/usuarios/datos.ts`) y Server Functions (`app/(admin)/usuarios/acciones.ts`): crear con contraseña inicial, cambiar rol, activar/desactivar (perfil + bloqueo en Auth), editar correo/contraseña; el admin no puede desactivarse ni quitarse el rol. Auditoría real (`lib/auditoria.ts`). Accesos de prueba solo sin Supabase. Verificado: rutas sin sesión → /login; login con credenciales falsas rechazado contra el Supabase real |
| 2026-10-27 | Fase 3 (h) | Fix: `connection()` en `getCurrentUser` (Supabase usa `Date.now()`; Cache Components no lo permite al prerenderizar). **Integración 2: solicitudes en modo simulado.** Usuario: `crearConsultaDocumento`/`crearConsultaVehiculo`/`reintentarEnvio` (`app/(usuario)/solicitudes/acciones.ts`) insertan con la sesión del usuario (RLS) y lanzan; `/inicio` y `/solicitudes` con datos reales. Sistema: `lib/solicitudes/procesar.ts` + `lib/tusdatos/simulador.ts` (resultado determinista por documento, ~25 % con fuente caída, documentos terminados en 000 simulan fallo de envío; resultado con `after()` a los 8 s). Admin: `lib/estudios/datos.ts` (estudios + autor + resultado + historial desde `audit_logs`), bandeja, revisor (decidir, reabrir, reintentar), aprobación en lote, panel y contador del menú reales; acciones en `app/(admin)/estudios/acciones.ts` con la sesión del admin. Migración nueva `20261027000000_detalle_resultados.sql` (nombre consultado, hallazgos, reintentos). Eliminados los datos de ejemplo de solicitudes y estudios |
| 2026-10-28 | Fase 3 (i) | **Tiempo real:** `components/sesion/refresco-en-vivo.tsx` (Supabase Realtime con el token del usuario → respeta RLS; agrupa cambios y hace `router.refresh()`), montado en los layouts (admin: `solicitudes` + `solicitud_resultados`; usuario: `solicitudes`). Bandeja ahora deriva la lista de los datos del servidor. **Decisión visible para el usuario:** migración `20261028000000_decision_visible_usuario.sql` (columnas `decision`, `decision_comentario`, `decision_at` en `solicitudes` + trigger desde `solicitud_resultados`); el usuario ve Enviada → En proceso → En revisión → Aprobada/Rechazada con el comentario; filtros y contadores por etapa; aviso al admin de que el comentario lo verá el usuario. 3 pruebas RLS nuevas (31). **Login** conserva el correo tras un error (verificado) |
| 2026-10-28 | Fase 3 (j) | **Auditoría real y en vivo:** `lib/auditoria/datos.ts` lee `audit_logs` (actor, SOL- de la solicitud, nombre del usuario afectado) y traduce cada acción a una frase; `/auditoria` con `<RefrescoEnVivo tablas=["audit_logs"]>`; migración `20261028010000_auditoria_tiempo_real.sql` (publica `audit_logs` en Realtime). Verificado contra la base real: 44 eventos de 14 tipos. Eliminados los últimos datos de ejemplo. **Documentación de cierre:** contexto §16 (qué funciona, qué validar con la API real y qué cambiar archivo por archivo) y nuevo Estado Actual |

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
- [x] Migración inicial `supabase/migrations/20261025000000_init.sql` (profiles, configuracion, solicitudes, solicitud_resultados, lotes, webhook_events, audit_logs, Storage) — sin multi-organización
- [x] RLS + grants por columna, validados con pruebas (PGlite)
- [x] `supabase/config.toml` local (signup público deshabilitado) + `seed.sql`
- [x] SDK tipado de TusDatos (`lib/tusdatos/`): factory por credenciales, timeout, `TusDatosError`, proxy de reportes, webhooks
- [x] `lib/env.ts` (Zod), `lib/supabase/{client,server,admin,proxy}.ts`, `proxy.ts`, `lib/auth.ts` (DAL)
- [x] Prettier (+ plugin Tailwind), scripts `type-check`, `format`, `db:*`
- [x] Design tokens (paleta ELOGIX + semáforo de hallazgos, nombres compatibles con shadcn), Inter, `lang="es"`
- [x] Security headers en `next.config.ts`
- [x] Inicializar git + primer commit (repo: github.com/CALR0/elogix-app)
- [x] Paleta "Salvia Elogia" (§8.2) aplicada en `app/globals.css` + logo en la página de inicio
- [x] ~~shadcn/ui~~ → por ahora **componentes propios livianos** en `components/ui` (más rápidos en PCs lentos); se puede sumar shadcn si se necesita algo complejo
- [ ] **(Tú)** Crear proyecto en Supabase y llenar `.env.local`
- [x] Repo en GitHub creado y con push
- [ ] **(Tú, guiado)** Aplicar migración: `npx supabase link` + `npm run db:push` (sin BD local: todo contra la nube)
- [ ] Generar tipos: `npm run db:types` → tipar los clientes de Supabase
- [ ] Route Handlers: `/api/webhooks/tusdatos`, `/api/cron/sincronizar`, `/api/reportes/[id]` + `vercel.json` (cron) — detalle en contexto §16.3 (pasos 5, 6, 8)
- [ ] Husky + lint-staged (opcional, cuando haya git)

### Tiempo estimado: 2-3 días

---

## Fase 3 — Core Features 🔄 EN CURSO (integrada en modo simulado; falta la API real, ver contexto §16)

### Objetivos
Funcionalidades esenciales para que ELOGIX sea usable con el modelo de 2 roles.
**Meta de negocio:** el admin deja de digitar datos; recibe estudios con resultados listos y solo
decide (ver contexto §14). Las tareas marcadas *(§14)* salen de esa propuesta y dependen de §15.

### Tareas
- [x] ~~Modelo Estudio → Consultas~~ — descartado: dos módulos independientes (contexto §14.5)
- [ ] **Envío automático** a TusDatos al registrar *(§14.5)*, encolado con 5 s entre lanzamientos
- [ ] **Reintento automático gratis** de fuentes con error (`/api/retry`, máx. 3) + reintento manual del admin *(§14.5)*
- [ ] **Control de créditos:** duplicados, límite diario por usuario, alerta de saldo bajo *(§14 P3)*
- [ ] **Bandeja por riesgo** + aprobación en lote de "sin hallazgo" *(§14 P4)*
- [ ] **Revisor del admin:** vista propia con `report_json` + reporte oficial embebido; copia del PDF en Storage al aprobar/rechazar *(§14.4 P8)*
- [ ] **Decisión sugerida** por reglas, si el experto define criterios *(§14 P6)*
- [x] Usuario solo ve "enviada" + estado o error con "Intentar de nuevo"; nunca resultados *(§14.5)* — en maqueta
- [ ] **Auth**
  - [x] Pantalla de Login (diseño): panel de marca + formulario, responsive — `app/(auth)/login`
  - [ ] Conectar el login a Supabase Auth (`iniciarSesion` en `actions.ts` hoy no hace nada)
  - [ ] proxy.ts (sesión) + `requireUser`/`requireAdmin` por ruta
  - [ ] Recuperación de contraseña
  - [ ] Redireccionamiento por rol al hacer login:
    - `usuario` → `/inicio`
    - `admin` → `/dashboard`
- [x] **Layout del Usuario** (maqueta) — `app/(usuario)/layout.tsx`: barra superior en PC, barra inferior en celular
  - [ ] Datos reales del perfil con `requireUser()` y cerrar sesión real
- [x] **Layout del Admin** (maqueta) — `app/(admin)/layout.tsx`: menú lateral verde de marca (Panel, Estudios con contador, Usuarios), barra inferior en celular
  - [ ] Más secciones cuando se construyan: Configuración, Lotes
- [x] **Vista Usuario — Inicio** (maqueta) — `/inicio`: los dos módulos, resumen y las 5 solicitudes más recientes
- [x] **Vista Usuario — Consulta por documento** (maqueta) — CC, CE, PPT, PP, NIT; campos dinámicos; Zod (`lib/solicitudes/schemas.ts`); pantallas de éxito (SOL-000149) y de error con "Intentar de nuevo"
- [x] **Vista Usuario — Consulta por vehículo** (maqueta) — placa con estilo de placa colombiana + documento del propietario; opción **remolque/tráiler** con su placa (R/S + 5 dígitos) y su propietario (contexto §14.6)
- [ ] Envío del vehículo con remolque por la **consulta combinada** (lote `vehicle_combo`, agrupado; webhook `batch`) + columnas del remolque en `solicitudes`
- [x] **Vista Usuario — Mis solicitudes** (maqueta) — `/solicitudes`: paginación de 5, filtros, búsqueda, tabla en PC y tarjetas en celular, "Reintentar" en las no enviadas
- [ ] Conectar las vistas del usuario a Supabase: Server Function `crearSolicitud` (reemplaza `simularEnvio`) y lista real paginada en servidor
- [x] **Vista Admin — Panel** (maqueta) — `/dashboard`: KPIs (por revisar, en proceso, con error, créditos), "Requieren atención", hallazgos del mes, actividad 14 días y estado de fuentes. Gráficas en CSS puro (sin Recharts)
- [x] **Vista Admin — Bandeja de estudios** (maqueta) — `/estudios`: paginación de 5, pestañas con contadores, búsqueda, orden por riesgo, semáforo icono + texto, aprobación en lote de "sin hallazgo"
- [x] **Vista Admin — Revisor** (maqueta) — `/estudios/[numero]`: hallazgos por nivel, fuentes consultadas, aviso de fuentes con error + reintentar, decisión (rechazar exige comentario), reporte oficial y PDF (botones aún inactivos), historial
- [x] **Vista Admin — Usuarios** (maqueta) — `/usuarios`: crear (diálogo), cambiar rol, activar/desactivar, **editar correo y contraseña** (generar contraseña temporal), buscador por nombre o correo y paginación de 5
- [x] **Vista Admin — Auditoría** (maqueta) — `/auditoria`: todos los eventos (sesiones, solicitudes, estudios, usuarios, configuración, sistema), filtros por categoría, usuario y errores, búsqueda, paginación de 10, exportar CSV
- [x] **Accesos de prueba** en el login (Usuario / Administrador) — `lib/demo.ts`, solo en desarrollo o con `NEXT_PUBLIC_MODO_DEMO=true`. ⚠️ Quitar al conectar Supabase Auth
- [ ] Conectar las vistas del admin a Supabase + proxy del reporte HTML/PDF (`/api/reportes/[id]`)

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
| 2 | Setup del Proyecto | 🔄 Falta Supabase, rutas API y cron | 2-3 días |
| 3 | Core Features (formulario usuario + revisor admin) | 🔄 Integrada en simulado; falta API real (§16) | 6-8 días |
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
