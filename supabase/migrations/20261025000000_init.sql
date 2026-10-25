-- ════════════════════════════════════════════════════════════════════════════
-- ELOGIX — Esquema inicial
--
-- Principios:
--  1. Multi-tenant: toda fila de negocio lleva organization_id y RLS lo aísla.
--  2. Dos roles por organización: 'usuario' y 'admin' (+ flag is_platform_admin
--     para el equipo de Elogia que administra todas las organizaciones).
--  3. RLS filtra filas, NO columnas. Por eso los hallazgos viven en
--     solicitud_resultados (solo admin) y no en solicitudes (que el usuario ve).
--  4. Escrituras sensibles (estado TusDatos, roles, auditoría, webhooks) las hace
--     el servidor con la service role key; el cliente solo tiene permisos mínimos.
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

-- ─── Organizaciones ─────────────────────────────────────────────────────────

create table public.organizations (
  id                      uuid primary key default gen_random_uuid(),
  name                    text not null,
  slug                    text not null unique,
  nit                     text,
  logo_url                text,
  active                  boolean not null default true,
  -- Email de la cuenta TusDatos (no es secreto). Sirve para enrutar webhooks,
  -- cuyo payload solo trae el campo "user".
  tusdatos_account_email  text,
  credit_alert_threshold  int not null default 50,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create trigger organizations_updated_at before update on public.organizations
  for each row execute function public.set_updated_at();

-- Secretos por organización (Fase 5). Sin políticas RLS: solo service role.
-- El valor real va en Supabase Vault; aquí solo la referencia.
create table public.organization_secrets (
  organization_id      uuid primary key references public.organizations (id) on delete cascade,
  tusdatos_secret_id   uuid,  -- vault.secrets.id
  updated_at           timestamptz not null default now()
);

-- ─── Perfiles ───────────────────────────────────────────────────────────────

create table public.profiles (
  id                 uuid primary key references auth.users (id) on delete cascade,
  organization_id    uuid not null references public.organizations (id),
  email              text not null,
  full_name          text,
  role               public.app_role not null default 'usuario',
  is_platform_admin  boolean not null default false,
  active             boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index profiles_organization_id_idx on public.profiles (organization_id);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Crea el perfil cuando el servidor crea el usuario con auth.admin.createUser().
-- organization_id y role se leen de app_metadata, que solo la service role puede escribir.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.raw_app_meta_data ? 'organization_id' then
    insert into public.profiles (id, organization_id, email, full_name, role)
    values (
      new.id,
      (new.raw_app_meta_data ->> 'organization_id')::uuid,
      new.email,
      new.raw_user_meta_data ->> 'full_name',
      coalesce((new.raw_app_meta_data ->> 'role')::public.app_role, 'usuario')
    );
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Helpers de autorización (security definer para evitar recursión RLS) ───

create function public.current_org_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select organization_id from public.profiles
  where id = auth.uid() and active
$$;

create function public.is_org_admin()
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

create function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and active and is_platform_admin
  )
$$;

-- ─── Lotes (batch) ──────────────────────────────────────────────────────────

create table public.lotes (
  id                 uuid primary key default gen_random_uuid(),
  organization_id    uuid not null references public.organizations (id),
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

create index lotes_organization_id_idx on public.lotes (organization_id, created_at desc);

-- ─── Solicitudes (lo que el usuario ve: datos de entrada + estado) ──────────

create table public.solicitudes (
  id                    uuid primary key default gen_random_uuid(),
  numero                bigint generated always as identity unique,  -- Referencia: SOL-000123
  organization_id       uuid not null default public.current_org_id() references public.organizations (id),
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

create index solicitudes_org_created_idx on public.solicitudes (organization_id, created_at desc);
create index solicitudes_created_by_idx on public.solicitudes (created_by, created_at desc);
create index solicitudes_pendientes_idx on public.solicitudes (estado) where estado in ('enviada', 'procesando');
create index solicitudes_report_id_idx on public.solicitudes (tusdatos_report_id);

create trigger solicitudes_updated_at before update on public.solicitudes
  for each row execute function public.set_updated_at();

-- ─── Resultados (SOLO admin: hallazgos, reporte, revisión) ──────────────────

create table public.solicitud_resultados (
  solicitud_id          uuid primary key references public.solicitudes (id) on delete cascade,
  organization_id       uuid not null references public.organizations (id),
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

create index solicitud_resultados_org_idx on public.solicitud_resultados (organization_id, hallazgo_nivel);

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
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid references public.organizations (id),
  event_name       text not null,
  payload          jsonb not null,
  processed_at     timestamptz,
  error            text,
  received_at      timestamptz not null default now()
);

create index webhook_events_org_idx on public.webhook_events (organization_id, received_at desc);

create table public.audit_logs (
  id               bigint generated always as identity primary key,
  organization_id  uuid references public.organizations (id),
  actor_id         uuid references public.profiles (id),
  accion           text not null,   -- p.ej. 'solicitud.crear', 'estudio.aprobar', 'usuario.desactivar'
  entidad          text,
  entidad_id       text,
  metadata         jsonb,
  ip               inet,
  user_agent       text,
  created_at       timestamptz not null default now()
);

create index audit_logs_org_idx on public.audit_logs (organization_id, created_at desc);

-- ════════════════════════════════════════════════════════════════════════════
-- Row Level Security
-- ════════════════════════════════════════════════════════════════════════════

alter table public.organizations        enable row level security;
alter table public.organization_secrets enable row level security;
alter table public.profiles             enable row level security;
alter table public.lotes                enable row level security;
alter table public.solicitudes          enable row level security;
alter table public.solicitud_resultados enable row level security;
alter table public.webhook_events       enable row level security;
alter table public.audit_logs           enable row level security;

-- Privilegios mínimos para el rol "authenticated" (las políticas filtran filas,
-- los GRANT por columna limitan qué se puede escribir).
revoke all on all tables in schema public from anon, authenticated;

grant select on public.organizations, public.profiles, public.lotes, public.solicitudes,
  public.solicitud_resultados, public.webhook_events, public.audit_logs to authenticated;

grant update (full_name) on public.profiles to authenticated;

grant insert (tipo_documento, documento, nombre, fecha_expedicion, placa,
  tipo_doc_propietario, autorizacion_titular, autorizacion_soporte)
  on public.solicitudes to authenticated;

grant update (revision_estado, revision_comentario) on public.solicitud_resultados to authenticated;

-- organizations
create policy "org: miembros leen su organización" on public.organizations
  for select to authenticated
  using (id = public.current_org_id() or public.is_platform_admin());

-- profiles
create policy "profiles: leer el propio" on public.profiles
  for select to authenticated
  using (id = auth.uid());

create policy "profiles: admin lee los de su organización" on public.profiles
  for select to authenticated
  using ((organization_id = public.current_org_id() and public.is_org_admin()) or public.is_platform_admin());

create policy "profiles: editar el propio nombre" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- solicitudes
create policy "solicitudes: usuario ve las suyas, admin las de su organización" on public.solicitudes
  for select to authenticated
  using (
    (organization_id = public.current_org_id() and (created_by = auth.uid() or public.is_org_admin()))
    or public.is_platform_admin()
  );

create policy "solicitudes: crear en su organización" on public.solicitudes
  for insert to authenticated
  with check (organization_id = public.current_org_id() and created_by = auth.uid());

-- solicitud_resultados (solo admin)
create policy "resultados: admin lee los de su organización" on public.solicitud_resultados
  for select to authenticated
  using ((organization_id = public.current_org_id() and public.is_org_admin()) or public.is_platform_admin());

create policy "resultados: admin revisa los de su organización" on public.solicitud_resultados
  for update to authenticated
  using (organization_id = public.current_org_id() and public.is_org_admin())
  with check (organization_id = public.current_org_id() and public.is_org_admin());

-- lotes, webhook_events, audit_logs (solo admin, lectura)
create policy "lotes: admin lee los de su organización" on public.lotes
  for select to authenticated
  using ((organization_id = public.current_org_id() and public.is_org_admin()) or public.is_platform_admin());

create policy "webhooks: admin lee los de su organización" on public.webhook_events
  for select to authenticated
  using ((organization_id = public.current_org_id() and public.is_org_admin()) or public.is_platform_admin());

create policy "auditoria: admin lee la de su organización" on public.audit_logs
  for select to authenticated
  using ((organization_id = public.current_org_id() and public.is_org_admin()) or public.is_platform_admin());

-- ─── Realtime (respeta RLS) ─────────────────────────────────────────────────

alter publication supabase_realtime add table public.solicitudes, public.solicitud_resultados;

-- ─── Storage: reportes PDF y soportes de autorización ──────────────────────
-- Convención de rutas: {organization_id}/{solicitud_id}.pdf

insert into storage.buckets (id, name, public)
values ('reportes', 'reportes', false), ('autorizaciones', 'autorizaciones', false);

create policy "reportes: admin lee los de su organización" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'reportes'
    and (storage.foldername(name))[1] = public.current_org_id()::text
    and public.is_org_admin()
  );

create policy "autorizaciones: miembros suben a su organización" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'autorizaciones'
    and (storage.foldername(name))[1] = public.current_org_id()::text
  );

create policy "autorizaciones: admin lee las de su organización" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'autorizaciones'
    and (storage.foldername(name))[1] = public.current_org_id()::text
    and public.is_org_admin()
  );
