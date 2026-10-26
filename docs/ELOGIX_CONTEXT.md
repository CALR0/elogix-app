# ELOGIX — Contexto Técnico del Proyecto
> Plataforma de validaciones de Elogia Soluciones Logísticas, potenciada por TusDatos API

> **Estado (2026-10-25):** Fase 2 en curso. El objetivo de negocio está en **§14** y las preguntas
> abiertas con el experto de TusDatos en **§15**: léelas antes de tocar el modelo de datos.
> Lo que ya cambió respecto al diseño de Fase 1 está en **§13**.
>
> **ELOGIX es de uso exclusivo de Elogia** (una sola empresa). No hay multi-organización ni
> super-admin: solo los roles `usuario` y `admin`.

---

## 1. Análisis Exhaustivo de TusDatos API

### 1.1 Descripción General

**Protocolo:** REST / JSON
**Versión OpenAPI:** 3.1.0
**Autenticación principal:** HTTP Basic Auth (`email:password`) o Bearer Token

La API permite consultar **personas naturales, jurídicas, extranjeras y vehículos** para validación de antecedentes en tiempo real, consumiendo créditos por cada consulta.

---

### 1.2 Autenticación y Seguridad

#### Métodos soportados

| Método | Descripción | Header |
|--------|-------------|--------|
| **HTTP Basic Auth** | Credenciales `email:password` codificadas en Base64 | `Authorization: Basic <b64>` |
| **API Token (Bearer)** | Token generado vía `/api/v1/auth/token`, hasta 10 tokens activos | `Authorization: Bearer <token>` |
| **OAuth 2.0 (Premium)** | Flujo `client_credentials`, prefijo `td_v2_...`, scopes: `read`, `write`, `download` | `Authorization: Bearer <td_v2_...>` |

