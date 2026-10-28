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
3. **Fase 4, con API key** (generarla con `POST /api/v1/auth/token`, ver la respuesta de cómo hacerlo en Postman):
   implementar el modo real siguiendo §16.3 en este orden: lanzar (paso 2) → cola de 5 s (3) → mapear
   el resultado real (4) → webhook (5) → cron (6) → reintento real (7) → ver reporte/PDF (8) →
   copia del PDF al decidir (9) → evidencias y adjuntos (10) → créditos y fuentes en el panel (11).
   ⚠️ Cada prueba gasta créditos: avisar al usuario antes y probar con muy pocas consultas.
4. Validar con consultas reales los puntos de §16.2 (formato de respuestas, nombres de fuentes, webhook,
   consulta combinada, reporte/PDF con 202, evidencias, créditos).
5. Antes de producción (§16.3 pasos 12-13): borrar solicitudes simuladas, rotar la secret key,
   desplegar en Vercel con sus variables y el Site URL de Auth, `NEXT_PUBLIC_MODO_DEMO=false`.
6. Fase 5 (adjuntos, configuración, control de créditos, lotes desde Excel, monitoreo) y Fase 6
   (producción en Vercel, pruebas automáticas, rendimiento, guía de uso).

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
| 2026-10-28 | Fase 3 (k) | Roadmap auditado contra el código: fases 2 y 3 marcadas completas, tareas ya hechas cerradas, pendientes reorganizados en Fase 4 (conexión real con TusDatos), Fase 5 (complementarias) y Fase 6 (producción). Pantalla de carga a pantalla completa (`components/ui/pantalla-carga.tsx`) al **iniciar sesión** (verificada) y al **cerrar sesión** (`components/sesion/boton-cerrar-sesion.tsx` con `useFormStatus`) |

---

## Fase 1 — Análisis y Documentación ✅ COMPLETADA (2026-10-25)

- [x] Análisis de la API de TusDatos (`docs/openapi.json`, ~40 endpoints, límites y errores)
- [x] Arquitectura (Next.js + Supabase + Vercel), roles, identidad visual y decisiones con el cliente
- [x] Contexto técnico (`docs/ELOGIX_CONTEXT.md`) y este roadmap

---

## Fase 2 — Setup del Proyecto ✅ COMPLETADA (2026-10-25 → 27)

- [x] Next.js 16 + TypeScript + Tailwind v4 + App Router (Cache Components y Partial Prefetching)
- [x] ~~Turborepo~~ descartado: una sola app en la raíz
- [x] Revisión de arquitectura de la Fase 1 (13 correcciones, contexto §13)
- [x] Migración inicial con RLS y grants por columna + pruebas sin Docker (`npm run db:test`)
- [x] SDK tipado de TusDatos (`lib/tusdatos/`), `lib/env.ts`, clientes Supabase, `proxy.ts`, `lib/auth.ts`
- [x] Prettier, scripts, security headers, git + GitHub (`CALR0/elogix-app`)
- [x] Paleta "Salvia Elogia", logo SVG, ícono, componentes propios livianos (sin shadcn)
- [x] Proyecto Supabase creado (`skdrzcxknnjpylwhllgi`), registro público desactivado, `.env.local`
- [x] Migraciones aplicadas **sin terminal** (pegadas en el SQL Editor; no se usa `supabase link`)
- [ ] *(Opcional)* `npm run db:types` para tipar los clientes de Supabase (hoy sin tipos generados)
- [ ] *(Opcional)* Husky + lint-staged

---

## Fase 3 — Funcionalidad completa en modo simulado ✅ COMPLETADA (2026-10-26 → 28)

Todo funciona con Supabase real; solo la consulta a TusDatos está simulada (contexto §14.7).

**Autenticación y sesión**
- [x] Login con Supabase Auth, mensaje genérico, cuentas desactivadas bloqueadas, correo conservado tras error
- [x] Cerrar sesión, redirección por rol (`usuario` → `/inicio`, `admin` → `/dashboard`)
- [x] Protección en tres capas: `proxy.ts` → `requireUser`/`requireAdmin` (403) → RLS
- [ ] Recuperación de contraseña (hoy el admin la restablece desde Usuarios) → Fase 5

**Usuario**
- [x] `/inicio`: módulos, contadores por etapa y 5 recientes
- [x] Consulta por documento (CC, CE, PPT, PP, NIT) y por vehículo con **remolque** opcional, validadas con Zod
- [x] Envío con referencia SOL-, error con "Intentar de nuevo" sobre la misma solicitud
- [x] `/solicitudes`: filtros por etapa, búsqueda, paginación de 5
- [x] Ve Enviada → En proceso → En revisión → **Aprobada / Rechazada** + comentario del admin (nunca hallazgos)

**Admin**
- [x] `/dashboard`: KPIs, "Requieren atención" (máx. 5), hallazgos del mes, actividad 14 días
- [x] `/estudios`: bandeja por riesgo, pestañas, búsqueda, paginación de 5, aprobación en lote de "sin hallazgo"
- [x] `/estudios/[numero]`: hallazgos, fuentes, reintento de fuentes con error, decidir/reabrir, historial
- [x] `/usuarios`: crear con contraseña inicial, rol, activar/desactivar, editar correo/contraseña, buscador, paginación
- [x] `/auditoria`: todos los eventos reales con frases legibles, filtros, CSV
- [x] **Tiempo real** (Supabase Realtime) en estudios, panel, contador, solicitudes del usuario y auditoría

