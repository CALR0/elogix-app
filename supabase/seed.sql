-- ════════════════════════════════════════════════════════════════════════════
-- Primer administrador (una sola vez, sin terminal)
--
-- 1. Supabase → Authentication → Users → Add user → Create new user
--    (correo + contraseña, marca "Auto Confirm User").
-- 2. Supabase → SQL Editor → New query: pega esto, cambia el correo y el
--    nombre, y dale Run.
--
-- Después, ese admin crea los demás usuarios desde ELOGIX → Usuarios.
-- ════════════════════════════════════════════════════════════════════════════

update auth.users
set raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}'
where email = 'tu-correo@elogia.com';

update public.profiles
set role = 'admin', full_name = 'Tu Nombre'
where email = 'tu-correo@elogia.com';

-- Comprobación: debe mostrar una fila con role = admin
select email, full_name, role, active from public.profiles;
