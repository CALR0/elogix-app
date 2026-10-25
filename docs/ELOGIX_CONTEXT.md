# ELOGIX — Contexto Técnico del Proyecto
> Plataforma de validaciones de Elogia Soluciones Logísticas, potenciada por TusDatos API

> **Estado (2026-10-25):** Fase 2 en curso. El objetivo de negocio está en **§14** y las preguntas
> abiertas con el experto de TusDatos en **§15**: léelas antes de tocar el modelo de datos.
> Lo que ya cambió respecto al diseño de Fase 1 está en **§13**.

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

Cada organización puede configurar hasta **3 categorizaciones distintas** (ej: RRHH vs Cumplimiento).

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
|   Framer Motion      |      TusDatos API proxy           |
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
| **Animaciones** | Framer Motion | Microanimaciones premium |
| **Estilos** | Tailwind CSS v4 + CSS Variables | Design tokens, dark mode, glassmorphism |
| **Iconos** | Lucide React | Consistente y liviano |
| **Gráficas** | Recharts | Dashboard analytics |
| **Tablas** | TanStack Table v8 | Virtual scroll, filtrado, ordenamiento |
| **Forms** | React Hook Form + Zod | Validación type-safe |
| **Estado** | Zustand + TanStack Query | State local + server state/cache |
| **Auth** | Supabase Auth | JWT, OAuth, magic link, RLS |
| **DB** | Supabase PostgreSQL | Row-level security por organización |
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
│   ├── (usuario)/solicitudes/      # Nueva solicitud + Mis solicitudes (rol usuario)
│   ├── (admin)/                    # dashboard, estudios, lotes, usuarios, auditoria, monitoreo, configuracion
│   ├── (plataforma)/organizaciones # Super-admin Elogia (Fase 5)
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
> Validada con pruebas de RLS (usuario no ve hallazgos, no puede cambiar su rol, aislamiento entre organizaciones).

### 3.1 Tablas

| Tabla | Contenido | Quién lee (RLS) | Quién escribe |
|-------|-----------|-----------------|---------------|
| `organizations` | Cliente/aliado. `tusdatos_account_email` para enrutar webhooks | Miembros de la org | Servidor |
| `organization_secrets` | Referencia a Supabase Vault con credenciales TusDatos por org | **Nadie** (solo secret key) | Servidor |
| `profiles` | `role` (`usuario`/`admin`), `is_platform_admin`, `active` | El propio; admin ve los de su org | Usuario: solo `full_name`. Rol/activo: servidor |
| `solicitudes` | Datos de entrada + `estado` + `numero` (referencia SOL-000123) + autorización del titular | Usuario: las suyas. Admin: las de su org | Usuario inserta columnas de entrada; estado/jobid: servidor |
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
- Helpers `current_org_id()`, `is_org_admin()`, `is_platform_admin()` como `security definer`
  (evitan la recursión de políticas sobre `profiles`). Un perfil `active = false` pierde acceso a todo.
- `revoke all` + `GRANT` por columna: las políticas filtran filas, los grants limitan columnas.
- `organization_id` y `created_by` se rellenan con `default` desde la sesión: el cliente no los elige.
- `revisado_por`/`revisado_at` los pone un trigger, no el cliente.
- Perfil creado por trigger desde `app_metadata` (solo escribible con la secret key).
- Constraint por tipo de documento (CE/PPT exigen fecha, PP/INT exigen nombre, PLACA exige placa + propietario).
- Buckets privados `reportes` y `autorizaciones` con rutas `{organization_id}/...`.

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

> ⚠️ MODELO CONFIRMADO — Solo 2 roles activos por organización: `usuario` y `admin`.

### 7.1 Usuario (rol: `usuario`)

Es la persona que **origina la solicitud** de validación. Puede ser un colaborador de Elogia o un
contacto de una empresa cliente. Su función es únicamente **ingresar datos** para solicitar
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

Es el **super usuario** de la organización. Tiene acceso completo a ELOGIX. Típicamente es
un miembro del equipo de Elogia o el responsable de cumplimiento de la empresa cliente.

**Capacidades — Todo lo del usuario, más:**

**Gestión de validaciones:**
- Ver todas las solicitudes de todos los usuarios de su organización
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
- Gestionar API Keys / Tokens de TusDatos de la organización
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

## 8. Identidad Visual ELOGIX

### Paleta de Colores