#### Endpoints de gestión de tokens

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/token` | Crear token Bearer (máx. 10 activos) |
| `POST` | `/api/v1/auth/token/revoke` | Revocar el token actual |
| `POST` | `/api/v1/auth/token/rotate` | Invalidar TODOS los tokens del usuario |
| `POST` | `/oauth/token` | Crear OAuth 2.0 access token (Premium) |
| `POST` | `/oauth/revoke` | Revocar access token OAuth 2.0 |

> ⚠️ El `access_token` solo se muestra UNA VEZ al crearse. Guardarlo de forma segura.
> Límite: **10 tokens activos** simultáneos por usuario.

---

### 1.3 Endpoints por Categoría

#### A. Consultas Individuales — Flujo Principal (2 pasos)

**Paso 1 — Lanzar consulta:**

```
POST /api/launch
Content-Type: application/json
Authorization: Basic <credentials>
```

**Body (LaunchIn):**
```json
{
  "doc": "12345678",
  "typedoc": "CC",
  "name": "Juan Perez",
  "fechaE": "13/06/2013",
  "nombre": "Juan Perez",
  "force": false,
  "resolve_name": false,
  "webhook_reference": "orden:123,cliente:456"
}
```

**Respuesta (LaunchOut):**
```json
{
  "email": "usuario@empresa.com",
  "doc": 12345678,
  "jobid": "uuid-del-job",
  "nombre": "JUAN PEREZ",
  "typedoc": "CC",
  "validado": true
}
```

**Paso 2 — Consultar estado (polling hasta `estado !== "procesando"`):**

```
GET /api/results/{jobkey}
```

**Respuesta (JobStatus):**
```json
{
  "cedula": 12345678,
  "error": false,
  "errores": ["FuenteX"],
  "estado": "finalizado",
  "hallazgo": true,
  "hallazgos": "alto",
  "id": "id-del-reporte",
  "nombre": "JUAN PEREZ",
  "results": { "Policia": true, "Procuraduria": false },
  "time": 12.5,
  "typedoc": "CC",
  "validado": true
}
```

> El `jobid` expira en **2 horas**. El campo `id` del resultado se usa para obtener reportes.

---

#### B. Tipos de Documentos Soportados

| Código | Descripción | Campos requeridos extras |
|--------|-------------|--------------------------|
| `CC` | Cédula de Ciudadanía | `doc` |
| `CE` | Cédula de Extranjería | `doc`, `fechaE` (dd/mm/yyyy) |
| `NIT` | Nit Empresa / Jurídica | `doc` |
| `PP` | Pasaporte | `doc`, `name` |
| `PPT` | Permiso de Protección Temporal | `doc`, `fechaE` |
| `INT` | Internacional | `doc`, `name` |
| `NOMBRE` | Búsqueda por nombre | `nombre` |
| `CI` | Cédula de Identidad (Ecuador) | `doc` |
| `RUC` | Registro Único de Contribuyentes (Ecuador) | `doc` |
| `Placa_CC` | Vehículo + propietario CC | `placa`, `doc` |

**Países soportados:** `CO` (Colombia), `EC` (Ecuador)

---

#### C. Consultas Especiales

| Endpoint | Descripción |
|----------|-------------|
| `POST /api/launch/car` | Vehículo por placa + propietario (`doc`, `tdoc`, `placa`) |
| `POST /api/launch/bicicleta` | Registro bicicletas Bogotá (sticker) |
| `POST /api/launch/verify/nit` | Verificación exprés NIT |
| `POST /api/launch/verify/ppt` | Verificación exprés PPT |
| `POST /api/launch/verify/ce` | Verificación exprés CE |
| `POST /api/v1/identity/validations` | Verificación Exprés CC (sin exponer datos personales) |

---

#### D. Reportes

| Endpoint | Descripción |
|----------|-------------|
| `GET /api/v2/report/{id}` | Reporte HTML v2 (personas naturales) |
| `GET /api/v2/report_pdf/{id}` | Reporte PDF v2 |
| `GET /api/v2/report_nit/{id}` | Reporte HTML personas jurídicas |
| `GET /api/v2/report_nit_pdf/{id}` | Reporte PDF personas jurídicas |
| `GET /api/v2/report_car/{id}` | Reporte HTML vehículo |
| `GET /api/v2/report_car_pdf/{id}` | Reporte PDF vehículo |
| `GET /api/report_json/{id}` | Reporte completo en JSON estructurado (para integración) |

---

#### E. Consultas por Lote (Batch)

Procesamiento masivo de hasta **2000 consultas** por lote. Máx. **3 lotes activos** simultáneamente.

| Endpoint | Descripción |
|----------|-------------|
| `POST /api/v1/batches/launch?country={country}` | Lanzar batch personas/empresas/vehículos |
| `POST /api/v1/batches/launch/vehicle_combo?country={country}` | Batch combinado vehículo+propietario |
| `GET /api/v1/batches/progress/{job_id}` | Progreso del batch (paginado) |
| `GET /api/v1/batches/result/{batch_id}` | Resultados finales (solo si terminó) |

**Flujo:** Launch → Progress polling → Result

**Body de `/api/v1/batches/launch`:**
```json
{
  "checks": [
    { "typedoc": "CC", "doc": "11111111", "expedition_date": "13/06/2013" },
    { "typedoc": "NIT", "doc": "22222222" }
  ],
  "legal_representative": [],
  "vehicles": [
    { "license_plate": "XYZ78F", "doc": "1115999999", "typedoc": "CC" }
  ]
}
```

---

#### F. Webhooks

| Endpoint | Descripción |
|----------|-------------|
| `POST /api/v1/webhook/create` | Configurar webhook |
| `PUT /api/v1/webhook/update` | Actualizar webhook |
| `GET /api/v1/webhook/info` | Ver configuración actual |

**Eventos disponibles (`enabled_functions`):**

| Evento | Cuándo se dispara |
|--------|-------------------|
| `individualCompleted` | Consulta individual finaliza exitosamente |
| `individualRetry` | Reintento encuentra nuevos hallazgos relevantes |
| `batch` | Batch inicia (startBatch), finaliza (endBatch) o falla (batchError) |
| `listAndPepsMonitoring` | Monitoreo continuo detecta novedades en PEPs/listas |
| `reportApprovalChanged` | Reporte aprobado/rechazado (solo Colombia) |

**Auth del webhook receptor:** `NoAuth`, `BasicAuth`, `BearerAuth`

**Timeout:** 10 segundos. Si falla → 1 reintento. Si el reintento falla, el evento se pierde.

**Payload `individualCompleted`:**
```json
{
  "event_name": "individualCompleted",
  "user": "email@empresa.com",
  "reportId": "abc123",
  "finished_at": "2024-01-15T14:30:00-05:00",
  "webhook_reference": "orden:123,cliente:456"
}
```

---

#### G. Historial de Consultas

```
GET /api/v1/checks?country={country}&document_type={document_type}
```

Filtros opcionales: `date_from` (DD-MM-YYYY), `date_to`, `user_email`, `document_number`,
`vehicle_plate`, `name`, `page`, `per_page` (máx. 50).

---

#### H. Información de Usuario y Plan

| Endpoint | Descripción |
|----------|-------------|
| `GET /api/plans` | Créditos restantes, comprados y fecha de compra |
| `GET /api/querys` | Cantidad de consultas realizadas |

**Respuesta `/api/plans`:**
```json
{
  "amount": 450,
  "purchase_amount": 500,
  "purchase_date": "2024-01-01",
  "user": "email@empresa.com"
}
```

---

#### I. Fuentes y Hallazgos

| Endpoint | Descripción |
|----------|-------------|
| `GET /api/fuentes-disponibles` | Catálogo de 261 códigos de hallazgos (Colombia) |
| `GET /api/v1/sources/status` | Estado operativo de fuentes (activa, mantenimiento, caída) |

---

### 1.4 Hallazgos — Sistema de Categorización

| Nivel | Color sugerido | Descripción |
|-------|----------------|-------------|
| `alto` | 🔴 Rojo | Hallazgo crítico de alto riesgo |
| `medio` | 🟠 Naranja | Hallazgo de riesgo medio |
| `bajo` | 🟡 Amarillo | Hallazgo de bajo riesgo |
| `info` | 🔵 Azul | Informativo, sin implicación de riesgo |
| vacío | 🟢 Verde | Sin hallazgos |

La cuenta TusDatos puede configurar hasta **3 categorizaciones distintas** (ej: RRHH vs Cumplimiento).

---

### 1.5 Códigos de Error

| Código HTTP | Descripción |
|-------------|-------------|
| `400` | Parámetros inválidos / límite de tokens superado |
| `401` | Credenciales inválidas o token revocado |
| `403` | Sin créditos / consulta bloqueada por el titular |
| `404` | Recurso no encontrado |
| `422` | Error de validación de esquema |
| `424` | Batch aún no ha finalizado |
| `429` | Rate limit excedido (Verify Exprés CC) |
| `500` | Error interno del servidor |

---

### 1.6 Límites Operacionales

| Límite | Valor |
|--------|-------|
| Consultas por batch | Máx. 2000 |
| Lotes activos simultáneos | Máx. 3 |
| Tokens API activos por usuario | Máx. 10 |
| Resultados por página (historial) | Máx. 50 |
| `webhook_reference` | Máx. 250 caracteres |
| Timeout webhook | 10 segundos + 1 reintento |
| Vigencia `jobid` | 2 horas |

---

### 1.7 Fuentes Consultadas (Muestra)

**Personas:** Policia, Procuraduria, Contraloria, INPEC, Interpol, SIMIT, PEPS/PEPs,
Listas OFAC/ONU, RUES, Registraduría, Migraciones, SENA, Supersociedades,
Rama Judicial (JEPMS, Unificada, Tyba), Colpsic, Rethus, Rucom, RUAF, Sisben,
LibretaMilitar, SOAT, Fopep, Fosyga, Secop, Contaduría, Cisconmp, y más...

**Vehículos:** RUNT (licencias, multas, SOAT), Tránsito Bogotá, Simit, comparendos,
InmovilizadosBogotá.

**Total de fuentes catalogadas:** ~261 códigos de hallazgos (Colombia)

---

## 2. Arquitectura Propuesta — ELOGIX

### 2.1 Visión General

```
+----------------------------------------------------------+
|                    ELOGIX Platform                        |
+----------------------+-----------------------------------+
|   Frontend (React)   |      Backend (Next.js API)        |
|   Next.js App Router |  Server Functions / Route Handlers|
|   CSS transitions    |      TusDatos API proxy           |
|   shadcn/ui          |      Webhook receiver             |
+----------------------+-----------------------------------+
|                       Supabase                           |
|   PostgreSQL · Auth · Storage · Realtime · Edge Fns      |
+----------------------------------------------------------+
|              Vercel (Deploy + Edge Network)               |
+----------------------------------------------------------+
```

### 2.2 Stack Tecnológico

| Capa | Tecnología | Justificación |
|------|------------|---------------|
| **Framework** | Next.js 16 (App Router, Cache Components) | SSR, Server Functions, `proxy.ts`, Vercel-native |
| **Lenguaje** | TypeScript 5.x | Type safety end-to-end |
| **UI** | React 19 + shadcn/ui | Componentes accesibles y personalizables |
| **Animaciones** | Transiciones CSS (sin Framer Motion) | Livianas para PCs lentos y móvil (§8.5) |
| **Estilos** | Tailwind CSS v4 + CSS Variables | Tokens de la paleta verde Elogia, modo claro/oscuro (§8) |
| **Iconos** | Lucide React | Consistente y liviano |
| **Gráficas** | Recharts (carga diferida) | Solo en el dashboard del admin |
| **Tablas** | TanStack Table v8 | Virtual scroll, filtrado, ordenamiento |
| **Forms** | React Hook Form + Zod | Validación type-safe |
| **Estado** | Zustand + TanStack Query | State local + server state/cache |
| **Auth** | Supabase Auth | JWT, OAuth, magic link, RLS |
| **DB** | Supabase PostgreSQL | Row-level security por rol |
| **Realtime** | Supabase Realtime | Updates en vivo del estado de consultas |
| **Storage** | Supabase Storage | Almacén de reportes PDF |
| **Deploy** | Vercel | Preview deployments, edge functions |
| **Monitoreo** | Vercel Analytics + Sentry | Performance y errores |

---

### 2.3 Estructura del Proyecto (una sola app Next.js)

> **Decisión Fase 2:** se descartó el monorepo Turborepo. ELOGIX es UNA app web desplegada en
> Vercel; `packages/ui`, `packages/tusdatos-sdk` y `packages/database-types` no tenían un segundo
> consumidor y solo añadían configuración. Si en el futuro aparece otra app (p.ej. móvil), se
> extrae a paquetes en ese momento.

```
webapp_elogix/
├── AGENTS.md                       # Reglas para agentes (Next 16 ≠ Next 15)
├── README.md
├── .env.example                    # Plantilla de variables (copiar a .env.local)
├── next.config.ts                  # Cache Components, authInterrupts, headers de seguridad
├── proxy.ts                        # (antes "middleware") refresco de sesión + redirect a /login
├── docs/
│   ├── ELOGIX_CONTEXT.md           # Este archivo
│   ├── ELOGIX_ROADMAP.md
│   └── openapi.json                # Spec oficial TusDatos
├── supabase/
│   ├── config.toml                 # Supabase local (signup público deshabilitado)
│   ├── migrations/                 # Esquema + RLS versionados
│   └── seed.sql
├── app/
│   ├── (auth)/login, recuperar     # Sin sidebar. NO hay /register: los usuarios los crea el admin
│   ├── (usuario)/                  # inicio, solicitudes (Mis solicitudes), solicitudes/nueva/{documento,vehiculo}
│   ├── (admin)/                    # dashboard, estudios, lotes, usuarios, auditoria, monitoreo, configuracion
│   ├── api/
│   │   ├── reportes/[id]/          # Proxy autenticado del HTML/PDF de TusDatos (solo admin)
│   │   ├── webhooks/tusdatos/      # Receptor de webhooks (Bearer TUSDATOS_WEBHOOK_TOKEN)
│   │   └── cron/sincronizar/       # Vercel Cron: reconcilia solicitudes "procesando"
│   ├── forbidden.tsx               # Página 403 (requireAdmin → forbidden())
│   ├── layout.tsx
│   └── globals.css                 # Design tokens
├── components/
│   ├── ui/                         # shadcn/ui
│   └── …                           # por dominio: solicitudes/, estudios/, lotes/, shared/
└── lib/
    ├── env.ts                      # Validación Zod de variables de servidor
    ├── auth.ts                     # DAL: getCurrentUser / requireUser / requireAdmin
    ├── supabase/                   # client.ts, server.ts, admin.ts (secret key), proxy.ts
    └── tusdatos/                   # SDK tipado: client.ts (factory por credenciales), types.ts
