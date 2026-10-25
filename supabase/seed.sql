-- Datos mínimos para desarrollo local (`npm run db:reset`).
-- Los usuarios se crean desde la app (o el Studio local) con app_metadata:
--   { "organization_id": "00000000-0000-0000-0000-000000000001", "role": "admin" }
insert into public.organizations (id, name, slug, nit)
values ('00000000-0000-0000-0000-000000000001', 'Elogia Soluciones Logísticas', 'elogia', null);