```css
:root {
  /* Primary — Electric Blue (tecnológico, confiable) */
  --color-primary:       hsl(217, 91%, 55%);   /* #2B7FEC */
  --color-primary-dark:  hsl(217, 91%, 42%);
  --color-primary-light: hsl(217, 91%, 70%);

  /* Secondary — Cyan (vínculo con Elogia logística) */
  --color-secondary:     hsl(188, 89%, 44%);   /* #0BBCD4 */

  /* Backgrounds — Dark Navy */
  --color-bg-primary:    hsl(222, 47%, 7%);    /* #080E1B */
  --color-bg-secondary:  hsl(222, 40%, 11%);   /* #111929 */
  --color-bg-tertiary:   hsl(222, 35%, 16%);   /* #1A2538 */

  /* Glassmorphism */
  --glass-bg:            hsla(222, 40%, 16%, 0.6);
  --glass-border:        hsla(217, 91%, 55%, 0.15);

  /* Hallazgos — Semáforo */
  --color-alto:          hsl(0, 84%, 60%);     /* #EF4444 Rojo */
  --color-medio:         hsl(38, 92%, 50%);    /* #F59E0B Naranja */
  --color-bajo:          hsl(47, 96%, 53%);    /* #FBBF24 Amarillo */
  --color-info:          hsl(213, 94%, 68%);   /* #60A5FA Azul claro */
  --color-sin-hallazgo:  hsl(142, 71%, 45%);   /* #22C55E Verde */

  /* Texto */
  --color-text-primary:   hsl(213, 31%, 91%);
  --color-text-secondary: hsl(215, 20%, 65%);
}
```

### Tipografía
- **Fuente:** Inter (Google Fonts)
- **Pesos:** 300, 400, 500, 600, 700

### Principios de Diseño
- Dark mode first (modo claro opcional)
- Glassmorphism en cards y modales
- Gradientes sutiles en elementos destacados
- Microanimaciones en transiciones de estado (Framer Motion)
- Color coding consistente en hallazgos (sistema semáforo)
- Sidebar colapsable con iconos

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
- Lista de todos los usuarios de la organización
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
- Gestión de API Keys / Tokens TusDatos de la organización
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
| 1 | **Cifrado de credenciales** | Vercel Env Vars (cuenta Elogia) + Supabase Vault (cuentas por organización) |
| 2 | **RLS en Supabase** | Aislamiento completo entre organizaciones |
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
| Modelo de negocio | Multi-organización | Elogia puede gestionar múltiples clientes/aliados |
| Roles | 2 roles: `usuario` y `admin` + flag `is_platform_admin` | Usuario solo envía solicitudes; Admin revisa y gestiona; Elogia administra todas las orgs |
| Visibilidad de hallazgos | Solo admin, **garantizado por RLS** (tabla `solicitud_resultados`) | La UI no es una frontera de seguridad |
| Framework | **Next.js 16** (App Router, Cache Components, `proxy.ts`) | Versión instalada; Next 15 quedó atrás |
| Estructura | **Una sola app** (sin Turborepo) | Un solo consumidor; menos configuración |
| Gestor de paquetes | npm | Ya había `package-lock.json`; evitar mezclar con pnpm |
| Base de datos | Supabase PostgreSQL | Auth + RLS + Realtime + Storage |
| Registro de usuarios | Solo por admin (signup público deshabilitado) | Plataforma B2B |
| Actualización de estados | Webhook + cron de reconciliación | Serverless no permite polling en background |
| Cumplimiento | Autorización del titular obligatoria en cada solicitud | Ley 1581 de 2012 (Habeas Data) |
| Deploy | Vercel | Preview deploys automáticos, Vercel Cron |

## 13. Revisión de Arquitectura — Fase 2 (2026-10-25)

Hallazgos de la revisión del diseño de Fase 1 y cómo se corrigieron:

| # | Problema en el diseño original | Corrección |
|---|-------------------------------|------------|
| 1 | Hallazgos en `validaciones`, tabla que el usuario puede leer → fuga vía API de Supabase | Tabla `solicitud_resultados` solo-admin |
| 2 | `profiles.role` con 4 roles (`viewer`, `operator`…) contradecía el modelo de 2 roles | Enum `app_role` + `is_platform_admin` |
| 3 | `tusdatos_api_token` en `organizations` (legible por miembros) | `organization_secrets` sin políticas + Vault |
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
| P1 | **Envío automático** a TusDatos al crear la solicitud (máximo ahorro de trabajo). | Recomendado |
| P2 | Ajuste por organización `requiere_confirmacion_envio`: si está activo, las solicitudes quedan en "por confirmar" y el admin las confirma **en lote** antes de gastar créditos. | Recomendado |
| P3 | Controles de créditos: validación Zod por tipo de documento, **detección de duplicados** (reutilizar resultado reciente en vez de relanzar), límite diario por usuario, alerta de créditos bajos. | Recomendado |
| P4 | Bandeja del admin ordenada por riesgo: alto/medio primero; **aprobación en lote** de los "sin hallazgo". | Recomendado |
| P5 | **Estudio ≠ consulta**: un estudio (p.ej. "Estudio de conductor") agrupa varias consultas TusDatos y se aprueba como un todo. Ver 14.3. | Requiere cambio de esquema |
| P6 | Reglas de **decisión sugerida** (p.ej. "hallazgo alto ⇒ sugerir rechazo") si el experto tiene criterios claros. | Depende de §15 |
| P7 | El usuario ve el **resultado final** del estudio (Aprobado / Rechazado / En revisión), nunca los hallazgos. | Recomendado |

