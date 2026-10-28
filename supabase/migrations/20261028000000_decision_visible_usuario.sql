-- ════════════════════════════════════════════════════════════════════════════
-- ELOGIX — El usuario ve la DECISIÓN del admin (no los hallazgos) · 2026-10-28
--
-- Se aplica después de las migraciones anteriores (pegar en el SQL Editor).
--
-- La decisión vive en solicitud_resultados (solo admin). Un trigger copia a
-- `solicitudes` ÚNICAMENTE la decisión y el comentario, para que el usuario los
-- vea junto a su solicitud. Los hallazgos, fuentes y reporte siguen siendo solo
-- del admin. El usuario no puede escribir estas columnas (no tiene grant).
-- ════════════════════════════════════════════════════════════════════════════

alter table public.solicitudes
  add column if not exists decision public.revision_estado not null default 'pendiente',
  add column if not exists decision_comentario text,
  add column if not exists decision_at timestamptz;

create or replace function public.sincronizar_decision()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.solicitudes
  set decision            = new.revision_estado,
      decision_comentario = case when new.revision_estado = 'pendiente' then null else new.revision_comentario end,
      decision_at         = case when new.revision_estado = 'pendiente' then null else now() end
  where id = new.solicitud_id;
  return new;
end;
$$;

drop trigger if exists solicitud_resultados_sincronizar_decision on public.solicitud_resultados;
create trigger solicitud_resultados_sincronizar_decision
  after insert or update of revision_estado, revision_comentario on public.solicitud_resultados
  for each row execute function public.sincronizar_decision();

-- Decisiones ya tomadas antes de esta migración
update public.solicitudes s
set decision            = r.revision_estado,
    decision_comentario = case when r.revision_estado = 'pendiente' then null else r.revision_comentario end,
    decision_at         = case when r.revision_estado = 'pendiente' then null else r.revisado_at end
from public.solicitud_resultados r
where r.solicitud_id = s.id;