```

**Mutaciones:** se prefieren **Server Functions** (`"use server"`) para formularios propios
(crear solicitud, aprobar estudio, crear usuario). Los **Route Handlers** (`app/api`) quedan para
lo que llama un tercero o necesita un `Response` crudo: webhooks, cron y descarga de reportes.

---

## 3. Diseño de Base de Datos (Supabase PostgreSQL)

> Fuente de verdad: [`supabase/migrations/20261025000000_init.sql`](../supabase/migrations/20261025000000_init.sql).
> Validada con pruebas de RLS (usuario no ve hallazgos, no puede cambiar su rol, no ve solicitudes de otros usuarios). Ver `npm run db:test`.

### 3.1 Tablas

| Tabla | Contenido | Quién lee (RLS) | Quién escribe |
|-------|-----------|-----------------|---------------|
| `profiles` | `role` (`usuario`/`admin`), `active` | El propio; admin ve todos | Usuario: solo `full_name`. Rol/activo: servidor |
| `configuracion` | Una fila: `requiere_confirmacion_envio`, `alerta_creditos_minimos` | Usuarios activos | Admin |
| `solicitudes` | Datos de entrada + `estado` + `numero` (referencia SOL-000123) + autorización del titular | Usuario: las suyas. Admin: todas | Usuario inserta columnas de entrada; estado/jobid: servidor |
| `solicitud_resultados` | **Hallazgos**, fuentes, PDF, revisión (aprobado/rechazado) | **Solo admin** | Servidor; admin solo `revision_estado`/`revision_comentario` |
| `lotes` | Batch (máx. 2000) | Solo admin | Servidor |
| `webhook_events` | Payload crudo de cada webhook | Solo admin | Servidor |
| `audit_logs` | Quién hizo qué, IP, user-agent | Solo admin | Servidor |

### 3.2 Por qué los hallazgos están en una tabla aparte

RLS de Postgres filtra **filas, no columnas**. Como la publishable key de Supabase está en el
navegador, un `usuario` podría hacer `supabase.from('solicitudes').select('*')` y leer
`hallazgo_nivel` si estuviera en la misma tabla que sí puede ver. Separando
`solicitud_resultados` con política solo-admin, la regla "el usuario no ve resultados" la garantiza
la base de datos, no la UI.

### 3.3 Patrones de seguridad aplicados
- Helpers `is_active_user()` e `is_admin()` como `security definer`
  (evitan la recursión de políticas sobre `profiles`). Un perfil `active = false` pierde acceso a todo.
- `revoke all` + `GRANT` por columna: las políticas filtran filas, los grants limitan columnas.
- `created_by` se rellena con `default auth.uid()` desde la sesión: el cliente no lo elige.
- `revisado_por`/`revisado_at` los pone un trigger, no el cliente.
- Perfil creado por trigger desde `app_metadata` (solo escribible con la secret key).
- Constraint por tipo de documento (CE/PPT exigen fecha, PP/INT exigen nombre, PLACA exige placa + propietario).
- Buckets privados `reportes` (solo admin) y `autorizaciones` (cada usuario sube a `{user_id}/...`).
- Las credenciales de TusDatos son una sola cuenta de Elogia y viven en variables de entorno (Vercel).

---

## 4. Variables de Entorno

Ver [`.env.example`](../.env.example). Se validan con Zod en `lib/env.ts` en el primer uso.

| Variable | Expuesta al navegador | Uso |
|----------|:---:|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | ✅ | Reemplaza a la "anon key" (formato `sb_publishable_…`) |
| `SUPABASE_SECRET_KEY` | ❌ | Reemplaza a la "service_role key"; ignora RLS |
| `TUSDATOS_API_TOKEN` o `TUSDATOS_EMAIL`+`TUSDATOS_PASSWORD` | ❌ | Cuenta TusDatos de Elogia |
| `TUSDATOS_WEBHOOK_TOKEN` | ❌ | Bearer que TusDatos envía al webhook (TusDatos no firma con HMAC) |
| `CRON_SECRET` | ❌ | Protege `/api/cron/*` (Vercel Cron) |

---

## 5. Arquitectura de Seguridad

### Proxy API

El navegador **NUNCA llama directamente** a TusDatos:

```
Browser → Server Function / Route Handler de ELOGIX → requireUser()/requireAdmin() → lib/tusdatos → TusDatos
```

**Reportes HTML/PDF:** los endpoints `/api/v2/report*` de TusDatos exigen HTTP Basic, así que no se
pueden poner en un `<iframe src>` apuntando a TusDatos. ELOGIX expone `/api/reportes/[id]` que
verifica rol admin y reenvía el contenido (y guarda copia del PDF en Storage).

### Autorización en tres capas
1. `proxy.ts` — verificación optimista: sin sesión → `/login`. (En Next 16 `middleware.ts` se llama `proxy.ts`.)
2. `lib/auth.ts` (Data Access Layer) — `requireUser()` / `requireAdmin()` en cada página, Server Function y Route Handler.
3. RLS en Postgres — la última palabra, aunque falle la capa de aplicación.

---

## 6. Flujo de Consulta Individual en ELOGIX

> **Corrección Fase 2:** en Vercel no existe un proceso que haga polling "cada 3 s" en background.
> La función serverless termina al responder. El flujo usa **webhook como camino principal** y un
> **cron de reconciliación** como red de seguridad (el `jobid` caduca a las 2 h).

```
=== USUARIO ===
1. Llena el formulario (tipo de doc, número, campos según tipo) y marca la autorización del titular.
2. Server Function crearSolicitud(): requireUser() → valida con Zod → INSERT solicitudes (estado: enviada).
3. Responde de inmediato: "✅ Solicitud enviada exitosamente · SOL-000123".
4. after(): POST /api/launch en TusDatos con webhook_reference = <id de la solicitud>
   → UPDATE estado = procesando, tusdatos_jobid.
   (Si falla el lanzamiento, queda en "enviada" y el cron lo reintenta.)
5. El usuario ve Enviada → En proceso → Finalizada (Realtime sobre solicitudes; nunca ve hallazgos).

=== SISTEMA ===
6a. Webhook individualCompleted → /api/webhooks/tusdatos
    - Verifica Authorization: Bearer TUSDATOS_WEBHOOK_TOKEN, guarda el payload en webhook_events.
    - webhook_reference → id de la solicitud. Responde 200 en < 10 s (TusDatos solo reintenta 1 vez).
    - Procesa con after(): GET /api/results/{jobid} → UPSERT solicitud_resultados, estado = finalizada.
6b. Vercel Cron cada 5 min → /api/cron/sincronizar
    - Solicitudes "enviada" sin jobid → relanza.
    - Solicitudes "procesando" → GET /api/results/{jobid}; si finalizó, guarda resultado.
    - jobid con > 2 h → marca error para revisión del admin.

=== ADMIN ===
7. Realtime notifica la bandeja; ve el badge de hallazgo.
8. Abre el revisor: reporte vía /api/reportes/[id] (proxy autenticado), descarga PDF.
9. Aprueba / rechaza (UPDATE revision_estado; trigger registra quién y cuándo) → audit_logs.
10. Si hubo fuentes con error: Retry → GET /api/retry/{reportId} devuelve un NUEVO jobid.
```

---

## 7. Roles y Permisos

> ⚠️ MODELO CONFIRMADO — App exclusiva de Elogia con solo 2 roles: `usuario` y `admin`.
> Los permisos exactos de cada rol se terminan de definir con las respuestas de §15.

### 7.1 Usuario (rol: `usuario`)

Es la persona que **origina la solicitud** de validación. Quién es exactamente (personal de Elogia,
contactos de clientes o ambos) está por confirmar en §15. Su función es únicamente **ingresar datos** para solicitar
un estudio de antecedentes.

**Capacidades:**
- Iniciar sesión en ELOGIX
- Ver su propio dashboard básico (número de solicitudes enviadas, estados)
- Llenar el formulario de solicitud de validación (nombre, tipo de documento, número, etc.)
- Enviar la solicitud y recibir confirmación: **"Solicitud enviada con éxito"**
- Consultar el **estado** de sus propias solicitudes (Enviada / En proceso / Finalizada)
- Editar su perfil y cambiar contraseña

**NO puede:**
- Ver hallazgos, niveles de riesgo ni resultados de las validaciones
- Ver el reporte de TusDatos
- Gestionar otros usuarios
- Acceder a configuraciones del sistema
- Ver las solicitudes de otros usuarios

---

### 7.2 Administrador (rol: `admin`)

Es la persona de Elogia que hoy hace el flujo completo en TusDatos. Tiene acceso completo a ELOGIX.

**Capacidades — Todo lo del usuario, más:**

**Gestión de validaciones:**
- Ver todas las solicitudes de todos los usuarios
- Revisar resultados completos: hallazgos, nivel de riesgo (alto/medio/bajo/info)
- Abrir y descargar el reporte de TusDatos (HTML + PDF)
- Aprobar o rechazar un estudio de antecedentes
- Relanzar una consulta (retry) si una fuente falló
- Filtrar, buscar y exportar el historial completo

**Gestión de lotes (Batch):**
- Cargar archivos CSV/Excel con múltiples solicitudes
- Monitorear el progreso de lotes masivos
- Descargar resultados consolidados en Excel

**Gestión de usuarios:**
- Crear nuevos usuarios en el sistema (nombre, email, contraseña inicial)
- Activar y desactivar usuarios
- Asignar o cambiar el rol de un usuario
- Ver el historial de actividad de cada usuario

**Auditoría:**
- Ver el log completo de acciones: quién hizo qué, cuándo y desde qué IP
- Ver eventos de webhooks recibidos de TusDatos
- Ver el estado operativo de las fuentes de TusDatos

**Configuración del sistema:**
- Ver el estado de la cuenta TusDatos de Elogia (las credenciales viven en variables de entorno)
- Configurar el webhook receptor
- Ver y gestionar créditos disponibles
- Recibir alertas de PEPs monitoring

---

### 7.3 Resumen Comparativo

| Funcionalidad | Usuario | Admin |
|---------------|:-------:|:-----:|
| Login / Perfil | ✅ | ✅ |
| Llenar formulario de solicitud | ✅ | ✅ |
| Ver estado de sus propias solicitudes | ✅ | ✅ |
| Ver resultados y hallazgos | ❌ | ✅ |
| Ver / descargar reportes TusDatos | ❌ | ✅ |
| Aprobar / rechazar estudios | ❌ | ✅ |
| Ver solicitudes de todos los usuarios | ❌ | ✅ |
| Carga masiva (batch) | ❌ | ✅ |
| Crear / activar / desactivar usuarios | ❌ | ✅ |
| Auditoría y logs de actividad | ❌ | ✅ |
| Configuración del sistema | ❌ | ✅ |
| Gestión de créditos y webhooks | ❌ | ✅ |

---

## 8. Identidad Visual y Principios de UI/UX

> **Dirección definida por el usuario (2026-10-25):** plataforma **corporativa, seria y elegante**,
> con gama **verde / ecológica alusiva a Elogia** y ambientada en **transporte y logística**. Nada
> genérico (no el look por defecto de shadcn/Tailwind) y nada infantil. Debe ir **rápido en PCs lentos
> y en móvil**. Esto reemplaza la propuesta anterior (azul eléctrico, dark navy, glassmorphism).
>
> ✅ Paleta aplicada en `app/globals.css` (tokens compatibles con shadcn + `--brand`, `--primary-hover`
> y semáforo). Modo oscuro listo con la clase `.dark` en `<html>` (falta el selector en la UI).

### 8.0 Logo de Elogia
- Archivo: [`public/brand/elogia-logo.png`](../public/brand/elogia-logo.png) — 970×484, fondo transparente,
  monocromo en **verde salvia `#95A495`** (color extraído del logo). Wordmark redondeado "elogia" con
  una hoja, y "SOLUCIONES LOGÍSTICAS" debajo.
- Úsalo con `next/image`. Sobre fondo oscuro se ve bien tal cual (contraste 8:1); sobre blanco es
  suave (2,6:1): úsalo grande (login, encabezado), no en tamaños pequeños.
- **SVG:** [`public/brand/elogia-logo.svg`](../public/brand/elogia-logo.svg) (~22 KB), vectorizado desde el PNG
  con potrace. Es el que usa la app. Si Elogia consigue el SVG original, reemplazarlo.
- **Ícono de pestaña:** `app/icon.svg`, la hoja del logo en blanco sobre salvia-700 `#436043`.
- En fondos oscuros el logo se muestra en blanco con `brightness-0 invert` (ver login).
- No hay manual de marca: la paleta se deriva del logo.

### 8.1 Concepto
"Logística sostenible": sobria, confiable y precisa, como un tablero de control de flota. El
**verde salvia** del logo es la identidad: un verde apagado y elegante, nada chillón. El contexto de
transporte se sugiere con detalles (iconografía, líneas de ruta), nunca con ilustraciones caricaturescas.

### 8.2 Paleta "Salvia Elogia" (derivada del logo `#95A495`, tono 120°)

El salvia de la marca es claro: **no sirve para texto ni botones sobre blanco** (2,6:1, no pasa WCAG).
Se usa como color de marca (logo, detalles, gráficas) y se derivan tonos más oscuros del mismo verde
para lo interactivo. Contrastes verificados contra blanco:

| Escala | Color | Contraste vs blanco | Uso |
|--------|-------|---------------------|-----|
| salvia-50 | `#F4F6F4` | — | `--background` (fondo de la app) |
| salvia-100 | `#E2E9E2` | — | `--secondary` (selección, chips, hover de filas) |
| salvia-200 | `#C7D1C7` | — | Bordes fuertes, separadores de sección |
| salvia-400 | `#95A495` | 2,6:1 | **Color de marca**: logo, acentos decorativos, gráficas |
| salvia-600 | `#517051` | 5,6:1 ✅ AA | `--primary` (botones con texto blanco, enlaces, activo) |
| salvia-700 | `#436043` | 7,0:1 ✅ AAA | `--primary-hover` / presionado |
| salvia-800 | `#364E36` | 9,1:1 | Encabezados de marca, sidebar |
| salvia-900 | `#1E2620` | 15:1 | `--foreground` (texto principal, carbón verdoso) |

Complementos: `--card` `#FFFFFF`, `--border` `#DCE3DC`, `--muted-foreground` `#5B675C`.

**Modo claro por defecto** (oficina, sesiones largas). **Modo oscuro opcional:** fondo `#121712`,
superficies `#1A231A`, bordes `#2A362A`, texto `#E2E9E2`, primario = salvia de marca `#95A495`
con texto oscuro encima (8:1).

**Semáforo de hallazgos** (más saturado que el salvia de marca, para no confundir "marca" con "sin hallazgo"):

| Nivel | Color | Siempre acompañado de |
|-------|-------|-----------------------|
| Alto | `#C8372D` | Icono + texto "Alto" |
| Medio | `#D9822B` | Icono + texto "Medio" |
| Bajo | `#B8962A` | Icono + texto "Bajo" |
| Info | `#2F6FA3` | Icono + texto "Info" |
| Sin hallazgo | `#2E8B57` | Icono de check + texto |

El color **nunca** es el único indicador (daltonismo, pantallas de mala calidad, impresión en B/N).
Sin emojis en la interfaz: iconos.

### 8.3 Tipografía e iconografía
- **Inter** (una sola familia variable, autoalojada con `next/font`: sin peticiones a Google ni saltos de diseño).
  Cifras tabulares (`tabular-nums`) en tablas, montos y referencias (SOL-000123).
- **Lucide** con imports individuales: `truck`, `route`, `map-pin`, `shield-check`, `file-search`, `id-card`, `car`.
- Ambientación de transporte con **SVG livianos**: patrón sutil de líneas de ruta/curvas de nivel en login
  y encabezados. Sin fotos pesadas ni ilustraciones infantiles.

### 8.4 Estilo de componentes
- shadcn/ui (Radix) **personalizado** con estos tokens: radio 8 px (sobrio), sombras mínimas,
  bordes finos, buena densidad en tablas (el admin revisa muchas filas).
- Jerarquía clara: una acción principal por pantalla; acciones destructivas (rechazar) separadas y con confirmación.
- Lenguaje claro y profesional en español; mensajes de error que digan qué hacer.

### 8.5 Rendimiento (PCs lentos y móvil)
- **Server Components por defecto**; JavaScript en el cliente solo donde hay interacción (formularios, filtros).
- **Sin Framer Motion ni glassmorphism** (`backdrop-filter` y blurs grandes son costosos en equipos
  modestos). Transiciones CSS de 150–200 ms solo en `opacity`/`transform`; respetar `prefers-reduced-motion`.
- Gráficas (Recharts u otra liviana) **con carga diferida** (`next/dynamic`) y solo en el dashboard del admin.
- Tablas con **paginación en servidor** (≤ 50 filas); virtualizar solo si hace falta.
- Presupuesto orientativo: JS inicial ≤ ~150 KB por ruta del usuario; LCP < 2,5 s en un móvil gama media
  con 4G. Medir con Lighthouse en modo móvil y CPU ×4 más lenta.
- Imágenes: SVG para logo e iconos; `next/image` para el resto.

### 8.6 Responsive y accesibilidad
- **Mobile-first.** El formulario del coordinador debe funcionar perfecto en el celular (puede estar en campo).
- Admin optimizado para escritorio, usable en tablet/móvil: las tablas pasan a tarjetas y el sidebar a menú desplegable.
- Áreas táctiles ≥ 44 px; inputs correctos (`inputmode="numeric"` para documentos, placa en mayúsculas).
- Contraste WCAG AA, foco visible, etiquetas en todos los campos, navegable con teclado.

---

## 9. Módulos de la Aplicación

> Las vistas marcadas con 🔵 son para el **Usuario** | Las marcadas con 🔴 son solo para el **Admin**

---

### 🔵 Vista Usuario — Panel de Solicitudes

**Dashboard básico del usuario:**
- Total de solicitudes enviadas
- Solicitudes en proceso
- Solicitudes finalizadas
- (Sin métricas de hallazgos — esa info es solo del Admin)

**Formulario de Nueva Solicitud:**
- Selector de tipo de documento (CC, CE, NIT, PP, PPT, INT, NOMBRE, Vehículo)
- Campos dinámicos según tipo seleccionado:
  - CC: número de documento, nombre (opcional)
  - CE/PPT: número de documento + fecha de expedición (dd/mm/yyyy)
  - NIT: número + nombre de empresa
  - PP/INT: número + nombre completo
  - Vehículo: placa + documento del propietario + tipo de doc del propietario
- Botón: **"Enviar solicitud"**
- Pantalla de confirmación: **"✅ Solicitud enviada exitosamente"** + número de referencia

**Mis Solicitudes:**
- Lista de sus propias solicitudes con:
  - Nombre consultado
  - Tipo y número de documento
  - Fecha de envío
  - Estado: `Enviada` / `En proceso` / `Finalizada`
  - (Sin mostrar hallazgos ni nivel de riesgo)

**Perfil de usuario:**
- Cambiar nombre y contraseña

---

### 🔴 Vista Admin — Panel Completo

**Dashboard del Admin:**
- KPIs: total solicitudes del mes, créditos restantes, hallazgos por nivel (alto/medio/bajo/info/sin)
- Gráfica de actividad (7/30/90 días)
- Feed de solicitudes recientes con badge de hallazgo
- Estado operativo de fuentes TusDatos (semáforo en vivo)
- Alertas de PEPs monitoring
- Créditos disponibles con alerta de umbral mínimo

**Bandeja de Estudios (Solicitudes de todos los usuarios):**
- Tabla completa con filtros: fecha, usuario, tipo doc, hallazgo, estado, aprobación
- Búsqueda por documento o nombre
- Badge visual de hallazgo (🔴 Alto / 🟠 Medio / 🟡 Bajo / 🔵 Info / 🟢 Sin hallazgo)
- Exportar a Excel/CSV

**Revisor de Estudio (Reporte individual):**
- Vista HTML embebida del reporte TusDatos
- Descarga PDF
- Detalle de hallazgos por fuente con iconos
- Botones de acción: **Aprobar** / **Rechazar** el estudio
- Relanzar consulta (retry) si una fuente falló
- Historial de versiones / reintentos del reporte

**Consultas por Lote (Batch):**
- Descargar template CSV/Excel
- Cargar archivo (hasta 2000 registros)
- Preview y validación antes de enviar
- Monitor de progreso en tiempo real
- Exportar resultados consolidados a Excel
- Historial de lotes con descarga

**Gestión de Usuarios:**
- Lista de todos los usuarios
- Crear nuevo usuario (nombre, email, contraseña inicial, rol)
- Activar / desactivar usuario (toggle)
- Cambiar rol: usuario ↔ admin
- Ver última actividad de cada usuario

**Auditoría:**
- Log de todas las acciones del sistema:
  - Quién envió qué solicitud y cuándo
  - Quién aprobó/rechazó un estudio
  - Quién creó/desactivó un usuario
  - Cambios de configuración
  - IP y timestamp de cada acción
- Log de eventos webhook de TusDatos

**Monitoreo de Fuentes:**
- Estado operativo de ~261 fuentes (activa / mantenimiento / caída)
- Alertas de PEPs monitoring (monitoreo continuo de listas restrictivas)
- Log de webhooks recibidos de TusDatos

**Configuración del sistema:**
- Requiere confirmación antes de enviar (sí/no) y umbral de alerta de créditos
- Configuración de webhook receptor (URL + auth + eventos a suscribir)
- Créditos: saldo, historial de consumo, alertas de umbral
- Notificaciones por email

---

## 10. Roadmap de Implementación

Ver [`ELOGIX_ROADMAP.md`](./ELOGIX_ROADMAP.md).

---

## 11. Consideraciones de Seguridad

| # | Medida | Detalle |
|---|--------|---------|
| 1 | **Cifrado de credenciales** | Vercel Environment Variables (cuenta TusDatos de Elogia) |
| 2 | **RLS en Supabase** | Usuario: solo sus solicitudes y nunca resultados. Admin: todo |
| 3 | **Rate limiting** | En API Routes para evitar abuso |
| 4 | **CORS** | Configurado estrictamente en Next.js |
| 5 | **Sanitización** | Entradas validadas con Zod antes de enviar a TusDatos |
| 6 | **Webhook validation** | Bearer token propio (TusDatos no firma con HMAC) |
| 7 | **Audit log** | Todas las consultas registradas con usuario, IP y timestamp |
| 8 | **HTTPS only** | Forzado en producción via Vercel |
| 9 | **Security headers** | HSTS, nosniff, frame-ancestors en `next.config.ts` (CSP completa con nonce: Fase 6) |
| 10 | **Rotación de tokens** | Programada con `/api/v1/auth/token/rotate` |

---

## 12. Decisiones de Arquitectura Confirmadas

| Decisión | Elección | Motivo |
|----------|----------|--------|
| Modelo de negocio | **Solo Elogia** (una empresa, sin multi-organización) | Confirmado por el usuario; simplifica BD y permisos |
| Roles | 2 roles: `usuario` y `admin` | Usuario envía solicitudes; Admin (persona de Elogia que opera TusDatos) revisa y decide |
| Visibilidad de hallazgos | Solo admin, **garantizado por RLS** (tabla `solicitud_resultados`) | La UI no es una frontera de seguridad |
| Framework | **Next.js 16** (App Router, Cache Components, `proxy.ts`) | Versión instalada; Next 15 quedó atrás |
| Estructura | **Una sola app** (sin Turborepo) | Un solo consumidor; menos configuración |
| Gestor de paquetes | npm | Ya había `package-lock.json`; evitar mezclar con pnpm |
| Base de datos | Supabase PostgreSQL | Auth + RLS + Realtime + Storage |
| Registro de usuarios | Solo por admin (signup público deshabilitado) | Acceso controlado por Elogia |
| Actualización de estados | Webhook + cron de reconciliación | Serverless no permite polling en background |
| Cumplimiento | Autorización del titular obligatoria en cada solicitud | Ley 1581 de 2012 (Habeas Data) |
| Deploy | Vercel | Preview deploys automáticos, Vercel Cron |
| Diseño | Corporativo, verde ecológico Elogia, ambientado en transporte; modo claro por defecto | Pedido del usuario; rendimiento en PCs lentos y móvil (§8) |

## 13. Revisión de Arquitectura — Fase 2 (2026-10-25)

Hallazgos de la revisión del diseño de Fase 1 y cómo se corrigieron:

| # | Problema en el diseño original | Corrección |
|---|-------------------------------|------------|
| 1 | Hallazgos en `validaciones`, tabla que el usuario puede leer → fuga vía API de Supabase | Tabla `solicitud_resultados` solo-admin |
| 2 | `profiles.role` con 4 roles (`viewer`, `operator`…) contradecía el modelo de 2 roles | Enum `app_role` (`usuario`/`admin`) |
| 3 | `tusdatos_api_token` en `organizations` (legible por miembros) | Sin multi-organización: una cuenta, en variables de entorno |
| 4 | Política RLS con subconsulta a `profiles` (recursión) y sin `WITH CHECK` | Helpers `security definer` + grants por columna |
| 5 | Polling cada 3 s "en background" | Webhook + `after()` + Vercel Cron |
| 6 | iframe al reporte de TusDatos (requiere Basic Auth) | Proxy autenticado `/api/reportes/[id]` |
| 7 | "Webhook validation: HMAC" — TusDatos no firma | Bearer token propio registrado en TusDatos |
| 8 | Docs decían Next 15 + `middleware`; está instalado Next 16 | Docs actualizados, `proxy.ts` |
| 9 | Monorepo Turborepo sin workspaces reales | Una sola app en la raíz |
| 10 | `retryConsulta` tipado como `{message}`; faltaba `/api/retry_nit` | SDK corregido (`RetryOut` = nuevo `jobid`) |
| 11 | Faltaban tabla de auditoría, estado de revisión y usuarios activos/inactivos | `audit_logs`, `revision_estado`, `profiles.active` |
| 12 | Página `register/` en un sistema B2B | Eliminada; el admin crea usuarios |
| 13 | Sin evidencia de autorización del titular | `autorizacion_titular` obligatoria + bucket `autorizaciones` |
| 14 | Multi-organización + super-admin, innecesarios: la app es solo para Elogia | Eliminados `organizations`, `organization_id`, `is_platform_admin`; tabla `configuracion` global |

---

## 14. Objetivo de Negocio y Flujo Objetivo

### 14.1 El problema que resuelve ELOGIX

**Hoy (manual):** a la persona de Elogia que maneja TusDatos (el "admin") le envían por fuera
(correo/WhatsApp) los datos de, por ejemplo, un **conductor**. Él los digita en TusDatos, lanza las
consultas, espera, lee resultados y verificaciones, y decide si el estudio se aprueba o no.

**Con ELOGIX:** quien necesita el estudio (rol `usuario`) llena el formulario él mismo. El admin
**ya no transcribe datos ni espera**: recibe el estudio con los resultados listos y solo decide.

```
Usuario llena formulario  →  ELOGIX valida  →  TusDatos consulta (automático)
        →  Admin recibe estudio con resultados + semáforo  →  Aprueba / Rechaza
        →  Usuario ve "Aprobado / Rechazado" (sin ver los hallazgos)
```

La decisión final **siempre es humana** (admin). El sistema prepara, ordena y sugiere; no aprueba solo.

### 14.2 Decisiones propuestas (pendientes de validar, ver §15)

| # | Propuesta | Estado |
|---|-----------|--------|
| P1 | **Envío automático** a TusDatos al crear la solicitud (máximo ahorro de trabajo). | ✅ Confirmado (§14.5) |
| P2 | Ajuste global `configuracion.requiere_confirmacion_envio` (ya existe en la BD): si está activo, las solicitudes quedan en "por confirmar" y el admin las confirma **en lote** antes de gastar créditos. | Recomendado |
| P3 | Controles de créditos: validación Zod por tipo de documento, **detección de duplicados** (reutilizar resultado reciente en vez de relanzar), límite diario por usuario, alerta de créditos bajos. | Recomendado |
| P4 | Bandeja del admin ordenada por riesgo: alto/medio primero; **aprobación en lote** de los "sin hallazgo". | Recomendado |
| P5 | ~~**Estudio ≠ consulta**~~ | ❌ Descartado: son dos módulos independientes, 1 solicitud = 1 consulta (§14.5) |
| P6 | Reglas de **decisión sugerida** (p.ej. "hallazgo alto ⇒ sugerir rechazo") si el experto tiene criterios claros. | Depende de §15 |
| P7 | El usuario **no ve resultados ni la decisión**: solo que su envío fue exitoso y el estado del proceso, o un error con "Intentar de nuevo". | ✅ Confirmado (§14.5) |
| P8 | **Copia del PDF en Storage solo al aprobar/rechazar** (no por cada consulta). Ver 14.4. | Recomendado, no implementado |

### 14.4 Reportes: qué entrega TusDatos y copia del PDF

TusDatos devuelve tres niveles (ver `docs/openapi.json`):
- `GET /api/results/{jobid}` — resumen: estado, nivel de hallazgo, `{ fuente: true | false | "Error" }`. Alimenta el semáforo.
- `GET /api/report_json/{id}` — detalle: `dict_hallazgos` por nivel (`codigo`, `fuente`, `hallazgo`, `descripcion`) y datos de cada fuente. Usar siempre `codigo` (estable; el texto puede cambiar). Catálogo: `GET /api/fuentes-disponibles`.
- Visual ya hecho por TusDatos: HTML (`/api/v2/report*`) y PDF (`/api/v2/report*_pdf`), más capturas de evidencia en `static.tusdatos.co/static/img/{dest}/{fuente}.jpg`.

**Vista del admin:** propia de ELOGIX construida con el JSON (rápida de revisar) + reporte oficial embebido y descargable como respaldo.

**PDF asíncrono:** el PDF responde `202` + `Retry-After` mientras se genera. El SDK lo maneja:
`fetchReport()` devuelve `{ status: "processing" }` y `fetchReportWhenReady()` espera y reintenta (para `after()`/cron).

**¿Guardar copia del PDF?** Costo bajo: un PDF pesa ~0,2–1 MB, Supabase Free incluye 1 GB y Pro 100 GB
(≈ miles de reportes por GB). Beneficio: evidencia inmutable de **qué vio el admin al decidir** (auditoría),
no depender de que TusDatos conserve el reporte, y descargas más rápidas. Por eso se propone guardar el PDF
**solo cuando el admin aprueba o rechaza** (`reportes/{solicitud_id}.pdf`, columna `reporte_pdf_path` ya existe),
no en cada consulta. Confirmar con Keyner si necesitan conservar los reportes y por cuánto tiempo.

### 14.3 ~~Cambio de modelo Estudio → Consultas~~ (descartado el 2026-10-26)

Se había propuesto agrupar varias consultas en un "estudio". Keyner confirmó que los usuarios usan
**dos módulos independientes** (§14.5), así que se mantiene el esquema actual: **1 solicitud = 1
consulta TusDatos** (`solicitudes` + `solicitud_resultados`), que ya soporta ambos módulos
(`tipo_documento = 'PLACA'` para vehículo).

### 14.5 Flujo confirmado con Keyner (2026-10-26)

**Dos módulos para el usuario**, que corresponden a la sección "Consultas" de TusDatos
(verificado en `docs/openapi.json`):

| Módulo en ELOGIX | Endpoint TusDatos | Datos del formulario |
|------------------|-------------------|----------------------|
| **Consulta por documento** | `POST /api/launch` | Tipo (CC, CE, PPT, PP, NIT) + número; fecha de expedición para CE/PPT; nombre para PP |
| **Consulta por vehículo** | `POST /api/launch/car` | Placa (6 caracteres) + tipo (CC, CE, NIT, TI) y número del documento del propietario |

`INT` y `NOMBRE` también existen en `/api/launch`; no se muestran por ahora (confirmar si se usan).

**Roles:**
- **Usuario:** registra la consulta → se envía sola a TusDatos. Solo ve "Solicitud enviada" + el
  estado del proceso (Enviada → En proceso → Finalizada). **Nunca** ve resultados ni la decisión.
- **Admin:** verifica que el estudio esté completo y válido, revisa resultados y aprueba/rechaza.

**Errores (dos tipos distintos):**
1. **Error al enviar** (validación, documento rechazado por TusDatos, sin créditos, TusDatos caído):
   el usuario ve el error en el momento con **"Intentar de nuevo"**. Queda registrado para el admin.
2. **Fuentes con error** (la consulta terminó pero `JobStatus.error = true` y `errores = [...]`): no es
   un registro exitoso. TusDatos permite **reintentar gratis** con `GET /api/retry/{id}` ("sin descontar
   consultas del plan"), que devuelve un nuevo `jobid`. ELOGIX lo reintenta **automáticamente** (cron,
   máx. 3 veces); si persiste, el admin lo ve marcado y puede reintentar a mano. El usuario solo ve
   "En proceso" mientras tanto.

**Límites a respetar** (descripción de `/api/launch`): esperar **5 s entre lanzamientos** (los envíos
se encolan y se lanzan en serie) y cada consulta tarda **~1 minuto** en promedio.

### 14.6 Vehículo con remolque: cabezote + tráiler (2026-10-26)

Keyner señaló que un tractocamión (cabezote) y su remolque tienen **placas distintas y pueden tener
propietarios distintos**. TusDatos lo resuelve con la **consulta combinada de vehículo**
(verificado en `docs/openapi.json`):

| | Consulta simple | Consulta combinada |
|---|---|---|
| Endpoint | `POST /api/launch/car` | `POST /api/v1/batches/launch/vehicle_combo` (lote; máx. 2000) |
| Cubre | 1 placa + su propietario | Cabezote + propietario, **remolque + su propietario**, y opcional tenedor y hasta 5 conductores |
| Placa remolque | — | `R` o `S` + 5 dígitos (`R41130`, `S12345`) |
| Doc. propietario remolque | — | CC, CE, NIT, PP, PPT, INT |
| Resultado | `GET /api/results/{jobid}` | `batches/progress/{job_id}` → `batches/result/{batch_id}` (tipo `Vehiculo_Propietario`) |
| Reporte | `/api/v2/report_car/{id}` | `/api/v2/report_combo/{id}` (⚠️ citado en la descripción pero **no** aparece en `paths` de la spec: confirmar con TusDatos) |
| Créditos | 1 vehículo + propietario | 1 vehículo + propietario + remolque y sus personas + tenedor + conductores |

**Cómo lo maneja ELOGIX:**
- El módulo **Consulta por vehículo** tiene la opción **"Lleva remolque o tráiler"**: placa del remolque
  y su propietario (o "mismo propietario del cabezote"). Ya está en la maqueta y en
  `lib/solicitudes/schemas.ts`.
- Sin remolque → `POST /api/launch/car` (como hasta ahora).
- Con remolque → consulta combinada. Como es un endpoint de **lote** (máx. 3 lotes activos por cuenta),
  el servidor **agrupa** las combinadas pendientes en un solo lote cada pocos minutos en vez de abrir un
  lote por solicitud, y sigue el resultado con el webhook `batch` + cron.
- Sigue siendo **una solicitud** para el usuario y **un estudio** para el admin, que ve en el revisor
  las secciones cabezote, remolque y propietarios.
- **BD (pendiente):** columnas `placa_remolque`, `tipo_doc_propietario_remolque`,
  `documento_propietario_remolque` en `solicitudes` (o un `datos jsonb` del módulo) y `tusdatos_batch_id`.

---

## 15. Pendiente por Confirmar Keyner de TusDatos (Elogia)

Quien hoy opera TusDatos en Elogia (Keyner, el futuro `admin`) conoce el flujo real. Respuestas
necesarias antes de la Fase 3. Preguntas 1-6 y 8 enviadas por WhatsApp el 2026-10-25; registra aquí
sus respuestas.

**Ya respondido (por el usuario):** quienes envían solicitudes son **coordinadores de Elogia**
(personal interno). No hace falta registrar empresa cliente por usuario. Esto cierra la pregunta 7.

1. ~~**Tipos de estudio:**~~ ✅ Dos módulos: consulta por documento y consulta por vehículo (§14.5).
2. **Datos de entrada:** ¿con qué datos llega hoy cada solicitud? ¿Llegan adjuntos (licencia, tarjeta de propiedad, autorización firmada)?
3. **Criterios de decisión:** ¿cómo decide aprobar o rechazar? ¿Hay reglas (p.ej. "alto = rechazo", "multas pendientes = condicionado")? ¿Existe un estado "aprobado con observaciones"?
4. **Créditos:** ¿relanzar una cédula ya consultada (`force: false`) cobra crédito? ¿Cuánto tiempo es válido un estudio antes de repetirlo?
5. **Aprobación en TusDatos:** ¿hoy aprueban/rechazan dentro del panel de TusDatos? (Existe el webhook `reportApprovalChanged`; se podría sincronizar.)
6. ~~**Confirmación previa:**~~ ✅ Se envía solo al registrar; el admin verifica después (§14.5).
7. ~~**Quién es "usuario":**~~ ✅ Coordinadores de Elogia (personal interno). Sin campo `empresa`.
8. ~~**Qué ve el usuario al final:**~~ ✅ Solo envío exitoso y estado, o error con "Intentar de nuevo". Nada de resultados.
10. **Nuevo:** ¿se usan los tipos `INT` (internacional) y `NOMBRE` en la consulta por documento?
11. **Nuevo (remolque, §14.6):** en la consulta combinada, ¿incluyen también al **conductor** (hasta 5) y al **tenedor**? ¿El remolque puede ser de otra empresa además de otra persona? ¿Hoy usan esta consulta combinada en TusDatos?
9. **Permisos del usuario:** ¿qué más debe poder hacer o ver (p.ej. adjuntar documentos, cancelar una solicitud, ver un comentario del admin)?

---

*Documento generado: 2026-10-25 | Versión: 1.3 — Objetivo de negocio (§14) y pendientes Keyner de TusDatos (§15)*
