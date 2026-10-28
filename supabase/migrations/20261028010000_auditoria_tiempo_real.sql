-- ════════════════════════════════════════════════════════════════════════════
-- ELOGIX — Auditoría en tiempo real · 2026-10-28
--
-- Se aplica después de las migraciones anteriores (pegar en el SQL Editor).
-- Publica audit_logs en Supabase Realtime para que la pantalla de Auditoría
-- se actualice sola. Realtime respeta RLS: solo los admin reciben los eventos.
-- ════════════════════════════════════════════════════════════════════════════

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'audit_logs'
  ) then
    alter publication supabase_realtime add table public.audit_logs;
  end if;
end;
$$;
