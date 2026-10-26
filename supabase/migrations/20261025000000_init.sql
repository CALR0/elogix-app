-- ════════════════════════════════════════════════════════════════════════════
-- ELOGIX — Esquema inicial
--
-- App de uso exclusivo de Elogia Soluciones Logísticas (una sola empresa, sin
-- multi-organización).
--
-- Principios:
--  1. Dos roles: 'usuario' (envía solicitudes y ve su estado) y 'admin'
--     (revisa resultados, aprueba/rechaza, gestiona usuarios y configuración).
--  2. RLS filtra filas, NO columnas. Por eso los hallazgos viven en
--     solicitud_resultados (solo admin) y no en solicitudes (que el usuario ve).
--  3. Escrituras sensibles (estado TusDatos, roles, auditoría, webhooks) las hace
--     el servidor con la secret key; el cliente solo tiene permisos mínimos.
-- ════════════════════════════════════════════════════════════════════════════

-- ─── Enums ──────────────────────────────────────────────────────────────────

create type public.app_role as enum ('usuario', 'admin');

create type public.tipo_documento as enum (
  'CC', 'CE', 'NIT', 'PP', 'PPT', 'INT', 'NOMBRE', 'CI', 'RUC', 'PLACA'
);

-- Estado visible para el usuario: enviada → procesando → finalizada (o error)
create type public.solicitud_estado as enum ('enviada', 'procesando', 'finalizada', 'error');

create type public.hallazgo_nivel as enum ('alto', 'medio', 'bajo', 'info', 'sin_hallazgo');

create type public.revision_estado as enum ('pendiente', 'aprobado', 'rechazado');

create type public.lote_estado as enum ('cargado', 'procesando', 'finalizado', 'error');

-- ─── Utilidades ─────────────────────────────────────────────────────────────

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─── Perfiles ───────────────────────────────────────────────────────────────

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  full_name   text,
  role        public.app_role not null default 'usuario',
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Crea el perfil cuando el admin crea un usuario (auth.admin.createUser() desde el servidor).
-- El rol se lee de app_metadata, que solo la secret key puede escribir.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    coalesce((new.raw_app_meta_data ->> 'role')::public.app_role, 'usuario')
  );
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Helpers de autorización (security definer para evitar recursión RLS) ───

create function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and active)
$$;

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and active and role = 'admin'
  )
$$;

-- ─── Configuración general (una sola fila) ──────────────────────────────────

create table public.configuracion (
  id                           boolean primary key default true check (id),
  -- Si es true, las solicitudes esperan confirmación del admin antes de gastar créditos
  requiere_confirmacion_envio  boolean not null default false,
  alerta_creditos_minimos      int not null default 50,
  updated_at                   timestamptz not null default now()
);

insert into public.configuracion default values;

create trigger configuracion_updated_at before update on public.configuracion
  for each row execute function public.set_updated_at();

-- ─── Lotes (batch) ──────────────────────────────────────────────────────────

create table public.lotes (
  id                 uuid primary key default gen_random_uuid(),
  created_by         uuid not null references public.profiles (id),
  nombre_archivo     text,
  country            text not null default 'CO' check (country in ('CO', 'EC')),
  estado             public.lote_estado not null default 'cargado',
  total              int not null check (total between 1 and 2000),
  procesadas         int not null default 0,
  tusdatos_job_id    text,
  tusdatos_batch_id  text,
  created_at         timestamptz not null default now(),
  finished_at        timestamptz
);

create index lotes_created_idx on public.lotes (created_at desc);

-- ─── Solicitudes (lo que el usuario ve: datos de entrada + estado) ──────────

create table public.solicitudes (
  id                    uuid primary key default gen_random_uuid(),
  numero                bigint generated always as identity unique,  -- Referencia: SOL-000123
  created_by            uuid not null default auth.uid() references public.profiles (id),
  lote_id               uuid references public.lotes (id),

  tipo_documento        public.tipo_documento not null,
  documento             text,
  nombre                text,
  fecha_expedicion      date,                      -- CE / PPT (y opcional CC)
  placa                 text,                      -- tipo PLACA
  tipo_doc_propietario  text check (tipo_doc_propietario in ('CC', 'CE', 'NIT', 'TI')),

  -- Ley 1581 de 2012 (Habeas Data): evidencia de autorización del titular
  autorizacion_titular  boolean not null check (autorizacion_titular),
  autorizacion_soporte  text,                      -- ruta en Storage (opcional)

  estado                public.solicitud_estado not null default 'enviada',
  tusdatos_jobid        text,
  tusdatos_report_id    text,
  intentos              int not null default 0,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  finalizada_at         timestamptz,

  constraint solicitud_campos_por_tipo check (
    case tipo_documento
      when 'NOMBRE' then nombre is not null
      when 'PLACA'  then placa is not null and documento is not null and tipo_doc_propietario is not null
      when 'CE'     then documento is not null and fecha_expedicion is not null
      when 'PPT'    then documento is not null and fecha_expedicion is not null
      when 'PP'     then documento is not null and nombre is not null
      when 'INT'    then documento is not null and nombre is not null
      else documento is not null
    end
  )
);

create index solicitudes_created_idx on public.solicitudes (created_at desc);
create index solicitudes_created_by_idx on public.solicitudes (created_by, created_at desc);
create index solicitudes_pendientes_idx on public.solicitudes (estado) where estado in ('enviada', 'procesando');
create index solicitudes_report_id_idx on public.solicitudes (tusdatos_report_id);

create trigger solicitudes_updated_at before update on public.solicitudes
  for each row execute function public.set_updated_at();

-- ─── Resultados (SOLO admin: hallazgos, reporte, revisión) ──────────────────