**Sistema**
- [x] Simulador de TusDatos y procesamiento con `after()`; solicitudes marcadas `simulada`
- [x] Auditoría de todas las acciones (`registrarAuditoria`)
- [x] Migraciones: `init`, `detalle_resultados`, `decision_visible_usuario`, `auditoria_tiempo_real`; 31 pruebas RLS

---

## Fase 4 — Conexión real con TusDatos 🔜 SIGUIENTE (requiere API key)

Guía paso a paso, archivo por archivo: **contexto §16.3**. ⚠️ Cada prueba gasta créditos: avisar antes.

- [ ] Generar el token (`POST /api/v1/auth/token`), `TUSDATOS_MODO=real`, `TUSDATOS_WEBHOOK_TOKEN`, `CRON_SECRET`
- [ ] Lanzar la consulta real (`lanzarConsulta` en `lib/solicitudes/procesar.ts`) con `webhook_reference` = id
- [ ] Cola con 5 s entre lanzamientos (nunca en paralelo)
- [ ] Traducir la respuesta real a `solicitud_resultados` (nuevo `lib/tusdatos/mapear.ts`)
- [ ] Webhook `app/api/webhooks/tusdatos/route.ts` (Bearer propio, `webhook_events`, `after()`) y registrarlo en TusDatos
- [ ] Cron de reconciliación `app/api/cron/sincronizar/route.ts` + `vercel.json` (jobid > 2 h, reintento automático máx. 3)
- [ ] Reintento real de fuentes con error (`retry()`, no consume créditos)
- [ ] Vehículo con remolque por la **consulta combinada** (lote `vehicle_combo`, agrupando; webhook `batch`)
- [ ] **Ver reporte y descargar PDF** desde el revisor: ruta `app/api/reportes/[id]/route.ts` (solo admin, maneja el 202)
- [ ] Copia del PDF en Storage al aprobar/rechazar
- [ ] **Evidencias** (capturas de las fuentes) en el revisor
- [ ] Créditos (`/api/plans`) y estado de fuentes (`/api/v1/sources/status`) en el panel
- [ ] **Validar con consultas reales** todo lo de contexto §16.2 (formatos, nombres de fuentes, tiempos, combinada, PDF)

---

## Fase 5 — Funciones complementarias ⏳ PENDIENTE

Varias dependen de las respuestas de Keyner (contexto §15).

- [ ] **Adjuntos del usuario** (autorización firmada, licencia…) → bucket `autorizaciones` (ya existe) y visibles en el revisor *(§15 pregunta 2)*
- [ ] **Decisión sugerida** por reglas si Keyner define criterios *(§15 pregunta 3)*
- [ ] **Control de créditos:** detectar consultas repetidas, límite diario por usuario, alerta de saldo bajo
- [ ] **Configuración** (pantalla del admin): `requiere_confirmacion_envio`, `alerta_creditos_minimos` (ya en la BD)
- [ ] Recuperación de contraseña por correo (requiere configurar SMTP en Supabase)
- [ ] Consultas por lote desde Excel (plantilla, validación, vista previa, progreso, exportar)
- [ ] Monitoreo de fuentes y alertas PEPs (webhook `listAndPepsMonitoring`)
- [ ] Paginación en servidor si las listas crecen (hoy en el cliente, ver `components/ui/paginacion.tsx`)

---

## Fase 6 — Producción y calidad ⏳ PENDIENTE

- [ ] Borrar las solicitudes simuladas (`delete from solicitudes where simulada;`)
- [ ] Rotar la secret key de Supabase (quedó en un chat)
- [ ] Desplegar en Vercel: variables de entorno, dominio, Site URL de Auth, `NEXT_PUBLIC_MODO_DEMO=false`
- [ ] Pruebas automáticas (Vitest para lógica, Playwright para el flujo principal)
- [ ] Rendimiento en móvil y PCs lentos (Lighthouse con CPU ×4)
- [ ] CSP completa con nonce (contexto §11)
- [ ] Guía de uso para usuarios y admin

---

## Resumen

| Fase | Descripción | Estado |
|------|-------------|--------|
| 1 | Análisis y documentación | ✅ Completada |
| 2 | Setup del proyecto + Supabase | ✅ Completada |
| 3 | Funcionalidad completa en modo simulado | ✅ Completada |
| 4 | Conexión real con TusDatos | 🔜 Siguiente — espera la API key |
| 5 | Funciones complementarias | ⏳ Pendiente (parte depende de Keyner) |
| 6 | Producción y calidad | ⏳ Pendiente |

---

## Dependencias externas

| Servicio | Propósito | Estado |
|----------|-----------|--------|
| **Supabase** | BD, Auth, Realtime, Storage | ✅ Proyecto creado y en uso |
| **TusDatos** | API de consultas | ⏳ Falta la API key |
| **Vercel** | Despliegue y cron | ⏳ Pendiente (Fase 6) |
| **Keyner (Elogia)** | Respuestas de §15 | ⏳ Preguntas 2, 3, 4, 5, 9, 10 y 11 |

---

*Roadmap actualizado: 2026-10-28 | Versión: 1.3 — Fases reescritas con el estado real tras la integración en modo simulado*
