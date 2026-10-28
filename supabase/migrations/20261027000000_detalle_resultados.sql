-- ════════════════════════════════════════════════════════════════════════════
-- ELOGIX — Detalle de resultados para el revisor del admin (2026-10-27)
--
-- Se aplica DESPUÉS de 20261025000000_init.sql (pegar en el SQL Editor de
-- Supabase). Solo agrega columnas a una tabla de acceso exclusivo del admin.
-- ════════════════════════════════════════════════════════════════════════════

alter table public.solicitud_resultados
  -- Nombre que devuelve TusDatos (persona, empresa o vehículo consultado)
  add column if not exists nombre_consultado text,
  -- Hallazgos del reporte: [{ nivel, codigo, fuente, titulo, descripcion }]
  -- (en modo real, de GET /api/report_json/{id} → dict_hallazgos)
  add column if not exists hallazgos jsonb not null default '[]'::jsonb,
  -- Reintentos de fuentes con error (GET /api/retry/{id}, no consumen créditos)
  add column if not exists reintentos int not null default 0;