create table public.solicitud_resultados (
  solicitud_id          uuid primary key references public.solicitudes (id) on delete cascade,
  hallazgo              boolean not null default false,
  hallazgo_nivel        public.hallazgo_nivel,
  fuentes               jsonb,                     -- { "Policia": true, "Procuraduria": false, ... }
  fuentes_con_error     text[] not null default '{}',
  reporte_pdf_path      text,                      -- copia en Storage (bucket "reportes")
  revision_estado       public.revision_estado not null default 'pendiente',
  revision_comentario   text,
  revisado_por          uuid references public.profiles (id),
  revisado_at           timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index solicitud_resultados_nivel_idx on public.solicitud_resultados (hallazgo_nivel);

create trigger solicitud_resultados_updated_at before update on public.solicitud_resultados
  for each row execute function public.set_updated_at();

-- Quién revisó lo pone la BD, no el cliente
create function public.stamp_revision()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.revision_estado is distinct from old.revision_estado then
    new.revisado_por = auth.uid();
    new.revisado_at = now();
  end if;
  return new;
end;
$$;

create trigger solicitud_resultados_stamp_revision before update on public.solicitud_resultados
  for each row execute function public.stamp_revision();

-- ─── Webhooks recibidos y auditoría ─────────────────────────────────────────

create table public.webhook_events (
  id            uuid primary key default gen_random_uuid(),
  event_name    text not null,
  payload       jsonb not null,
  processed_at  timestamptz,
  error         text,
  received_at   timestamptz not null default now()
);

create index webhook_events_received_idx on public.webhook_events (received_at desc);

create table public.audit_logs (
  id          bigint generated always as identity primary key,
  actor_id    uuid references public.profiles (id),
  accion      text not null,   -- p.ej. 'solicitud.crear', 'estudio.aprobar', 'usuario.desactivar'
  entidad     text,
  entidad_id  text,
  metadata    jsonb,
  ip          inet,
  user_agent  text,
  created_at  timestamptz not null default now()
);

create index audit_logs_created_idx on public.audit_logs (created_at desc);

-- ════════════════════════════════════════════════════════════════════════════
-- Row Level Security
-- ════════════════════════════════════════════════════════════════════════════

alter table public.profiles             enable row level security;
alter table public.configuracion        enable row level security;
alter table public.lotes                enable row level security;
alter table public.solicitudes          enable row level security;
alter table public.solicitud_resultados enable row level security;
alter table public.webhook_events       enable row level security;
alter table public.audit_logs           enable row level security;

-- Privilegios mínimos para el rol "authenticated" (las políticas filtran filas,
-- los GRANT por columna limitan qué se puede escribir).
revoke all on all tables in schema public from anon, authenticated;

grant select on public.profiles, public.configuracion, public.lotes, public.solicitudes,
  public.solicitud_resultados, public.webhook_events, public.audit_logs to authenticated;

grant update (full_name) on public.profiles to authenticated;

grant update (requiere_confirmacion_envio, alerta_creditos_minimos) on public.configuracion to authenticated;

grant insert (tipo_documento, documento, nombre, fecha_expedicion, placa,
  tipo_doc_propietario, autorizacion_titular, autorizacion_soporte)
  on public.solicitudes to authenticated;

grant update (revision_estado, revision_comentario) on public.solicitud_resultados to authenticated;

-- profiles
create policy "profiles: leer el propio" on public.profiles
  for select to authenticated
  using (id = auth.uid());

create policy "profiles: admin lee todos" on public.profiles
  for select to authenticated
  using (public.is_admin());

create policy "profiles: editar el propio nombre" on public.profiles
  for update to authenticated
  using (id = auth.uid() and public.is_active_user())
  with check (id = auth.uid());

-- configuracion
create policy "configuracion: usuarios activos leen" on public.configuracion
  for select to authenticated
  using (public.is_active_user());

create policy "configuracion: admin edita" on public.configuracion
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- solicitudes
create policy "solicitudes: usuario ve las suyas, admin todas" on public.solicitudes
  for select to authenticated
  using (public.is_active_user() and (created_by = auth.uid() or public.is_admin()));

create policy "solicitudes: usuario activo crea a su nombre" on public.solicitudes
  for insert to authenticated
  with check (public.is_active_user() and created_by = auth.uid());

-- solicitud_resultados (solo admin)
create policy "resultados: admin lee" on public.solicitud_resultados
  for select to authenticated
  using (public.is_admin());

create policy "resultados: admin revisa" on public.solicitud_resultados
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- lotes, webhook_events, audit_logs (solo admin, lectura)
create policy "lotes: admin lee" on public.lotes
  for select to authenticated
  using (public.is_admin());

create policy "webhooks: admin lee" on public.webhook_events
  for select to authenticated
  using (public.is_admin());

create policy "auditoria: admin lee" on public.audit_logs
  for select to authenticated
  using (public.is_admin());

-- ─── Realtime (respeta RLS) ─────────────────────────────────────────────────

alter publication supabase_realtime add table public.solicitudes, public.solicitud_resultados;

-- ─── Storage: reportes PDF y soportes de autorización ──────────────────────
-- Rutas: reportes/{solicitud_id}.pdf · autorizaciones/{user_id}/{archivo}

insert into storage.buckets (id, name, public)
values ('reportes', 'reportes', false), ('autorizaciones', 'autorizaciones', false);

create policy "reportes: admin lee" on storage.objects
  for select to authenticated
  using (bucket_id = 'reportes' and public.is_admin());

create policy "autorizaciones: usuario sube a su carpeta" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'autorizaciones'
    and public.is_active_user()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "autorizaciones: admin lee" on storage.objects
  for select to authenticated
  using (bucket_id = 'autorizaciones' and public.is_admin());
