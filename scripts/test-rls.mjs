/**
 * Pruebas de RLS sin Docker: aplica supabase/migrations/*.sql + seed.sql en un Postgres
 * embebido (PGlite) con stubs mínimos de Supabase (auth, storage, roles) y verifica permisos.
 *
 * Uso: npm run db:test
 */
import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const migrationsDir = path.join(root, "supabase", "migrations");
const migrations = fs
  .readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort()
  .map((f) => fs.readFileSync(path.join(migrationsDir, f), "utf8"));
const seed = fs.readFileSync(path.join(root, "supabase", "seed.sql"), "utf8");

const db = new PGlite();

// ─── Stubs de Supabase ──────────────────────────────────────────────────────
await db.exec(`
  create role anon; create role authenticated; create role service_role bypassrls;
  create schema auth; create schema storage;
  create table auth.users (id uuid primary key, email text,
    raw_app_meta_data jsonb default '{}', raw_user_meta_data jsonb default '{}');
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create table storage.buckets (id text primary key, name text, public boolean);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
  alter table storage.objects enable row level security;
  create function storage.foldername(name text) returns text[] language sql as
    $$ select string_to_array(name, '/') $$;
  create publication supabase_realtime;
  grant usage on schema public, auth, storage to anon, authenticated;
`);

for (const sql of migrations) await db.exec(sql);
await db.exec(seed);

// ─── Datos de prueba ────────────────────────────────────────────────────────
const ORG = "00000000-0000-0000-0000-000000000001";
const OTRA_ORG = "00000000-0000-0000-0000-000000000002";
const USUARIO = "11111111-1111-1111-1111-111111111111";
const ADMIN = "22222222-2222-2222-2222-222222222222";
const ADMIN_OTRA = "33333333-3333-3333-3333-333333333333";

await db.exec(
  `insert into public.organizations (id, name, slug) values ('${OTRA_ORG}', 'Otra', 'otra')`,
);
for (const [id, role, org, email] of [
  [USUARIO, "usuario", ORG, "usuario@elogia.test"],
  [ADMIN, "admin", ORG, "admin@elogia.test"],
  [ADMIN_OTRA, "admin", OTRA_ORG, "admin@otra.test"],
]) {
  await db.exec(`insert into auth.users (id, email, raw_app_meta_data, raw_user_meta_data)
    values ('${id}', '${email}', '{"organization_id":"${org}","role":"${role}"}', '{"full_name":"${role}"}')`);
}

async function as(uid, sql) {
  await db.exec(
    `set role ${uid ? "authenticated" : "anon"}; select set_config('request.jwt.claim.sub', '${uid ?? ""}', false);`,
  );
  try {
    return { rows: (await db.query(sql)).rows };
  } catch (e) {
    return { error: e.message };
  } finally {
    await db.exec("reset role;");
  }
}

// ─── Casos ──────────────────────────────────────────────────────────────────
let fallas = 0;
function check(nombre, ok, detalle) {
  console.log(`${ok ? "✓" : "✗"} ${nombre}`);
  if (!ok) {
    fallas++;
    console.log("   ", JSON.stringify(detalle));
  }
}
const ok = (r, n) => !r.error && (n === undefined || r.rows.length === n);
const err = (r) => Boolean(r.error);

let r = await as(
  USUARIO,
  `insert into public.solicitudes (tipo_documento, documento, autorizacion_titular)
  values ('CC', '123', true) returning organization_id, created_by, estado`,
);
check(
  "usuario crea solicitud CC (org y autor salen de la sesión)",
  ok(r, 1) &&
    r.rows[0].organization_id === ORG &&
    r.rows[0].created_by === USUARIO &&
    r.rows[0].estado === "enviada",
  r,
);

r = await as(
  USUARIO,
  `insert into public.solicitudes (tipo_documento, documento, autorizacion_titular) values ('CE', '1', true)`,
);
check("CE sin fecha de expedición se rechaza", err(r), r);

r = await as(
  USUARIO,
  `insert into public.solicitudes (tipo_documento, documento, autorizacion_titular) values ('CC', '1', false)`,
);
check("sin autorización del titular se rechaza", err(r), r);

r = await as(
  USUARIO,
  `insert into public.solicitudes (tipo_documento, documento, autorizacion_titular, estado) values ('CC', '1', true, 'finalizada')`,
);
check("usuario no puede fijar el estado", err(r), r);

r = await as(
  USUARIO,
  `insert into public.solicitudes (tipo_documento, documento, autorizacion_titular, organization_id) values ('CC', '1', true, '${OTRA_ORG}')`,
);
check("usuario no puede elegir organización", err(r), r);

// El sistema (sin RLS) registra el resultado
await db.exec(`insert into public.solicitud_resultados (solicitud_id, organization_id, hallazgo, hallazgo_nivel)
  select id, organization_id, true, 'alto' from public.solicitudes`);

r = await as(USUARIO, `select * from public.solicitud_resultados`);
check("usuario NO ve resultados/hallazgos", ok(r, 0), r);

r = await as(USUARIO, `select id from public.solicitudes`);
check("usuario ve sus solicitudes", ok(r, 1), r);

r = await as(
  USUARIO,
  `update public.profiles set role = 'admin' where id = '${USUARIO}'`,
);
check("usuario no puede subirse a admin", err(r), r);

r = await as(
  USUARIO,
  `update public.profiles set full_name = 'Nuevo' where id = '${USUARIO}' returning full_name`,
);
check("usuario edita su nombre", ok(r, 1), r);

r = await as(USUARIO, `select id from public.profiles`);
check("usuario solo ve su perfil", ok(r, 1), r);

r = await as(ADMIN, `select hallazgo_nivel from public.solicitud_resultados`);
check(
  "admin ve resultados de su org",
  ok(r, 1) && r.rows[0].hallazgo_nivel === "alto",
  r,
);

r = await as(
  ADMIN,
  `update public.solicitud_resultados set revision_estado = 'aprobado' returning revisado_por`,
);
check(
  "admin aprueba y queda registrado quién",
  ok(r, 1) && r.rows[0].revisado_por === ADMIN,
  r,
);

r = await as(
  ADMIN,
  `update public.solicitud_resultados set hallazgo_nivel = 'bajo'`,
);
check("admin no puede alterar el hallazgo", err(r), r);

r = await as(ADMIN, `select id from public.profiles`);
check("admin ve perfiles de su org (2)", ok(r, 2), r);

r = await as(ADMIN_OTRA, `select id from public.solicitudes`);
check("admin de otra org no ve solicitudes ajenas", ok(r, 0), r);

r = await as(
  ADMIN_OTRA,
  `select solicitud_id from public.solicitud_resultados`,
);
check("admin de otra org no ve resultados ajenos", ok(r, 0), r);

await db.exec(
  `update public.profiles set active = false where id = '${ADMIN}'`,
);
r = await as(ADMIN, `select solicitud_id from public.solicitud_resultados`);
check("admin desactivado pierde acceso", ok(r, 0), r);

r = await as(null, `select id from public.solicitudes`);
check("anónimo no lee nada", err(r), r);

console.log(
  fallas
    ? `\n${fallas} prueba(s) fallaron`
    : "\nTodas las pruebas de RLS pasaron",
);
process.exit(fallas ? 1 : 0);