### 14.3 Cambio de modelo propuesto: Estudio → Consultas (NO implementado aún)

El esquema actual (`supabase/migrations/20261025000000_init.sql`) asume **1 solicitud = 1 consulta
TusDatos**. Un estudio de conductor en logística probablemente implica varias consultas:

| Consulta | Endpoint TusDatos | Datos |
|----------|-------------------|-------|
| Antecedentes del conductor | `POST /api/launch` (CC/CE/PPT) | Documento, fecha de expedición si aplica |
| Vehículo + propietario | `POST /api/launch/car` | Placa, documento y tipo de doc del propietario |
| Propietario (si ≠ conductor) | `POST /api/launch` (CC o NIT) | Documento |

Esquema propuesto (reemplaza `solicitudes` / `solicitud_resultados`):

```
estudios                      ← lo que crea el usuario y aprueba el admin
  id, numero (EST-000123), organization_id, created_by,
  tipo_estudio ('conductor' | 'vehiculo' | 'persona' | 'empresa' | …),
  datos jsonb (formulario completo), autorizacion_titular,
  estado ('por_confirmar' | 'enviado' | 'procesando' | 'listo_para_revision' | 'aprobado' | 'rechazado' | 'error')
  -- visible para el usuario: SÍ (sin hallazgos)

estudio_consultas             ← una fila por llamada a TusDatos
  id, estudio_id, rol ('conductor' | 'vehiculo' | 'propietario'),
  tipo_documento, documento, placa, …, tusdatos_jobid, tusdatos_report_id, estado
  -- visible para el usuario: NO (o solo estado)

estudio_resultados            ← SOLO admin
  estudio_id, hallazgo_max, resumen jsonb, decision_sugerida,
  revision_estado, revision_comentario, revisado_por, revisado_at
```

Las reglas de seguridad de §3 se mantienen igual (resultados en tabla solo-admin, grants por
columna, `organization_id` desde la sesión). La migración inicial aún no se ha aplicado en ningún
entorno, así que **se puede reescribir** en lugar de crear una migración nueva.

---

## 15. Pendiente por Confirmar Keyner de TusDatos (Elogia)

Quien hoy opera TusDatos en Elogia conoce el flujo real. Respuestas necesarias antes de la Fase 3:

1. **Tipos de estudio:** ¿qué estudios hacen (conductor, vehículo, propietario, empresa transportadora, otros)? ¿Qué consultas TusDatos lleva cada uno?
2. **Datos de entrada:** ¿con qué datos llega hoy cada solicitud? ¿Llegan adjuntos (licencia, tarjeta de propiedad, autorización firmada)?
3. **Criterios de decisión:** ¿cómo decide aprobar o rechazar? ¿Hay reglas (p.ej. "alto = rechazo", "multas pendientes = condicionado")? ¿Existe un estado "aprobado con observaciones"?
4. **Créditos:** ¿relanzar una cédula ya consultada (`force: false`) cobra crédito? ¿Cuánto tiempo es válido un estudio antes de repetirlo?
5. **Aprobación en TusDatos:** ¿hoy aprueban/rechazan dentro del panel de TusDatos? (Existe el webhook `reportApprovalChanged`; se podría sincronizar.)
6. **Confirmación previa:** ¿prefiere que todo se envíe automático o revisar antes de gastar créditos? ¿Depende del cliente?
7. **Quién es "usuario":** ¿son clientes externos de Elogia, personal interno, o ambos? ¿Cada cliente es una organización separada?
8. **Qué ve el usuario al final:** ¿solo Aprobado/Rechazado, o también un comentario del admin?
9. **Cuenta TusDatos:** ¿una sola cuenta de Elogia para todos los clientes, o cada cliente tiene la suya?

---

*Documento generado: 2026-10-25 | Versión: 1.3 — Objetivo de negocio (§14) y pendientes Keyner de TusDatos (§15)*
